import { relations } from 'drizzle-orm'
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
} from 'drizzle-orm/pg-core'

export const projectStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'on-hold',
  'completed',
])

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high'])

export const taskStatusEnum = pgEnum('task_status', [
  'todo',
  'in-progress',
  'blocked',
  'done',
])

export const subtaskResultEnum = pgEnum('subtask_result', [
  'pending',
  'pass',
  'fail',
])

export const activityTypeEnum = pgEnum('activity_type', [
  'task_created',
  'task_completed',
  'project_updated',
  'note_added',
  'status_changed',
])

export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    image: text('image').notNull(),
    status: projectStatusEnum('status').notNull(),
    priority: priorityEnum('priority').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    progress: integer('progress').notNull(),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusIdx: index('projects_status_idx').on(table.status),
    dueDateIdx: index('projects_due_date_idx').on(table.dueDate),
  })
)

export const tasks = pgTable(
  'tasks',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    status: taskStatusEnum('status').notNull(),
    priority: priorityEnum('priority').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdIdx: index('tasks_project_id_idx').on(table.projectId),
    statusIdx: index('tasks_status_idx').on(table.status),
    dueDateIdx: index('tasks_due_date_idx').on(table.dueDate),
  })
)

export const subtasks = pgTable(
  'subtasks',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    completed: boolean('completed').notNull().default(false),
    result: subtaskResultEnum('result').notNull().default('pending'),
    resultNote: text('result_note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    taskIdIdx: index('subtasks_task_id_idx').on(table.taskId),
  })
)

export const comments = pgTable(
  'comments',
  {
    id: text('id').primaryKey(),
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    author: text('author').notNull(),
    content: text('content').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    taskIdIdx: index('comments_task_id_idx').on(table.taskId),
    timestampIdx: index('comments_timestamp_idx').on(table.timestamp),
  })
)

export const notes = pgTable(
  'notes',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    content: text('content').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdIdx: index('notes_project_id_idx').on(table.projectId),
    taskIdIdx: index('notes_task_id_idx').on(table.taskId),
    timestampIdx: index('notes_timestamp_idx').on(table.timestamp),
  })
)

export const activities = pgTable(
  'activities',
  {
    id: text('id').primaryKey(),
    type: activityTypeEnum('type').notNull(),
    description: text('description').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull(),
    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    taskId: text('task_id').references(() => tasks.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    typeIdx: index('activities_type_idx').on(table.type),
    timestampIdx: index('activities_timestamp_idx').on(table.timestamp),
    projectIdIdx: index('activities_project_id_idx').on(table.projectId),
    taskIdIdx: index('activities_task_id_idx').on(table.taskId),
  })
)

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
  activities: many(activities),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  subtasks: many(subtasks),
  comments: many(comments),
  notes: many(notes),
  activities: many(activities),
}))

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, {
    fields: [comments.taskId],
    references: [tasks.id],
  }),
}))

export const notesRelations = relations(notes, ({ one }) => ({
  project: one(projects, {
    fields: [notes.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [notes.taskId],
    references: [tasks.id],
  }),
}))

export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, {
    fields: [activities.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [activities.taskId],
    references: [tasks.id],
  }),
}))

