import type { ApiError, MutationRequest } from '@/lib/db/contracts'
import type {
  Comment,
  Note,
  Project,
  RoadmapItem,
  Resource,
  Subtask,
  Task,
  TaskStatus,
} from '@/lib/data'

type MutationResponseMap = {
  createProject: { project: Project }
  createTask: { task: Task }
  addRoadmapItem: { item: RoadmapItem }
  updateTask: { task: Task }
  assignTaskToRoadmapItem: { task: Task }
  deleteTask: { taskId: string }
  deleteRoadmapItem: { itemId: string }
  reorderRoadmapItems: { items: RoadmapItem[] }
  unassignTaskFromRoadmapItem: { task: Task }
  updateTaskStatus: { taskId: string; status: TaskStatus }
  addSubtask: { taskId: string; subtask: Subtask }
  updateSubtask: { taskId: string; projectId?: string; subtask: Subtask }
  addComment: { taskId: string; comment: Comment }
  addNote: { projectId: string; note: Note }
  addResource: { resource: Resource }
  updateResource: { resource: Resource }
  updateProject: { project: Project }
  updateRoadmapItem: { item: RoadmapItem }
}

export type ClientMutationResult<K extends MutationRequest['action']> =
  | { ok: true; data: MutationResponseMap[K] }
  | ApiError

export async function executeMutation<K extends MutationRequest['action']>(
  request: Extract<MutationRequest, { action: K }>
): Promise<ClientMutationResult<K>> {
  const response = await fetch('/api/mutations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  const payload = (await response.json()) as
    | { ok: true; data: MutationResponseMap[K] }
    | ApiError

  return payload
}
