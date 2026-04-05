import { z } from 'zod'
import {
  addCommentInputSchema,
  addNoteInputSchema,
  addSubtaskInputSchema,
  createTaskInputSchema,
  deleteTaskInputSchema,
  updateProjectInputSchema,
  updateSubtaskInputSchema,
  updateTaskInputSchema,
  updateTaskStatusInputSchema,
} from './contracts'

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>
export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusInputSchema>
export type AddSubtaskInput = z.infer<typeof addSubtaskInputSchema>
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskInputSchema>
export type AddCommentInput = z.infer<typeof addCommentInputSchema>
export type AddNoteInput = z.infer<typeof addNoteInputSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>
