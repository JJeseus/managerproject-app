CREATE TABLE "journal_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"project_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_entries_timestamp_idx" ON "journal_entries" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "journal_entries_project_id_idx" ON "journal_entries" USING btree ("project_id");
