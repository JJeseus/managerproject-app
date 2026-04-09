import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { asc, desc, eq, inArray, ne } from 'drizzle-orm'
import { getDb } from './client'
import {
  activities as activitiesTable,
  comments as commentsTable,
  notes as notesTable,
  projectRoadmapItems as projectRoadmapItemsTable,
  projects as projectsTable,
  resources as resourcesTable,
  resourceLinks as resourceLinksTable,
  subtasks as subtasksTable,
  tasks as tasksTable,
} from './schema'
import {
  getActivities,
  getNotesByProjectId,
  getRecentResources,
  getResourceLinks,
  getRoadmapItemsByProjectId,
  getProjectById,
  getProjectStats,
  getProjects,
  getTasks,
  getTasksByProjectId,
  type Activity,
  type Note,
  type Project,
  type RoadmapItem,
  type Resource,
  type ResourceGraphEdge,
  type ResourceLink,
  type Task,
} from '@/lib/data'
import { logError, logWarn } from '@/lib/logger'
import {
  attachResourceRelationships,
  buildResourceGraphEdges,
  resolveResourceLinkDrafts,
} from '@/lib/resources/resource-linking'
import { sortRoadmapItems } from '@/lib/projects/roadmap'

export interface TaskCounts {
  total: number
  completed: number
}

export type TaskCountsByProject = Record<string, TaskCounts>

interface ProjectDetailData {
  project: Project
  tasks: Task[]
  notes: Note[]
  resources: Resource[]
  roadmapItems: RoadmapItem[]
}

export interface ResourceWithProject extends Resource {
  project?: Project
}

export interface ResourcesGraphData {
  projects: Project[]
  resources: Resource[]
  edges: ResourceGraphEdge[]
}

type ProjectStats = ReturnType<typeof getProjectStats>

function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function mapProject(row: typeof projectsTable.$inferSelect): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    status: row.status,
    priority: row.priority,
    startDate: toDateOnlyString(row.startDate),
    dueDate: toDateOnlyString(row.dueDate),
    progress: row.progress,
    tags: row.tags,
  }
}

function mapActivity(row: typeof activitiesTable.$inferSelect): Activity {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    timestamp: row.timestamp.toISOString(),
    projectId: row.projectId ?? undefined,
    taskId: row.taskId ?? undefined,
  }
}

function mapRoadmapItem(row: typeof projectRoadmapItemsTable.$inferSelect): RoadmapItem {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    status: row.status,
    position: row.position,
    startDate: row.startDate ? toDateOnlyString(row.startDate) : undefined,
    dueDate: row.dueDate ? toDateOnlyString(row.dueDate) : undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function mapNote(row: typeof notesTable.$inferSelect): Note {
  return {
    id: row.id,
    projectId: row.projectId,
    taskId: row.taskId ?? undefined,
    content: row.content,
    timestamp: row.timestamp.toISOString(),
  }
}

function mapResource(row: typeof resourcesTable.$inferSelect): Resource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    language: row.language,
    format: row.format,
    content: row.content,
    projectId: row.projectId ?? undefined,
    taskId: row.taskId ?? undefined,
    sourceUrl: row.sourceUrl,
    status: row.status,
    tags: row.tags,
    timestamp: row.createdAt.toISOString(),
  }
}

function mapResourceLink(row: typeof resourceLinksTable.$inferSelect, targetName: string): ResourceLink {
  return {
    id: row.id,
    sourceResourceId: row.sourceResourceId,
    targetType: row.targetType,
    targetId: row.targetId,
    targetName,
    label: row.label || undefined,
    createdAt: row.createdAt.toISOString(),
  }
}

function hydrateWorkspaceResources(
  projects: Project[],
  resources: Resource[],
  links: ResourceLink[]
) {
  const withUnresolved = resources.map((resource) => ({
    ...resource,
    unresolvedLinks: resolveResourceLinkDrafts(resource.id, [resource.description, resource.content], {
      projects,
      resources,
    }).unresolved,
  }))

  return attachResourceRelationships(withUnresolved, projects, links)
}

function buildSubtasksByTaskId(rows: Array<typeof subtasksTable.$inferSelect>) {
  return rows.reduce<Record<string, Task['subtasks']>>((acc, subtask) => {
    const currentSubtasks = acc[subtask.taskId] ?? []

    currentSubtasks.push({
      id: subtask.id,
      title: subtask.title,
      completed: subtask.completed,
      result: subtask.result,
      resultNote: subtask.resultNote ?? undefined,
    })
    acc[subtask.taskId] = currentSubtasks

    return acc
  }, {})
}

function buildCommentsByTaskId(rows: Array<typeof commentsTable.$inferSelect>) {
  return rows.reduce<Record<string, Task['comments']>>((acc, comment) => {
    const currentComments = acc[comment.taskId] ?? []

    currentComments.push({
      id: comment.id,
      author: comment.author,
      content: comment.content,
      timestamp: comment.timestamp.toISOString(),
    })
    acc[comment.taskId] = currentComments

    return acc
  }, {})
}

function buildTaskCounts(rows: Array<{ projectId: string; status: Task['status'] }>) {
  return rows.reduce<TaskCountsByProject>((acc, row) => {
    if (!acc[row.projectId]) {
      acc[row.projectId] = { total: 0, completed: 0 }
    }

    acc[row.projectId].total += 1

    if (row.status === 'done') {
      acc[row.projectId].completed += 1
    }

    return acc
  }, {})
}

async function withFallback<T>(
  operation: string,
  runDbQuery: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  const allowDevMockFallback =
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_MOCK_FALLBACK_DEV === 'true'

  try {
    return await runDbQuery()
  } catch (error) {
    logError('Error de consulta a base de datos.', error, { operation })

    if (allowDevMockFallback) {
      logWarn('Se aplicó fallback a mock de desarrollo.', { operation })
      return fallback()
    }

    throw error
  }
}

async function selectResourceLinksSafe(db: ReturnType<typeof getDb>) {
  try {
    return await db.select().from(resourceLinksTable)
  } catch (error) {
    logWarn('No se pudieron cargar enlaces de recursos; se continúa sin ellos.', {
      operation: 'resourceLinksTable',
      reason: error instanceof Error ? error.message : 'unknown',
    })
    return []
  }
}

export async function getProjectsWithCounts() {
  noStore()

  return withFallback(
    'getProjectsWithCounts',
    async () => {
      const db = getDb()
      const [projectRows, taskRows] = await Promise.all([
        db.select().from(projectsTable).orderBy(asc(projectsTable.dueDate)),
        db
          .select({
            projectId: tasksTable.projectId,
            status: tasksTable.status,
          })
          .from(tasksTable),
      ])

      return {
        projects: projectRows.map(mapProject),
        taskCountsByProject: buildTaskCounts(taskRows),
      }
    },
    () => {
      const projects = getProjects()
      const taskRows = getTasks().map((task) => ({
        projectId: task.projectId,
        status: task.status,
      }))

      return {
        projects,
        taskCountsByProject: buildTaskCounts(taskRows),
      }
    }
  )
}

export async function getProjectDetailById(
  projectId: string
): Promise<ProjectDetailData | null> {
  noStore()

  return withFallback(
    'getProjectDetailById',
    async () => {
      const db = getDb()
      const projectRow = await db.query.projects.findFirst({
        where: eq(projectsTable.id, projectId),
      })

      if (!projectRow) {
        return null
      }

      const [taskRows, noteRows, roadmapRows, allProjectRows, allResourceRows, resourceLinkRows] =
        await Promise.all([
        db
          .select()
          .from(tasksTable)
          .where(eq(tasksTable.projectId, projectId))
          .orderBy(asc(tasksTable.dueDate)),
        db
          .select()
          .from(notesTable)
          .where(eq(notesTable.projectId, projectId))
          .orderBy(desc(notesTable.timestamp)),
        db
          .select()
          .from(projectRoadmapItemsTable)
          .where(eq(projectRoadmapItemsTable.projectId, projectId))
          .orderBy(asc(projectRoadmapItemsTable.position)),
        db.select().from(projectsTable),
        db.select().from(resourcesTable).orderBy(desc(resourcesTable.createdAt)),
        selectResourceLinksSafe(db),
        ])

      const taskIds = taskRows.map((task) => task.id)

      const [subtaskRows, commentRows] =
        taskIds.length > 0
          ? await Promise.all([
              db
                .select()
                .from(subtasksTable)
                .where(inArray(subtasksTable.taskId, taskIds))
                .orderBy(asc(subtasksTable.createdAt)),
              db
                .select()
                .from(commentsTable)
                .where(inArray(commentsTable.taskId, taskIds))
                .orderBy(asc(commentsTable.timestamp)),
            ])
          : [[], []]

      const subtasksByTaskId = buildSubtasksByTaskId(subtaskRows)
      const commentsByTaskId = buildCommentsByTaskId(commentRows)

      const tasks = taskRows.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        status: task.status,
        priority: task.priority,
        dueDate: toDateOnlyString(task.dueDate),
        tags: task.tags,
        roadmapItemId: task.roadmapItemId ?? undefined,
        subtasks: subtasksByTaskId[task.id] ?? undefined,
        comments: commentsByTaskId[task.id] ?? undefined,
      }))

      const mappedProjects = allProjectRows.map(mapProject)
      const mappedResources = allResourceRows.map(mapResource)
      const projectNamesById = Object.fromEntries(mappedProjects.map((project) => [project.id, project.name]))
      const resourceTitlesById = Object.fromEntries(mappedResources.map((resource) => [resource.id, resource.title]))
      const mappedLinks = resourceLinkRows.map((link) =>
        mapResourceLink(
          link,
          link.targetType === 'project'
            ? (projectNamesById[link.targetId] ?? 'Proyecto')
            : (resourceTitlesById[link.targetId] ?? 'Recurso')
        )
      )
      const hydratedResources = hydrateWorkspaceResources(mappedProjects, mappedResources, mappedLinks)

      return {
        project: mapProject(projectRow),
        tasks,
        notes: noteRows.map(mapNote),
        resources: hydratedResources.filter((resource) => {
          if (resource.projectId === projectId) {
            return true
          }

          return (resource.links ?? []).some(
            (link) => link.targetType === 'project' && link.targetId === projectId
          )
        }),
        roadmapItems: sortRoadmapItems(roadmapRows.map(mapRoadmapItem)),
      }
    },
    () => {
      const project = getProjectById(projectId)

      if (!project) {
        return null
      }

      const allProjects = getProjects()
      const allResources = getRecentResources(100)
      const allLinks = getResourceLinks()
      const hydratedResources = hydrateWorkspaceResources(allProjects, allResources, allLinks)

      return {
        project,
        tasks: getTasksByProjectId(projectId),
        notes: getNotesByProjectId(projectId),
        resources: hydratedResources.filter((resource) => {
          if (resource.projectId === projectId) {
            return true
          }

          return (resource.links ?? []).some(
            (link) => link.targetType === 'project' && link.targetId === projectId
          )
        }),
        roadmapItems: getRoadmapItemsByProjectId(projectId),
      }
    }
  )
}

export async function getDashboardStats(): Promise<ProjectStats> {
  noStore()

  return withFallback(
    'getDashboardStats',
    async () => {
      const db = getDb()
      const [projectRows, taskRows] = await Promise.all([
        db.select({ status: projectsTable.status }).from(projectsTable),
        db
          .select({
            status: tasksTable.status,
            dueDate: tasksTable.dueDate,
          })
          .from(tasksTable),
      ])

      const activeProjects = projectRows.filter(
        (project) => project.status === 'active'
      ).length
      const completedProjects = projectRows.filter(
        (project) => project.status === 'completed'
      ).length
      const totalProjects = projectRows.length

      const totalTasks = taskRows.length
      const completedTasks = taskRows.filter((task) => task.status === 'done').length

      const today = new Date()
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const overdueTasks = taskRows.filter(
        (task) => task.status !== 'done' && task.dueDate < today
      ).length

      const dueThisWeek = taskRows.filter(
        (task) =>
          task.status !== 'done' &&
          task.dueDate >= today &&
          task.dueDate <= weekFromNow
      ).length

      return {
        activeProjects,
        completedProjects,
        totalProjects,
        overdueTasks,
        dueThisWeek,
        totalTasks,
        completedTasks,
      }
    },
    () => getProjectStats()
  )
}

export async function getRecentActivities(limit = 8): Promise<Activity[]> {
  noStore()

  return withFallback(
    'getRecentActivities',
    async () => {
      const db = getDb()
      const rows = await db
        .select()
        .from(activitiesTable)
        .orderBy(desc(activitiesTable.timestamp))
        .limit(limit)

      return rows.map(mapActivity)
    },
    () => getActivities(limit)
  )
}

export async function getProgressProjects(limit = 5): Promise<Project[]> {
  noStore()

  return withFallback(
    'getProgressProjects',
    async () => {
      const db = getDb()
      const rows = await db
        .select()
        .from(projectsTable)
        .where(ne(projectsTable.status, 'completed'))
        .orderBy(asc(projectsTable.dueDate))
        .limit(limit)

      return rows.map(mapProject)
    },
    () =>
      getProjects()
        .filter((project) => project.status !== 'completed')
        .slice(0, limit)
  )
}

export async function getCalendarTasksAndProjects() {
  noStore()

  return withFallback(
    'getCalendarTasksAndProjects',
    async () => {
      const db = getDb()
      const [taskRows, projectRows] = await Promise.all([
        db
          .select()
          .from(tasksTable)
          .orderBy(asc(tasksTable.dueDate)),
        db
          .select()
          .from(projectsTable)
          .orderBy(asc(projectsTable.dueDate)),
      ])

      const taskIds = taskRows.map((task) => task.id)
      const [subtaskRows, commentRows] =
        taskIds.length > 0
          ? await Promise.all([
              db
                .select()
                .from(subtasksTable)
                .where(inArray(subtasksTable.taskId, taskIds))
                .orderBy(asc(subtasksTable.createdAt)),
              db
                .select()
                .from(commentsTable)
                .where(inArray(commentsTable.taskId, taskIds))
                .orderBy(asc(commentsTable.timestamp)),
            ])
          : [[], []]

      const subtasksByTaskId = buildSubtasksByTaskId(subtaskRows)
      const commentsByTaskId = buildCommentsByTaskId(commentRows)

      return {
        tasks: taskRows.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          status: task.status,
          priority: task.priority,
          dueDate: toDateOnlyString(task.dueDate),
          tags: task.tags,
          roadmapItemId: task.roadmapItemId ?? undefined,
          subtasks: subtasksByTaskId[task.id] ?? undefined,
          comments: commentsByTaskId[task.id] ?? undefined,
        })),
        projects: projectRows.map(mapProject),
      }
    },
    () => ({
      tasks: getTasks(),
      projects: getProjects(),
    })
  )
}

export async function getRecentResourcesQuery(limit = 5) {
  noStore()

  return withFallback(
    'getRecentResourcesQuery',
    async () => {
      const db = getDb()
      const [projectRows, resourceRows, resourceLinkRows] = await Promise.all([
        db.select().from(projectsTable),
        db
          .select()
          .from(resourcesTable)
          .orderBy(desc(resourcesTable.createdAt))
          .limit(limit),
        selectResourceLinksSafe(db),
      ])

      const mappedProjects = projectRows.map(mapProject)
      const mappedResources = resourceRows.map(mapResource)
      const projectNamesById = Object.fromEntries(mappedProjects.map((project) => [project.id, project.name]))
      const resourceTitlesById = Object.fromEntries(mappedResources.map((resource) => [resource.id, resource.title]))
      const mappedLinks = resourceLinkRows
        .filter((link) => mappedResources.some((resource) => resource.id === link.sourceResourceId || resource.id === link.targetId))
        .map((link) =>
          mapResourceLink(
            link,
            link.targetType === 'project'
              ? (projectNamesById[link.targetId] ?? 'Proyecto')
              : (resourceTitlesById[link.targetId] ?? 'Recurso')
          )
        )

      return hydrateWorkspaceResources(mappedProjects, mappedResources, mappedLinks)
    },
    () => {
      const projects = getProjects()
      const resources = getRecentResources(limit)
      const links = getResourceLinks().filter((link) =>
        resources.some((resource) => resource.id === link.sourceResourceId || resource.id === link.targetId)
      )

      return hydrateWorkspaceResources(projects, resources, links)
    }
  )
}

export async function getResourcesQuery(limit = 50) {
  noStore()

  return withFallback(
    'getResourcesQuery',
    async () => {
      const db = getDb()
      const [projectRows, resourceRows, resourceLinkRows] = await Promise.all([
        db.select().from(projectsTable),
        db
          .select()
          .from(resourcesTable)
          .orderBy(desc(resourcesTable.createdAt))
          .limit(limit),
        selectResourceLinksSafe(db),
      ])

      const mappedProjects = projectRows.map(mapProject)
      const mappedResources = resourceRows.map(mapResource)
      const projectNamesById = Object.fromEntries(mappedProjects.map((project) => [project.id, project.name]))
      const resourceTitlesById = Object.fromEntries(mappedResources.map((resource) => [resource.id, resource.title]))
      const mappedLinks = resourceLinkRows
        .filter((link) => mappedResources.some((resource) => resource.id === link.sourceResourceId || resource.id === link.targetId))
        .map((link) =>
          mapResourceLink(
            link,
            link.targetType === 'project'
              ? (projectNamesById[link.targetId] ?? 'Proyecto')
              : (resourceTitlesById[link.targetId] ?? 'Recurso')
          )
        )

      return hydrateWorkspaceResources(mappedProjects, mappedResources, mappedLinks)
    },
    () => {
      const projects = getProjects()
      const resources = getRecentResources(limit)
      const links = getResourceLinks().filter((link) =>
        resources.some((resource) => resource.id === link.sourceResourceId || resource.id === link.targetId)
      )

      return hydrateWorkspaceResources(projects, resources, links)
    }
  )
}

export async function getResourcesGraphQuery(limit = 100): Promise<ResourcesGraphData> {
  noStore()

  return withFallback(
    'getResourcesGraphQuery',
    async () => {
      const db = getDb()
      const [projectRows, resourceRows, resourceLinkRows] = await Promise.all([
        db.select().from(projectsTable),
        db
          .select()
          .from(resourcesTable)
          .orderBy(desc(resourcesTable.createdAt))
          .limit(limit),
        selectResourceLinksSafe(db),
      ])

      const mappedProjects = projectRows.map(mapProject)
      const mappedResources = resourceRows.map(mapResource)
      const projectNamesById = Object.fromEntries(mappedProjects.map((project) => [project.id, project.name]))
      const resourceTitlesById = Object.fromEntries(mappedResources.map((resource) => [resource.id, resource.title]))
      const mappedLinks = resourceLinkRows
        .filter((link) => mappedResources.some((resource) => resource.id === link.sourceResourceId || resource.id === link.targetId))
        .map((link) =>
          mapResourceLink(
            link,
            link.targetType === 'project'
              ? (projectNamesById[link.targetId] ?? 'Proyecto')
              : (resourceTitlesById[link.targetId] ?? 'Recurso')
          )
        )

      const resources = hydrateWorkspaceResources(mappedProjects, mappedResources, mappedLinks)

      return {
        projects: mappedProjects,
        resources,
        edges: buildResourceGraphEdges(resources),
      }
    },
    () => {
      const projects = getProjects()
      const resources = hydrateWorkspaceResources(projects, getRecentResources(limit), getResourceLinks())
      return {
        projects,
        resources,
        edges: buildResourceGraphEdges(resources),
      }
    }
  )
}
