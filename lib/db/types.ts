import { z } from 'zod'
import {
  addCommentInputSchema,
  addNoteInputSchema,
  addRoadmapItemInputSchema,
  addResourceInputSchema,
  addSubtaskInputSchema,
  assignTaskToRoadmapItemInputSchema,
  createProjectInputSchema,
  createTaskInputSchema,
  deleteRoadmapItemInputSchema,
  deleteTaskInputSchema,
  reorderRoadmapItemsInputSchema,
  unassignTaskFromRoadmapItemInputSchema,
  updateProjectInputSchema,
  updateRoadmapItemInputSchema,
  updateResourceInputSchema,
  updateSubtaskInputSchema,
  updateTaskInputSchema,
  updateTaskStatusInputSchema,
} from './contracts'

export type CreateProjectInput = z.infer<typeof createProjectInputSchema>
export type CreateTaskInput = z.infer<typeof createTaskInputSchema>
export type AddRoadmapItemInput = z.infer<typeof addRoadmapItemInputSchema>
export type AssignTaskToRoadmapItemInput = z.infer<typeof assignTaskToRoadmapItemInputSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>
export type DeleteRoadmapItemInput = z.infer<typeof deleteRoadmapItemInputSchema>
export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>
export type ReorderRoadmapItemsInput = z.infer<typeof reorderRoadmapItemsInputSchema>
export type UnassignTaskFromRoadmapItemInput = z.infer<typeof unassignTaskFromRoadmapItemInputSchema>
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusInputSchema>
export type AddSubtaskInput = z.infer<typeof addSubtaskInputSchema>
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskInputSchema>
export type AddCommentInput = z.infer<typeof addCommentInputSchema>
export type AddResourceInput = z.infer<typeof addResourceInputSchema>
export type UpdateResourceInput = z.infer<typeof updateResourceInputSchema>
export type AddNoteInput = z.infer<typeof addNoteInputSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>
export type UpdateRoadmapItemInput = z.infer<typeof updateRoadmapItemInputSchema>
