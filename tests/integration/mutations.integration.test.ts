import { sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { getDb } from '@/lib/db/client'
import {
  addRoadmapItem,
  assignTaskToRoadmapItem,
  createTask,
  deleteRoadmapItem,
  deleteTask,
  reorderRoadmapItems,
  unassignTaskFromRoadmapItem,
  updateTaskStatus,
} from '@/lib/db/mutations'
import { projects } from '@/lib/db/schema'

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)
const describeIfDatabase = hasDatabaseUrl ? describe : describe.skip

describeIfDatabase('integración de mutaciones', () => {
  let db: ReturnType<typeof getDb>
  const projectId = `itest-proj-${crypto.randomUUID()}`

  beforeAll(async () => {
    db = getDb()
    await db.execute(sql`select 1`)

    await db.insert(projects).values({
      id: projectId,
      name: 'Proyecto de integración',
      description: 'Proyecto temporal para pruebas',
      image: '/placeholder.jpg',
      status: 'active',
      priority: 'medium',
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      dueDate: new Date('2026-04-30T00:00:00.000Z'),
      progress: 0,
      tags: ['itest'],
    })
  })

  it('crea, actualiza y elimina una tarea', async () => {
    const created = await createTask({
      projectId,
      title: 'Tarea de integración',
      description: '',
      priority: 'medium',
      dueDate: '2026-04-10',
      tags: ['itest'],
    })

    expect(created.task.title).toBe('Tarea de integración')

    const updated = await updateTaskStatus({
      taskId: created.task.id,
      status: 'done',
    })

    expect(updated.status).toBe('done')

    const deleted = await deleteTask({ taskId: created.task.id })
    expect(deleted.taskId).toBe(created.task.id)
  })

  it('crea fases y asigna una tarea', async () => {
    const discovery = await addRoadmapItem({
      projectId,
      title: 'Descubrimiento',
      description: '',
      status: 'planned',
      startDate: '2026-04-01',
      dueDate: '2026-04-05',
    })
    const delivery = await addRoadmapItem({
      projectId,
      title: 'Entrega',
      description: '',
      status: 'planned',
      startDate: '2026-04-06',
      dueDate: '2026-04-12',
    })

    const createdTask = await createTask({
      projectId,
      title: 'Tarea con fase',
      description: '',
      priority: 'medium',
      dueDate: '2026-04-10',
      tags: ['itest'],
      roadmapItemId: discovery.item.id,
    })

    expect(createdTask.task.roadmapItemId).toBe(discovery.item.id)

    const assigned = await assignTaskToRoadmapItem({
      taskId: createdTask.task.id,
      roadmapItemId: delivery.item.id,
    })
    expect(assigned.task.roadmapItemId).toBe(delivery.item.id)

    const reordered = await reorderRoadmapItems({
      projectId,
      orderedItemIds: [delivery.item.id, discovery.item.id],
    })
    expect(reordered.items[0]?.id).toBe(delivery.item.id)

    const unassigned = await unassignTaskFromRoadmapItem({
      taskId: createdTask.task.id,
    })
    expect(unassigned.task.roadmapItemId).toBeUndefined()

    await deleteTask({ taskId: createdTask.task.id })
    await deleteRoadmapItem({ itemId: discovery.item.id })
    await deleteRoadmapItem({ itemId: delivery.item.id })
  })
})
