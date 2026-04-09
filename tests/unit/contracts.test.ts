import { describe, expect, it } from 'vitest'
import { mutationRequestSchema } from '@/lib/db/contracts'

describe('contratos de mutación', () => {
  it('acepta un createProject válido', () => {
    const parsed = mutationRequestSchema.parse({
      action: 'createProject',
      payload: {
        name: 'Backoffice operativo',
        description: 'Proyecto para seguimiento',
        image: '/placeholder.jpg',
        status: 'planning',
        priority: 'medium',
        startDate: '2026-04-07',
        dueDate: '2026-05-07',
        progress: 0,
        tags: ['operaciones'],
      },
    })

    expect(parsed.action).toBe('createProject')
  })

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
        roadmapItemId: 'roadmap-1',
      },
    })

    expect(parsed.action).toBe('createTask')
    if (parsed.action !== 'createTask') {
      throw new Error('Se esperaba createTask')
    }
    expect(parsed.payload.roadmapItemId).toBe('roadmap-1')
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

  it('acepta recursos sin proyecto principal', () => {
    const parsed = mutationRequestSchema.parse({
      action: 'addResource',
      payload: {
        title: 'Snippet',
        description: 'Relaciona con [[Rediseño del sitio web]] y #html',
        type: 'code',
        language: 'html',
        format: '',
        content: '<div></div>',
        sourceUrl: '',
        status: 'draft',
        tags: ['ui'],
        projectId: null,
      },
    })

    expect(parsed.action).toBe('addResource')
    if (parsed.action !== 'addResource') {
      throw new Error('Se esperaba addResource')
    }
    expect(parsed.payload.projectId).toBeNull()
  })

  it('acepta crear una fase de hoja de ruta', () => {
    const parsed = mutationRequestSchema.parse({
      action: 'addRoadmapItem',
      payload: {
        projectId: 'proj-1',
        title: 'QA y cierre',
        description: 'Validar y publicar',
        status: 'planned',
        startDate: '2026-04-10',
        dueDate: '2026-04-18',
      },
    })

    expect(parsed.action).toBe('addRoadmapItem')
  })

  it('acepta reasignar tareas a una fase', () => {
    const parsed = mutationRequestSchema.parse({
      action: 'assignTaskToRoadmapItem',
      payload: {
        taskId: 'task-1',
        roadmapItemId: 'roadmap-2',
      },
    })

    expect(parsed.action).toBe('assignTaskToRoadmapItem')
  })
})
