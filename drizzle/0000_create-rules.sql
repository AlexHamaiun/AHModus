CREATE TYPE "public"."rule_version_validation_status" AS ENUM('pending', 'valid', 'invalid');--> statement-breakpoint
CREATE TABLE "rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"expression" text NOT NULL,
	"validation_status" "rule_version_validation_status" DEFAULT 'pending' NOT NULL,
	"validation_result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" varchar(255),
	"published_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rules" (
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
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_active_version_id_rule_versions_id_fk" FOREIGN KEY ("active_version_id") REFERENCES "public"."rule_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "rule_versions_rule_id_version_unique" ON "rule_versions" USING btree ("rule_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "rules_key_unique" ON "rules" USING btree ("key");