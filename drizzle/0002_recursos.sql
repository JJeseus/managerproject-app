CREATE TYPE "resource_type" AS ENUM ('code', 'document', 'spreadsheet', 'dataset', 'link', 'image', 'other');
--> statement-breakpoint
CREATE TYPE "resource_status" AS ENUM ('draft', 'ready', 'applied', 'archived');
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"task_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "resource_type" NOT NULL,
	"format" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"status" "resource_status" DEFAULT 'draft' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "resources_project_id_idx" ON "resources" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "resources_task_id_idx" ON "resources" USING btree ("task_id");
--> statement-breakpoint
CREATE INDEX "resources_type_idx" ON "resources" USING btree ("type");
--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "resources_created_at_idx" ON "resources" USING btree ("created_at");
