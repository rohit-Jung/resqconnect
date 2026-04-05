CREATE TYPE "public"."document_status" AS ENUM('not_submitted', 'pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "pan_card_url" varchar(512);--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "citizenship_url" varchar(512);--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "document_status" "document_status" DEFAULT 'not_submitted' NOT NULL;--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "verified_by" uuid;--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "status_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "service_provider" ADD CONSTRAINT "service_provider_verified_by_organization_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;