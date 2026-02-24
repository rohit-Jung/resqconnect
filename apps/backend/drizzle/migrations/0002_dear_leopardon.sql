ALTER TABLE "service_provider" ADD COLUMN "last_location" geometry(Point, 4326) NOT NULL;--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "h3_index" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "service_provider" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "location" geometry(Point, 4326) NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "h3_index" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "service_provider" ADD CONSTRAINT "service_provider_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spatial_idx" ON "service_provider" USING btree ("last_location");--> statement-breakpoint
CREATE INDEX "h3_idx" ON "service_provider" USING btree ("h3_index");