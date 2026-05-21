CREATE TYPE "public"."request_source" AS ENUM('app', 'sms');--> statement-breakpoint
ALTER TABLE "emergency_request" ADD COLUMN "source" "request_source" DEFAULT 'app' NOT NULL;