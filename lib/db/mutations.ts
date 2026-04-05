import 'server-only'

import { eq } from 'drizzle-orm'
import { getDb } from './client'
import {
  activities,
  comments,
  notes,
  projects,
  resources,
  resourceLinks,
  subtasks,
  tasks,
} from './schema'
import type {
  AddCommentInput,
  AddNoteInput,
  AddResourceInput,
  AddSubtaskInput,
  CreateProjectInput,
  CreateTaskInput,
  DeleteTaskInput,
  UpdateProjectInput,
  UpdateResourceInput,
  UpdateSubtaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from './types'
import type { Comment, Note, Project, Resource, Subtask, Task } from '@/lib/data'
import {
  attachResourceRelationships,
  mergeResourceTags,
  resolveResourceLinkDrafts,
} from '@/lib/resources/resource-linking'
import { logWarn } from '@/lib/logger'

class MutationError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function mapTask(row: typeof tasks.$inferSelect): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.projectId,
    status: row.status,
    priority: row.priority,
    dueDate: toDateOnlyString(row.dueDate),
    tags: row.tags,
  }
}

function mapSubtask(row: typeof subtasks.$inferSelect): Subtask {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed,
    result: row.result,
    resultNote: row.resultNote ?? undefined,
  }
}

function mapComment(row: typeof comments.$inferSelect): Comment {
  return {
    id: row.id,
    author: row.author,
    content: row.content,
    timestamp: row.timestamp.toISOString(),
  }
}

function mapNote(row: typeof notes.$inferSelect): Note {
  return {
    id: row.id,
    projectId: row.projectId,
    taskId: row.taskId ?? undefined,
    content: row.content,
    timestamp: row.timestamp.toISOString(),
  }
}

function mapResource(row: typeof resources.$inferSelect): Resource {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: row.type,
    language: row.language,
    format: row.format,
    content: row.content,
    sourceUrl: row.sourceUrl,
    status: row.status,
    tags: row.tags,
    timestamp: row.createdAt.toISOString(),
    projectId: row.projectId ?? undefined,
    taskId: row.taskId ?? undefined,
  }
}

function mapResourceLink(
  row: typeof resourceLinks.$inferSelect,
  targetName: string
): NonNullable<Resource['links']>[number] {
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

function mapProject(row: typeof projects.$inferSelect): Project {
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

async function syncProjectProgress(db: ReturnType<typeof getDb>, projectId: string) {
  const taskRows = await db
    .select({ status: tasks.status })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))

  const total = taskRows.length
  const completed = taskRows.filter((task) => task.status === 'done').length
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

  await db
    .update(projects)
    .set({
      progress,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId))
}

async function addActivity(params: {
  type: (typeof activities.$inferInsert)['type']
  description: string
  projectId?: string
  taskId?: string
}) {
  const db = getDb()

  await db.insert(activities).values({
    id: `act-${crypto.randomUUID()}`,
    type: params.type,
    description: params.description,
    timestamp: new Date(),
    projectId: params.projectId,
    taskId: params.taskId,
  })
}

async function buildResourceContext(db: ReturnType<typeof getDb>) {
  const [projectRows, resourceRows, resourceLinkRows] = await Promise.all([
    db.select().from(projects),
    db.select().from(resources),
    (async () => {
      try {
        return await db.select().from(resourceLinks)
      } catch (error) {
        logWarn('No se pudieron leer enlaces de recursos al hidratar contexto.', {
          operation: 'buildResourceContext',
          reason: error instanceof Error ? error.message : 'unknown',
        })
        return []
      }
    })(),
  ])

  const mappedProjects = projectRows.map(mapProject)
  const mappedResources = resourceRows.map(mapResource)
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

  return {
    projects: mappedProjects,
    resources: mappedResources,
    links: mappedLinks,
  }
}

async function buildResourceRelationsForSource(
  db: ReturnType<typeof getDb>,
  sourceResource: Resource
) {
  const context = await buildResourceContext(db)
  const { drafts, unresolved } = resolveResourceLinkDrafts(
    sourceResource.id,
    [sourceResource.description, sourceResource.content],
    {
      projects: context.projects,
      resources: context.resources,
    }
  )

  try {
    await db.delete(resourceLinks).where(eq(resourceLinks.sourceResourceId, sourceResource.id))

    if (drafts.length > 0) {
      await db.insert(resourceLinks).values(
        drafts.map((draft) => ({
          id: `res-link-${crypto.randomUUID()}`,
          sourceResourceId: sourceResource.id,
          targetType: draft.targetType,
          targetId: draft.targetId,
          label: draft.label,
          createdAt: new Date(),
        }))
      )
    }
  } catch (error) {
    logWarn('No se pudieron sincronizar enlaces de recursos; se continúa sin persistirlos.', {
      operation: 'buildResourceRelationsForSource',
      reason: error instanceof Error ? error.message : 'unknown',
      resourceId: sourceResource.id,
    })
  }

  return unresolved
}

async function getHydratedResourceById(db: ReturnType<typeof getDb>, resourceId: string) {
  const context = await buildResourceContext(db)
  const enrichedResources = attachResourceRelationships(
    context.resources.map((resource) => {
      const unresolved =
        resource.id === resourceId
          ? resolveResourceLinkDrafts(resource.id, [resource.description, resource.content], {
              projects: context.projects,
              resources: context.resources,
            }).unresolved
          : []

      return {
        ...resource,
        unresolvedLinks: unresolved,
      }
    }),
    context.projects,
    context.links
  )

  return enrichedResources.find((resource) => resource.id === resourceId) ?? null
}

export async function createTask(input: CreateTaskInput) {
  const db = getDb()
  const taskId = `task-${crypto.randomUUID()}`

  const [task] = await db
    .insert(tasks)
    .values({
      id: taskId,
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      status: 'todo',
      priority: input.priority,
      dueDate: parseDateOnly(input.dueDate),
      tags: input.tags,
    })
    .returning()

  if (!task) {
    throw new MutationError('TASK_CREATE_FAILED', 'No se pudo crear la tarea.', 500)
  }

  await syncProjectProgress(db, input.projectId)

  await addActivity({
    type: 'task_created',
    description: `Se creó la tarea "${input.title}".`,
    projectId: input.projectId,
    taskId: task.id,
  })

  return { task: mapTask(task) }
}

export async function createProject(input: CreateProjectInput) {
  const db = getDb()
  const projectId = `proj-${crypto.randomUUID()}`

  const [project] = await db
    .insert(projects)
    .values({
      id: projectId,
      name: input.name,
      description: input.description,
      image: input.image,
      status: input.status,
      priority: input.priority,
      startDate: parseDateOnly(input.startDate),
      dueDate: parseDateOnly(input.dueDate),
      progress: input.progress,
      tags: input.tags,
    })
    .returning()

  if (!project) {
    throw new MutationError(
      'PROJECT_CREATE_FAILED',
      'No se pudo crear el proyecto.',
      500
    )
  }

  await addActivity({
    type: 'project_updated',
    description: `Se creó el proyecto "${input.name}".`,
    projectId: project.id,
  })

  return { project: mapProject(project) }
}

export async function updateTask(input: UpdateTaskInput) {
  const db = getDb()
  const patch: Partial<typeof tasks.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (typeof input.patch.title !== 'undefined') patch.title = input.patch.title
  if (typeof input.patch.description !== 'undefined') {
    patch.description = input.patch.description
  }
  if (typeof input.patch.status !== 'undefined') patch.status = input.patch.status
  if (typeof input.patch.priority !== 'undefined') {
    patch.priority = input.patch.priority
  }
  if (typeof input.patch.dueDate !== 'undefined') {
    patch.dueDate = parseDateOnly(input.patch.dueDate)
  }
  if (typeof input.patch.tags !== 'undefined') patch.tags = input.patch.tags

  const [task] = await db
    .update(tasks)
    .set(patch)
    .where(eq(tasks.id, input.taskId))
    .returning()

  if (!task) {
    throw new MutationError('TASK_NOT_FOUND', 'La tarea no existe.', 404)
  }

  await syncProjectProgress(db, task.projectId)

  await addActivity({
    type: 'project_updated',
    description: `Se actualizó la tarea "${task.title}".`,
    projectId: task.projectId,
    taskId: task.id,
  })

  return { task: mapTask(task) }
}

export async function deleteTask(input: DeleteTaskInput) {
  const db = getDb()

  const [task] = await db
    .delete(tasks)
    .where(eq(tasks.id, input.taskId))
    .returning()

  if (!task) {
    throw new MutationError('TASK_NOT_FOUND', 'La tarea no existe.', 404)
  }

  await syncProjectProgress(db, task.projectId)

  await addActivity({
    type: 'project_updated',
    description: `Se eliminó la tarea "${task.title}".`,
    projectId: task.projectId,
  })

  return {
    taskId: task.id,
  }
}

export async function updateTaskStatus(input: UpdateTaskStatusInput) {
  const db = getDb()

  const [task] = await db
    .update(tasks)
    .set({
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, input.taskId))
    .returning()

  if (!task) {
    throw new MutationError('TASK_NOT_FOUND', 'La tarea no existe.', 404)
  }

  await syncProjectProgress(db, task.projectId)

  await addActivity({
    type: input.status === 'done' ? 'task_completed' : 'status_changed',
    description:
      input.status === 'done'
        ? `Se completó la tarea "${task.title}".`
        : `La tarea "${task.title}" cambió a estado ${input.status}.`,
    projectId: task.projectId,
    taskId: task.id,
  })

  return {
    taskId: task.id,
    status: task.status,
  }
}

export async function addSubtask(input: AddSubtaskInput) {
  const db = getDb()

  const [task] = await db
    .select({ id: tasks.id, projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, input.taskId))

  if (!task) {
    throw new MutationError('TASK_NOT_FOUND', 'La tarea no existe.', 404)
  }

  const [subtask] = await db
    .insert(subtasks)
    .values({
      id: `st-${crypto.randomUUID()}`,
      taskId: input.taskId,
      title: input.title,
      completed: false,
      result: 'pending',
    })
    .returning()

  if (!subtask) {
    throw new MutationError(
      'SUBTASK_CREATE_FAILED',
      'No se pudo crear la subtarea.',
      500
    )
  }

  await addActivity({
    type: 'project_updated',
    description: `Se agregó una subtarea: "${input.title}".`,
    projectId: task.projectId,
    taskId: input.taskId,
  })

  return {
    taskId: input.taskId,
    subtask: mapSubtask(subtask),
  }
}

export async function updateSubtask(input: UpdateSubtaskInput) {
  const db = getDb()
  const patch: Partial<typeof subtasks.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (typeof input.patch.completed !== 'undefined') {
    patch.completed = input.patch.completed
  }

  if (typeof input.patch.result !== 'undefined') {
    patch.result = input.patch.result

    if (input.patch.result === 'pending') {
      patch.completed = false
    } else if (typeof input.patch.completed === 'undefined') {
      patch.completed = true
    }
  }

  if (typeof input.patch.resultNote !== 'undefined') {
    patch.resultNote = input.patch.resultNote
  }

  const [subtask] = await db
    .update(subtasks)
    .set(patch)
    .where(eq(subtasks.id, input.subtaskId))
    .returning()

  if (!subtask) {
    throw new MutationError('SUBTASK_NOT_FOUND', 'La subtarea no existe.', 404)
  }

  const [task] = await db
    .select({ id: tasks.id, projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, subtask.taskId))

  return {
    taskId: subtask.taskId,
    projectId: task?.projectId,
    subtask: mapSubtask(subtask),
  }
}

export async function addComment(input: AddCommentInput) {
  const db = getDb()

  const [task] = await db
    .select({ id: tasks.id, projectId: tasks.projectId })
    .from(tasks)
    .where(eq(tasks.id, input.taskId))

  if (!task) {
    throw new MutationError('TASK_NOT_FOUND', 'La tarea no existe.', 404)
  }

  const [comment] = await db
    .insert(comments)
    .values({
      id: `cmt-${crypto.randomUUID()}`,
      taskId: input.taskId,
      author: 'Tú',
      content: input.content,
      timestamp: new Date(),
    })
    .returning()

  if (!comment) {
    throw new MutationError(
      'COMMENT_CREATE_FAILED',
      'No se pudo agregar el comentario.',
      500
    )
  }

  await addActivity({
    type: 'note_added',
    description: 'Se agregó un comentario a la tarea.',
    projectId: task.projectId,
    taskId: task.id,
  })

  return {
    taskId: input.taskId,
    comment: mapComment(comment),
  }
}

export async function addNote(input: AddNoteInput) {
  const db = getDb()

  const [note] = await db
    .insert(notes)
    .values({
      id: `note-${crypto.randomUUID()}`,
      projectId: input.projectId,
      taskId: input.taskId,
      content: input.content,
      timestamp: new Date(),
    })
    .returning()

  if (!note) {
    throw new MutationError('NOTE_CREATE_FAILED', 'No se pudo crear la nota.', 500)
  }

  await addActivity({
    type: 'note_added',
    description: 'Se agregó una nota al proyecto.',
    projectId: input.projectId,
    taskId: input.taskId,
  })

  return {
    projectId: input.projectId,
    note: mapNote(note),
  }
}

export async function addResource(input: AddResourceInput) {
  const db = getDb()
  const mergedTags = mergeResourceTags(input.tags, [input.description, input.content])
  const resourceId = `res-${crypto.randomUUID()}`

  const [resource] = await db
    .insert(resources)
    .values({
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
      id: resourceId,
      title: input.title,
      description: input.description,
      type: input.type,
      language: input.language,
      format: input.format,
      content: input.content,
      sourceUrl: input.sourceUrl,
      status: input.status,
      tags: mergedTags,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()

  if (!resource) {
    throw new MutationError('RESOURCE_CREATE_FAILED', 'No se pudo guardar el recurso.', 500)
  }

  const unresolvedLinks = await buildResourceRelationsForSource(db, mapResource(resource))
  const hydratedResource = await getHydratedResourceById(db, resource.id)

  await addActivity({
    type: 'note_added',
    description: `Se agregó el recurso "${input.title}".`,
    projectId: input.projectId ?? undefined,
    taskId: input.taskId ?? undefined,
  })

  return {
    resource: hydratedResource ?? {
      ...mapResource(resource),
      unresolvedLinks,
    },
  }
}

export async function updateResource(input: UpdateResourceInput) {
  const db = getDb()
  const existing = await db.query.resources.findFirst({
    where: eq(resources.id, input.resourceId),
  })

  if (!existing) {
    throw new MutationError('RESOURCE_NOT_FOUND', 'El recurso no existe.', 404)
  }

  const nextDescription =
    typeof input.patch.description !== 'undefined' ? input.patch.description : existing.description
  const nextContent =
    typeof input.patch.content !== 'undefined' ? input.patch.content : existing.content
  const nextTags = mergeResourceTags(
    typeof input.patch.tags !== 'undefined' ? input.patch.tags : existing.tags,
    [nextDescription, nextContent]
  )
  const patch: Partial<typeof resources.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (typeof input.patch.title !== 'undefined') patch.title = input.patch.title
  if (typeof input.patch.description !== 'undefined') {
    patch.description = input.patch.description
  }
  if (typeof input.patch.type !== 'undefined') patch.type = input.patch.type
  if (typeof input.patch.language !== 'undefined') {
    patch.language = input.patch.language
  }
  if (typeof input.patch.format !== 'undefined') patch.format = input.patch.format
  if (typeof input.patch.content !== 'undefined') patch.content = input.patch.content
  if (typeof input.patch.sourceUrl !== 'undefined') {
    patch.sourceUrl = input.patch.sourceUrl
  }
  if (typeof input.patch.status !== 'undefined') patch.status = input.patch.status
  patch.tags = nextTags
  if (typeof input.patch.projectId !== 'undefined') {
    patch.projectId = input.patch.projectId ?? null
  }
  if (typeof input.patch.taskId !== 'undefined') patch.taskId = input.patch.taskId ?? null

  const [resource] = await db
    .update(resources)
    .set(patch)
    .where(eq(resources.id, input.resourceId))
    .returning()

  if (!resource) {
    throw new MutationError('RESOURCE_NOT_FOUND', 'El recurso no existe.', 404)
  }

  const unresolvedLinks = await buildResourceRelationsForSource(db, mapResource(resource))
  const hydratedResource = await getHydratedResourceById(db, resource.id)

  return {
    resource: hydratedResource ?? {
      ...mapResource(resource),
      unresolvedLinks,
    },
  }
}

export async function updateProject(input: UpdateProjectInput) {
  const db = getDb()
  const patch: Partial<typeof projects.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (typeof input.patch.name !== 'undefined') patch.name = input.patch.name
  if (typeof input.patch.description !== 'undefined') {
    patch.description = input.patch.description
  }
  if (typeof input.patch.status !== 'undefined') patch.status = input.patch.status
  if (typeof input.patch.priority !== 'undefined') {
    patch.priority = input.patch.priority
  }
  if (typeof input.patch.startDate !== 'undefined') {
    patch.startDate = parseDateOnly(input.patch.startDate)
  }
  if (typeof input.patch.dueDate !== 'undefined') {
    patch.dueDate = parseDateOnly(input.patch.dueDate)
  }
  if (typeof input.patch.progress !== 'undefined') {
    patch.progress = input.patch.progress
  }
  if (typeof input.patch.tags !== 'undefined') patch.tags = input.patch.tags
  if (typeof input.patch.image !== 'undefined') patch.image = input.patch.image

  const [project] = await db
    .update(projects)
    .set(patch)
    .where(eq(projects.id, input.projectId))
    .returning()

  if (!project) {
    throw new MutationError('PROJECT_NOT_FOUND', 'El proyecto no existe.', 404)
  }

  await addActivity({
    type: 'project_updated',
    description: `Se actualizó el proyecto "${project.name}".`,
    projectId: project.id,
  })

  return {
    project: mapProject(project),
  }
}

export function isMutationError(error: unknown): error is MutationError {
  return error instanceof MutationError
}
