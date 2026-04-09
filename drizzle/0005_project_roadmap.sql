CREATE TYPE "public"."roadmap_status" AS ENUM('planned', 'in-progress', 'completed');--> statement-breakpoint
CREATE TABLE "project_roadmap_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "roadmap_status" DEFAULT 'planned' NOT NULL,
	"position" integer NOT NULL,
	"start_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "roadmap_item_id" text;--> statement-breakpoint
ALTER TABLE "project_roadmap_items" ADD CONSTRAINT "project_roadmap_items_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_roadmap_item_id_project_roadmap_items_id_fk" FOREIGN KEY ("roadmap_item_id") REFERENCES "public"."project_roadmap_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_roadmap_items_project_id_idx" ON "project_roadmap_items" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "project_roadmap_items_position_idx" ON "project_roadmap_items" USING btree ("position");--> statement-breakpoint
CREATE INDEX "tasks_roadmap_item_id_idx" ON "tasks" USING btree ("roadmap_item_id");--> statement-breakpoint
