CREATE TABLE "cp_compliance_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cp_org_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cp_compliance_config_cp_org_id_unique" UNIQUE("cp_org_id")
);
--> statement-breakpoint
ALTER TABLE "cp_compliance_config" ADD CONSTRAINT "cp_compliance_config_cp_org_id_cp_organization_id_fk" FOREIGN KEY ("cp_org_id") REFERENCES "public"."cp_organization"("id") ON DELETE cascade ON UPDATE no action;