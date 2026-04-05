CREATE TYPE "public"."activity_type" AS ENUM('task_created', 'task_completed', 'project_updated', 'note_added', 'status_changed');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'on-hold', 'completed');--> statement-breakpoint
CREATE TYPE "public"."subtask_result" AS ENUM('pending', 'pass', 'fail');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in-progress', 'blocked', 'done');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "activity_type" NOT NULL,
	"description" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"project_id" text,
	"task_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"author" text NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text,
	"content" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"image" text NOT NULL,
	"status" "project_status" NOT NULL,
	"priority" "priority" NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"progress" integer NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subtasks" (
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"title" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"result" "subtask_result" DEFAULT 'pending' NOT NULL,
	"result_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"project_id" text NOT NULL,
	"status" "task_status" NOT NULL,
	"priority" "priority" NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_type_idx" ON "activities" USING btree ("type");--> statement-breakpoint
CREATE INDEX "activities_timestamp_idx" ON "activities" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "activities_project_id_idx" ON "activities" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "activities_task_id_idx" ON "activities" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "comments_task_id_idx" ON "comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "comments_timestamp_idx" ON "comments" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "notes_project_id_idx" ON "notes" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "notes_task_id_idx" ON "notes" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "notes_timestamp_idx" ON "notes" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_due_date_idx" ON "projects" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "subtasks_task_id_idx" ON "subtasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tasks_project_id_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");