DO $$ BEGIN
 CREATE TYPE "public"."cp_org_status" AS ENUM('pending_approval', 'active', 'suspended', 'trial_expired');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."cp_sector" AS ENUM('hospital', 'police', 'fire');
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_admin" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cp_admin_email_unique" UNIQUE("email")
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_org_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cp_org_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"entitlements" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_payment_intent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cp_org_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"khalti_pidx" text NOT NULL,
	"khalti_status" text DEFAULT 'initiated' NOT NULL,
	"khalti_transaction_id" text,
	"amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_subscription_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"duration_months" integer NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sector" "cp_sector" NOT NULL,
	"status" "cp_org_status" DEFAULT 'pending_approval' NOT NULL,
	"silo_base_url" text NOT NULL,
	"silo_org_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cp_organization_name_unique" UNIQUE("name")
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_silo_poll_cursor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"silo_base_url" text NOT NULL,
	"sanitized_index_cursor" timestamp with time zone,
	"org_snapshots_cursor" timestamp with time zone,
	"last_polled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_org_replica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cp_org_id" uuid NOT NULL,
	"silo_base_url" text NOT NULL,
	"silo_org_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_silo_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"silo_base_url" text NOT NULL,
	"sector" text NOT NULL,
	"metrics" jsonb NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TABLE "cp_sanitized_audit_aggregate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"silo_base_url" text NOT NULL,
	"sector" text NOT NULL,
	"bucket" text NOT NULL,
	"actor_type" text NOT NULL,
	"status_class" text NOT NULL,
	"count" integer NOT NULL,
	"bucket_start" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
EXCEPTION
 WHEN duplicate_table THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cp_org_entitlements" ADD CONSTRAINT "cp_org_entitlements_cp_org_id_cp_organization_id_fk" FOREIGN KEY ("cp_org_id") REFERENCES "public"."cp_organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cp_payment_intent" ADD CONSTRAINT "cp_payment_intent_cp_org_id_cp_organization_id_fk" FOREIGN KEY ("cp_org_id") REFERENCES "public"."cp_organization"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cp_payment_intent" ADD CONSTRAINT "cp_payment_intent_plan_id_cp_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."cp_subscription_plan"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cp_org_entitlements_org_version_uq" ON "cp_org_entitlements" USING btree ("cp_org_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cp_payment_intent_khalti_pidx_uq" ON "cp_payment_intent" USING btree ("khalti_pidx");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cp_silo_poll_cursor_silo_base_url_uq" ON "cp_silo_poll_cursor" USING btree ("silo_base_url");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cp_org_replica_silo_org_uq" ON "cp_org_replica" USING btree ("silo_base_url","silo_org_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cp_silo_metrics_silo_collected_idx" ON "cp_silo_metrics" USING btree ("silo_base_url","collected_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cp_sanitized_audit_agg_uq" ON "cp_sanitized_audit_aggregate" USING btree ("silo_base_url","bucket","actor_type","status_class");
