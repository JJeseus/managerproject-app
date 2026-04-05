import { sql } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { getDb } from '@/lib/db/client'
import { createTask, deleteTask, updateTaskStatus } from '@/lib/db/mutations'
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
})
