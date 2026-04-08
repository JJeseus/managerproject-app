import { getDb } from '../lib/db/client'
import {
  activities as mockActivities,
  notes as mockNotes,
  projects as mockProjects,
  resources as mockResources,
  tasks as mockTasks,
} from '../lib/data'
import {
  activities,
  comments,
  notes,
  projects,
  resources,
  subtasks,
  tasks,
} from '../lib/db/schema'

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

function parseTimestamp(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseDateOnly(value)
  }

  return new Date(value)
}

async function seed() {
  const db = getDb()

  await db.transaction(async (tx) => {
    await tx.delete(comments)
    await tx.delete(subtasks)
    await tx.delete(notes)
    await tx.delete(resources)
    await tx.delete(activities)
    await tx.delete(tasks)
    await tx.delete(projects)

    await tx.insert(projects).values(
      mockProjects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        image: project.image,
        status: project.status,
        priority: project.priority,
        startDate: parseDateOnly(project.startDate),
        dueDate: parseDateOnly(project.dueDate),
        progress: project.progress,
        tags: project.tags,
      }))
    )

    await tx.insert(tasks).values(
      mockTasks.map((task) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        status: task.status,
        priority: task.priority,
        dueDate: parseDateOnly(task.dueDate),
        tags: task.tags,
      }))
    )

    const allSubtasks = mockTasks.flatMap((task) =>
      (task.subtasks ?? []).map((subtask) => ({
        id: subtask.id,
        taskId: task.id,
        title: subtask.title,
        completed: subtask.completed,
        result: subtask.result ?? 'pending',
        resultNote: subtask.resultNote,
      }))
    )

    if (allSubtasks.length > 0) {
      await tx.insert(subtasks).values(allSubtasks)
    }

    const allComments = mockTasks.flatMap((task) =>
      (task.comments ?? []).map((comment) => ({
        id: comment.id,
        taskId: task.id,
        author: comment.author,
        content: comment.content,
        timestamp: parseTimestamp(comment.timestamp),
      }))
    )

    if (allComments.length > 0) {
      await tx.insert(comments).values(allComments)
    }

    await tx.insert(notes).values(
      mockNotes.map((note) => ({
        id: note.id,
        projectId: note.projectId,
        taskId: note.taskId ?? null,
        content: note.content,
        timestamp: parseTimestamp(note.timestamp),
      }))
    )

    await tx.insert(activities).values(
      mockActivities.map((activity) => ({
        id: activity.id,
        type: activity.type,
        description: activity.description,
        timestamp: parseTimestamp(activity.timestamp),
        projectId: activity.projectId ?? null,
        taskId: activity.taskId ?? null,
      }))
    )

    await tx.insert(resources).values(
      mockResources.map((resource) => ({
        id: resource.id,
        projectId: resource.projectId ?? null,
        taskId: resource.taskId ?? null,
        title: resource.title,
        description: resource.description,
        type: resource.type,
        language: resource.language,
        format: resource.format,
        content: resource.content,
        sourceUrl: resource.sourceUrl,
        status: resource.status,
        tags: resource.tags,
        createdAt: parseTimestamp(resource.timestamp),
        updatedAt: parseTimestamp(resource.timestamp),
      }))
    )
  })
}

seed()
  .then(() => {
    console.log('Seed completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Seed falló')
    console.error(error)
    process.exit(1)
  })
