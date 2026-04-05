import { describe, expect, it } from 'vitest'
import { priorityLabels, statusLabels, taskStatusLabels } from '@/lib/data'

describe('labels en español', () => {
  it('traduce etiquetas de proyectos', () => {
    expect(statusLabels.active).toBe('Activo')
    expect(statusLabels.completed).toBe('Completado')
  })

  it('traduce etiquetas de tareas y prioridad', () => {
    expect(taskStatusLabels['in-progress']).toBe('En progreso')
    expect(priorityLabels.high).toBe('Alta')
  })
})
