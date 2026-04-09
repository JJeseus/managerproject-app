import type { RoadmapItem, RoadmapStatus, Task } from '@/lib/data'

export function sortRoadmapItems(items: RoadmapItem[]) {
  return [...items].sort((left, right) => {
    if (left.position !== right.position) {
      return left.position - right.position
    }

    return left.title.localeCompare(right.title, 'es')
  })
}

export function getRoadmapFallbackProgress(status: RoadmapStatus) {
  if (status === 'completed') return 100
  if (status === 'in-progress') return 50
  return 0
}

export function getRoadmapProgress(item: RoadmapItem, tasks: Task[]) {
  const relatedTasks = tasks.filter((task) => task.roadmapItemId === item.id)
  const completedTasks = relatedTasks.filter((task) => task.status === 'done').length
  const progress =
    relatedTasks.length > 0
      ? Math.round((completedTasks / relatedTasks.length) * 100)
      : getRoadmapFallbackProgress(item.status)

  return {
    totalTasks: relatedTasks.length,
    completedTasks,
    progress,
  }
}

export function groupTasksByRoadmapItem(tasks: Task[]) {
  return tasks.reduce<Record<string, Task[]>>((acc, task) => {
    const key = task.roadmapItemId ?? 'unassigned'
    const currentGroup = acc[key] ?? []

    currentGroup.push(task)
    acc[key] = currentGroup

    return acc
  }, {})
}

export function normalizeRoadmapPositions(items: RoadmapItem[]) {
  return sortRoadmapItems(items).map((item, index) => ({
    ...item,
    position: index + 1,
  }))
}
