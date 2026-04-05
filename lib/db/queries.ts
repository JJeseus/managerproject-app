import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import { asc, desc, eq, inArray, ne } from 'drizzle-orm'
import { db } from './client'
import {
  activities as activitiesTable,
  comments as commentsTable,
  notes as notesTable,
  projects as projectsTable,
  subtasks as subtasksTable,
  tasks as tasksTable,
} from './schema'
import {
  getActivities,
  getNotesByProjectId,
  getProjectById,
  getProjectStats,
  getProjects,
  getTasks,
  getTasksByProjectId,
  type Activity,
  type Note,
  type Project,
  type Task,
} from '@/lib/data'
import { logError, logWarn } from '@/lib/logger'

export interface TaskCounts {
  total: number
  completed: number
}

export type TaskCountsByProject = Record<string, TaskCounts>

interface ProjectDetailData {
  project: Project
  tasks: Task[]
  notes: Note[]
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

function mapNote(row: typeof notesTable.$inferSelect): Note {
  return {
    id: row.id,
    projectId: row.projectId,
    taskId: row.taskId ?? undefined,
    content: row.content,
    timestamp: row.timestamp.toISOString(),
  }
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

  if (!db) {
    if (allowDevMockFallback) {
      logWarn('Base de datos no disponible, usando datos de desarrollo.', {
        operation,
      })
      return fallback()
    }

    throw new Error('DATABASE_UNAVAILABLE')
  }

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

export async function getProjectsWithCounts() {
  noStore()

  return withFallback(
    'getProjectsWithCounts',
    async () => {
      const [projectRows, taskRows] = await Promise.all([
        db!.select().from(projectsTable).orderBy(asc(projectsTable.dueDate)),
        db!
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
      const projectRow = await db!.query.projects.findFirst({
        where: eq(projectsTable.id, projectId),
      })

      if (!projectRow) {
        return null
      }

      const [taskRows, noteRows] = await Promise.all([
        db!
          .select()
          .from(tasksTable)
          .where(eq(tasksTable.projectId, projectId))
          .orderBy(asc(tasksTable.dueDate)),
        db!
          .select()
          .from(notesTable)
          .where(eq(notesTable.projectId, projectId))
          .orderBy(desc(notesTable.timestamp)),
      ])

      const taskIds = taskRows.map((task) => task.id)

      const [subtaskRows, commentRows] =
        taskIds.length > 0
          ? await Promise.all([
              db!
                .select()
                .from(subtasksTable)
                .where(inArray(subtasksTable.taskId, taskIds))
                .orderBy(asc(subtasksTable.createdAt)),
              db!
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
        subtasks: subtasksByTaskId[task.id] ?? undefined,
        comments: commentsByTaskId[task.id] ?? undefined,
      }))

      return {
        project: mapProject(projectRow),
        tasks,
        notes: noteRows.map(mapNote),
      }
    },
    () => {
      const project = getProjectById(projectId)

      if (!project) {
        return null
      }

      return {
        project,
        tasks: getTasksByProjectId(projectId),
        notes: getNotesByProjectId(projectId),
      }
    }
  )
}

export async function getDashboardStats(): Promise<ProjectStats> {
  noStore()

  return withFallback(
    'getDashboardStats',
    async () => {
      const [projectRows, taskRows] = await Promise.all([
        db!.select({ status: projectsTable.status }).from(projectsTable),
        db!
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
      const rows = await db!
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
      const rows = await db!
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
      const [taskRows, projectRows] = await Promise.all([
        db!
          .select()
          .from(tasksTable)
          .orderBy(asc(tasksTable.dueDate)),
        db!
          .select()
          .from(projectsTable)
          .orderBy(asc(projectsTable.dueDate)),
      ])

      const taskIds = taskRows.map((task) => task.id)
      const [subtaskRows, commentRows] =
        taskIds.length > 0
          ? await Promise.all([
              db!
                .select()
                .from(subtasksTable)
                .where(inArray(subtasksTable.taskId, taskIds))
                .orderBy(asc(subtasksTable.createdAt)),
              db!
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
