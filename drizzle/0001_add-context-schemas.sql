CREATE TABLE "context_schema_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"context_schema_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "context_schemas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(128) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"active_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "context_schema_versions" ADD CONSTRAINT "context_schema_versions_context_schema_id_context_schemas_id_fk" FOREIGN KEY ("context_schema_id") REFERENCES "public"."context_schemas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "context_schemas" ADD CONSTRAINT "context_schemas_active_version_id_context_schema_versions_id_fk" FOREIGN KEY ("active_version_id") REFERENCES "public"."context_schema_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "context_schema_versions_context_schema_id_version_unique" ON "context_schema_versions" USING btree ("context_schema_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "context_schemas_key_unique" ON "context_schemas" USING btree ("key");