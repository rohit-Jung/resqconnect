CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'published', 'failed');--> statement-breakpoint
ALTER TYPE "public"."request_status" ADD VALUE 'accepted' BEFORE 'assigned';--> statement-breakpoint
ALTER TYPE "public"."request_status" ADD VALUE 'cancelled';--> statement-breakpoint
ALTER TYPE "public"."request_status" ADD VALUE 'no_providers_available';--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_type" varchar(100) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" text NOT NULL,
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0,
	"last_retry_at" timestamp,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "request_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"provider_id" uuid,
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD COLUMN "notify_on_emergency" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD COLUMN "notification_method" varchar(20) DEFAULT 'sms';--> statement-breakpoint
ALTER TABLE "emergency_contact" ADD COLUMN "push_token" text;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "requestTimeout" integer DEFAULT 120;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "geo_location" geometry(Point, 4326);--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "h3_index" bigint;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "search_radius" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "provider_id" uuid;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "must_connect_by" timestamp;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "provider_connected_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "notify_emergency_contacts" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "emergency_notification_method" varchar(20) DEFAULT 'both';--> statement-breakpoint
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_request_id_emergency_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."emergency_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_provider_id_service_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_provider_id_service_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;