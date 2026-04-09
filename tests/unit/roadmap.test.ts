import { describe, expect, it } from 'vitest'
import type { RoadmapItem, Task } from '@/lib/data'
import {
  getRoadmapFallbackProgress,
  getRoadmapProgress,
  groupTasksByRoadmapItem,
  normalizeRoadmapPositions,
  sortRoadmapItems,
} from '@/lib/projects/roadmap'

const roadmapItems: RoadmapItem[] = [
  {
    id: 'roadmap-2',
    projectId: 'proj-1',
    title: 'Entrega',
    description: '',
    status: 'planned',
    position: 2,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 'roadmap-1',
    projectId: 'proj-1',
    title: 'Descubrimiento',
    description: '',
    status: 'in-progress',
    position: 1,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
]

const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Analizar feedback',
    description: '',
    projectId: 'proj-1',
    status: 'done',
    priority: 'medium',
    dueDate: '2026-04-02',
    tags: [],
    roadmapItemId: 'roadmap-1',
  },
  {
    id: 'task-2',
    title: 'Implementar cambios',
    description: '',
    projectId: 'proj-1',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-03',
    tags: [],
    roadmapItemId: 'roadmap-1',
  },
  {
    id: 'task-3',
    title: 'Sin fase',
    description: '',
    projectId: 'proj-1',
    status: 'todo',
    priority: 'low',
    dueDate: '2026-04-04',
    tags: [],
  },
]

describe('roadmap helpers', () => {
  it('ordena fases por posicion', () => {
    expect(sortRoadmapItems(roadmapItems).map((item) => item.id)).toEqual([
      'roadmap-1',
      'roadmap-2',
    ])
  })

  it('calcula progreso desde tareas vinculadas', () => {
    expect(getRoadmapProgress(roadmapItems[1], tasks)).toEqual({
      totalTasks: 2,
      completedTasks: 1,
      progress: 50,
    })
  })

  it('usa progreso fallback cuando no hay tareas', () => {
    expect(getRoadmapFallbackProgress('planned')).toBe(0)
    expect(getRoadmapFallbackProgress('in-progress')).toBe(50)
    expect(getRoadmapFallbackProgress('completed')).toBe(100)
    expect(getRoadmapProgress(roadmapItems[0], tasks).progress).toBe(0)
  })

  it('agrupa tareas por fase y sin fase', () => {
    const grouped = groupTasksByRoadmapItem(tasks)

    expect(grouped['roadmap-1']).toHaveLength(2)
    expect(grouped.unassigned).toHaveLength(1)
  })

  it('normaliza posiciones consecutivas', () => {
    expect(
      normalizeRoadmapPositions([
        { ...roadmapItems[0], position: 5 },
        { ...roadmapItems[1], position: 9 },
      ]).map((item) => item.position)
    ).toEqual([1, 2])
  })
})
