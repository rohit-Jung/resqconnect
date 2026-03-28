ALTER TABLE "request_events" DROP CONSTRAINT "request_events_request_id_emergency_request_id_fk";
--> statement-breakpoint
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_request_id_emergency_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."emergency_request"("id") ON DELETE cascade ON UPDATE no action;