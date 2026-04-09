CREATE TYPE "public"."resource_link_target_type" AS ENUM('project', 'resource');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('draft', 'ready', 'applied', 'archived');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('code', 'document', 'spreadsheet', 'dataset', 'link', 'image', 'other');--> statement-breakpoint
CREATE TABLE "resource_links" (
	"id" text PRIMARY KEY NOT NULL,
	"source_resource_id" text NOT NULL,
	"target_type" "resource_link_target_type" NOT NULL,
	"target_id" text NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text,
	"task_id" text,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"type" "resource_type" NOT NULL,
	"language" text DEFAULT '' NOT NULL,
	"format" text DEFAULT '' NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"source_url" text DEFAULT '' NOT NULL,
	"status" "resource_status" DEFAULT 'draft' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "resource_links" ADD CONSTRAINT "resource_links_source_resource_id_resources_id_fk" FOREIGN KEY ("source_resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "resource_links_source_resource_id_idx" ON "resource_links" USING btree ("source_resource_id");--> statement-breakpoint
CREATE INDEX "resource_links_target_type_idx" ON "resource_links" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "resource_links_target_id_idx" ON "resource_links" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "resource_links_created_at_idx" ON "resource_links" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "resources_project_id_idx" ON "resources" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "resources_task_id_idx" ON "resources" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "resources_type_idx" ON "resources" USING btree ("type");--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resources_created_at_idx" ON "resources" USING btree ("created_at");