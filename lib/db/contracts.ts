import { z } from 'zod'

const idSchema = z.string().trim().min(1)
const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida. Usa formato YYYY-MM-DD.')

export const projectStatusSchema = z.enum([
  'planning',
  'active',
  'on-hold',
  'completed',
])

export const prioritySchema = z.enum(['low', 'medium', 'high'])

export const taskStatusSchema = z.enum(['todo', 'in-progress', 'blocked', 'done'])

export const subtaskResultSchema = z.enum(['pending', 'pass', 'fail'])

export const resourceTypeSchema = z.enum([
  'code',
  'document',
  'spreadsheet',
  'dataset',
  'link',
  'image',
  'other',
])

export const resourceStatusSchema = z.enum([
  'draft',
  'ready',
  'applied',
  'archived',
])

export const createTaskInputSchema = z.object({
  projectId: idSchema,
  title: z.string().trim().min(1),
  description: z.string().trim().default(''),
  priority: prioritySchema.default('medium'),
  dueDate: dateOnlySchema,
  tags: z.array(z.string().trim().min(1)).default([]),
})

export const createProjectInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  image: z.string().trim().min(1).default('/placeholder.jpg'),
  status: projectStatusSchema.default('planning'),
  priority: prioritySchema.default('medium'),
  startDate: dateOnlySchema,
  dueDate: dateOnlySchema,
  progress: z.number().int().min(0).max(100).default(0),
  tags: z.array(z.string().trim().min(1)).default([]),
})

export const updateTaskInputSchema = z.object({
  taskId: idSchema,
  patch: z
    .object({
      title: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      status: taskStatusSchema.optional(),
      priority: prioritySchema.optional(),
      dueDate: dateOnlySchema.optional(),
      tags: z.array(z.string().trim().min(1)).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Se requiere al menos un campo para actualizar.',
    }),
})

export const deleteTaskInputSchema = z.object({
  taskId: idSchema,
})

export const updateTaskStatusInputSchema = z.object({
  taskId: idSchema,
  status: taskStatusSchema,
})

export const addSubtaskInputSchema = z.object({
  taskId: idSchema,
  title: z.string().trim().min(1),
})

export const updateSubtaskInputSchema = z.object({
  subtaskId: idSchema,
  patch: z
    .object({
      completed: z.boolean().optional(),
      result: subtaskResultSchema.optional(),
      resultNote: z.string().trim().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Se requiere al menos un campo para actualizar.',
    }),
})

export const addCommentInputSchema = z.object({
  taskId: idSchema,
  content: z.string().trim().min(1),
})

export const addNoteInputSchema = z.object({
  projectId: idSchema,
  taskId: idSchema.optional(),
  content: z.string().trim().min(1),
})

export const addResourceInputSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().default(''),
  type: resourceTypeSchema.default('other'),
  language: z.string().trim().default(''),
  format: z.string().trim().default(''),
  content: z.string().trim().default(''),
  sourceUrl: z.string().trim().default(''),
  status: resourceStatusSchema.default('draft'),
  tags: z.array(z.string().trim().min(1)).default([]),
  projectId: idSchema.nullish(),
  taskId: idSchema.nullish(),
})

export const updateResourceInputSchema = z.object({
  resourceId: idSchema,
  patch: z
    .object({
      title: z.string().trim().min(1).optional(),
      description: z.string().trim().optional(),
      type: resourceTypeSchema.optional(),
      language: z.string().trim().optional(),
      format: z.string().trim().optional(),
      content: z.string().trim().optional(),
      sourceUrl: z.string().trim().optional(),
      status: resourceStatusSchema.optional(),
      tags: z.array(z.string().trim().min(1)).optional(),
      projectId: idSchema.nullish(),
      taskId: idSchema.nullish(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Se requiere al menos un campo para actualizar.',
    }),
})

export const updateProjectInputSchema = z.object({
  projectId: idSchema,
  patch: z
    .object({
      name: z.string().trim().min(1).optional(),
      description: z.string().trim().min(1).optional(),
      status: projectStatusSchema.optional(),
      priority: prioritySchema.optional(),
      startDate: dateOnlySchema.optional(),
      dueDate: dateOnlySchema.optional(),
      progress: z.number().int().min(0).max(100).optional(),
      tags: z.array(z.string().trim().min(1)).optional(),
      image: z.string().trim().min(1).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'Se requiere al menos un campo para actualizar.',
    }),
})

export const mutationRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('createProject'), payload: createProjectInputSchema }),
  z.object({ action: z.literal('createTask'), payload: createTaskInputSchema }),
  z.object({ action: z.literal('updateTask'), payload: updateTaskInputSchema }),
  z.object({ action: z.literal('deleteTask'), payload: deleteTaskInputSchema }),
  z.object({
    action: z.literal('updateTaskStatus'),
    payload: updateTaskStatusInputSchema,
  }),
  z.object({ action: z.literal('addSubtask'), payload: addSubtaskInputSchema }),
  z.object({
    action: z.literal('updateSubtask'),
    payload: updateSubtaskInputSchema,
  }),
  z.object({ action: z.literal('addComment'), payload: addCommentInputSchema }),
  z.object({ action: z.literal('addNote'), payload: addNoteInputSchema }),
  z.object({ action: z.literal('addResource'), payload: addResourceInputSchema }),
  z.object({
    action: z.literal('updateResource'),
    payload: updateResourceInputSchema,
  }),
  z.object({
    action: z.literal('updateProject'),
    payload: updateProjectInputSchema,
  }),
])

export type MutationRequest = z.infer<typeof mutationRequestSchema>

export type ApiSuccess<T> = { ok: true; data: T }
export type ApiError = {
  ok: false
  errorCode: string
  message: string
}

export type ApiResult<T> = ApiSuccess<T> | ApiError
