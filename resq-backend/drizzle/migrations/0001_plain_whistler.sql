CREATE TYPE "public"."request_status" AS ENUM('pending', 'assigned', 'rejected', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."status_update" AS ENUM('accepted', 'arrived', 'on_route', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "emergency_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_comman_contact" boolean DEFAULT false NOT NULL,
	"relationship" varchar(50) NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"request_status" "request_status" DEFAULT 'pending' NOT NULL,
	"request_time" timestamp DEFAULT now(),
	"dispatch_time" timestamp,
	"arrival_time" timestamp,
	"description" varchar(255),
	"location" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"emergency_request_id" uuid,
	"service_provider_id" uuid,
	"status_update" "status_update" DEFAULT 'accepted',
	"origin_location" json NOT NULL,
	"destination_location" json NOT NULL,
	"assigned_at" timestamp,
	"responded_at" timestamp DEFAULT now(),
	"updateDescription" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"serviceProvider_id" uuid NOT NULL,
	"message" varchar(510),
	"service_ratings" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"service_provider_id" uuid,
	"message" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"priority" "priority" DEFAULT 'low',
	"source" varchar(100) NOT NULL,
	"metadata" json,
	"deliveryStatus" varchar(50) DEFAULT 'pending',
	"is_read" boolean DEFAULT false,
	"do_not_disturb" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "password" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "is_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "verification_token" varchar(255);--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "reset_password_token" varchar(255);--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "reset_password_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_response" ADD CONSTRAINT "emergency_response_emergency_request_id_emergency_request_id_fk" FOREIGN KEY ("emergency_request_id") REFERENCES "public"."emergency_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_response" ADD CONSTRAINT "emergency_response_service_provider_id_service_provider_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_serviceProvider_id_service_provider_id_fk" FOREIGN KEY ("serviceProvider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_service_provider_id_service_provider_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_email_unique" UNIQUE("email");--> statement-breakpoint
