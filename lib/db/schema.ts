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

export const roadmapStatusEnum = pgEnum('roadmap_status', [
  'planned',
  'in-progress',
  'completed',
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

export const resourceTypeEnum = pgEnum('resource_type', [
  'code',
  'document',
  'spreadsheet',
  'dataset',
  'link',
  'image',
  'other',
])

export const resourceStatusEnum = pgEnum('resource_status', [
  'draft',
  'ready',
  'applied',
  'archived',
])

export const resourceLinkTargetTypeEnum = pgEnum('resource_link_target_type', [
  'project',
  'resource',
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
    roadmapItemId: text('roadmap_item_id').references(() => projectRoadmapItems.id, {
      onDelete: 'set null',
    }),
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
    roadmapItemIdIdx: index('tasks_roadmap_item_id_idx').on(table.roadmapItemId),
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

export const resources = pgTable(
  'resources',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').references(() => projects.id, {
      onDelete: 'set null',
    }),
    taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    type: resourceTypeEnum('type').notNull(),
    language: text('language').notNull().default(''),
    format: text('format').notNull().default(''),
    content: text('content').notNull().default(''),
    sourceUrl: text('source_url').notNull().default(''),
    status: resourceStatusEnum('status').notNull().default('draft'),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdIdx: index('resources_project_id_idx').on(table.projectId),
    taskIdIdx: index('resources_task_id_idx').on(table.taskId),
    typeIdx: index('resources_type_idx').on(table.type),
    statusIdx: index('resources_status_idx').on(table.status),
    createdAtIdx: index('resources_created_at_idx').on(table.createdAt),
  })
)

export const resourceLinks = pgTable(
  'resource_links',
  {
    id: text('id').primaryKey(),
    sourceResourceId: text('source_resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    targetType: resourceLinkTargetTypeEnum('target_type').notNull(),
    targetId: text('target_id').notNull(),
    label: text('label').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sourceResourceIdIdx: index('resource_links_source_resource_id_idx').on(table.sourceResourceId),
    targetTypeIdx: index('resource_links_target_type_idx').on(table.targetType),
    targetIdIdx: index('resource_links_target_id_idx').on(table.targetId),
    createdAtIdx: index('resource_links_created_at_idx').on(table.createdAt),
  })
)

export const projectRoadmapItems = pgTable(
  'project_roadmap_items',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    status: roadmapStatusEnum('status').notNull().default('planned'),
    position: integer('position').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    dueDate: timestamp('due_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    projectIdIdx: index('project_roadmap_items_project_id_idx').on(table.projectId),
    positionIdx: index('project_roadmap_items_position_idx').on(table.position),
  })
)

export const projectsRelations = relations(projects, ({ many }) => ({
  tasks: many(tasks),
  notes: many(notes),
  activities: many(activities),
  roadmapItems: many(projectRoadmapItems),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  roadmapItem: one(projectRoadmapItems, {
    fields: [tasks.roadmapItemId],
    references: [projectRoadmapItems.id],
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

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  project: one(projects, {
    fields: [resources.projectId],
    references: [projects.id],
  }),
  task: one(tasks, {
    fields: [resources.taskId],
    references: [tasks.id],
  }),
  outgoingLinks: many(resourceLinks),
}))

export const resourceLinksRelations = relations(resourceLinks, ({ one }) => ({
  sourceResource: one(resources, {
    fields: [resourceLinks.sourceResourceId],
    references: [resources.id],
  }),
}))

export const projectRoadmapItemsRelations = relations(projectRoadmapItems, ({ one, many }) => ({
  project: one(projects, {
    fields: [projectRoadmapItems.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}))
