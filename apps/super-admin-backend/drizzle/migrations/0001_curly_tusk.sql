CREATE TYPE "public"."silo_status" AS ENUM('active', 'inactive', 'stale');--> statement-breakpoint
CREATE TABLE "cp_silo_registry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"silo_base_url" text NOT NULL,
	"sector" text NOT NULL,
	"status" "silo_status" DEFAULT 'active' NOT NULL,
	"org_count" integer DEFAULT 0 NOT NULL,
	"orgs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"incident_summary" jsonb DEFAULT '{"total":0,"pending":0,"active":0,"completed":0,"cancelled":0}'::jsonb NOT NULL,
	"synced" boolean DEFAULT false NOT NULL,
	"last_heartbeat" timestamp with time zone DEFAULT now() NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cp_silo_registry_silo_base_url_unique" UNIQUE("silo_base_url")
);
--> statement-breakpoint
CREATE INDEX "cp_silo_registry_heartbeat_idx" ON "cp_silo_registry" USING btree ("last_heartbeat");--> statement-breakpoint
CREATE INDEX "cp_silo_registry_sector_idx" ON "cp_silo_registry" USING btree ("sector");