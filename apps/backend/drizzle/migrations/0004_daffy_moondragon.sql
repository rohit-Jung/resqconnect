ALTER TABLE "emergency_request" DROP CONSTRAINT "emergency_request_provider_id_service_provider_id_fk";
--> statement-breakpoint
ALTER TABLE "outbox" ADD COLUMN "kafka_topic" "outbox_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "emergency_request" DROP COLUMN "request_time";--> statement-breakpoint
ALTER TABLE "emergency_request" DROP COLUMN "dispatch_time";--> statement-breakpoint
ALTER TABLE "emergency_request" DROP COLUMN "arrival_time";--> statement-breakpoint
ALTER TABLE "emergency_request" DROP COLUMN "provider_id";--> statement-breakpoint
ALTER TABLE "emergency_request" DROP COLUMN "accepted_at";