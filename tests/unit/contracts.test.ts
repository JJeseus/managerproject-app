import { describe, expect, it } from 'vitest'
import { mutationRequestSchema } from '@/lib/db/contracts'

describe('contratos de mutación', () => {
  it('acepta un createTask válido', () => {
    const parsed = mutationRequestSchema.parse({
      action: 'createTask',
      payload: {
        projectId: 'proj-1',
        title: 'Nueva tarea',
        description: 'Detalle',
        priority: 'medium',
        dueDate: '2026-04-12',
        tags: ['tag'],
      },
    })

    expect(parsed.action).toBe('createTask')
  })

  it('rechaza fechas inválidas', () => {
    const result = mutationRequestSchema.safeParse({
      action: 'createTask',
      payload: {
        projectId: 'proj-1',
        title: 'Nueva tarea',
        description: 'Detalle',
        priority: 'medium',
        dueDate: '12-04-2026',
        tags: [],
      },
    })

    expect(result.success).toBe(false)
  })
})
