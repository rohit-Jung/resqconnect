CREATECREATE EXTENSION IF NOT EXISTS postgis;
TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'assigned', 'rejected', 'in_progress', 'completed', 'cancelled', 'no_providers_available');--> statement-breakpoint
CREATE TYPE "public"."status_update" AS ENUM('accepted', 'arrived', 'on_route', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('not_submitted', 'pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('available', 'assigned', 'off_duty');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."org_status" AS ENUM('not_active', 'active', 'not_verified');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."kafka_topic_enum" AS ENUM('fire_events', 'medical_events', 'rescue_events', 'police_events');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'published', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('khalti', 'esewa', 'bank_transfer', 'cash');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TABLE "emergency_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_comman_contact" boolean DEFAULT false NOT NULL,
	"relationship" varchar(50) NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"email" varchar(255),
	"user_id" uuid,
	"notify_on_emergency" boolean DEFAULT true,
	"notification_method" varchar(20) DEFAULT 'sms',
	"push_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service_type" "service_type" NOT NULL,
	"request_status" "request_status" DEFAULT 'pending' NOT NULL,
	"description" varchar(255),
	"requestTimeout" integer DEFAULT 120,
	"location" json NOT NULL,
	"geo_location" geometry(Point, 4326),
	"h3_index" bigint,
	"search_radius" integer DEFAULT 1,
	"must_connect_by" timestamp,
	"provider_connected_at" timestamp,
	"expires_at" timestamp,
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
CREATE TABLE "service_provider" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone_number" bigint NOT NULL,
	"primary_address" varchar(255) NOT NULL,
	"service_area" varchar DEFAULT 'Kathmandu Valley',
	"password" varchar(255) NOT NULL,
	"service_type" "service_type" NOT NULL,
	"is_verified" boolean DEFAULT false,
	"profile_picture" varchar(255),
	"last_location" geometry(Point, 4326) NOT NULL,
	"h3_index" bigint NOT NULL,
	"current_location" json NOT NULL,
	"vehicle_information" json DEFAULT '{"type":"Not filled","number":"Not filled","model":"Not filled","color":"Not filled"}'::json,
	"organization_id" uuid NOT NULL,
	"service_status" "service_status" DEFAULT 'available' NOT NULL,
	"verification_token" varchar(255),
	"token_expiry" timestamp,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp,
	"pan_card_url" varchar(512),
	"citizenship_url" varchar(512),
	"document_status" "document_status" DEFAULT 'not_submitted' NOT NULL,
	"rejection_reason" text,
	"verified_at" timestamp,
	"verified_by" uuid,
	"status_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_provider_id_unique" UNIQUE("id"),
	CONSTRAINT "service_provider_email_unique" UNIQUE("email"),
	CONSTRAINT "service_provider_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"phone_number" bigint NOT NULL,
	"email" varchar(255) NOT NULL,
	"primary_address" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"role" "role" DEFAULT 'user',
	"profile_picture" varchar(255),
	"verification_token" varchar(255),
	"token_expiry" timestamp,
	"location" geometry(Point, 4326) NOT NULL,
	"h3_index" bigint NOT NULL,
	"current_location" json DEFAULT '{"latitude":"","longitude":""}'::json,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp,
	"notify_emergency_contacts" boolean DEFAULT true,
	"emergency_notification_method" varchar(20) DEFAULT 'both',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"push_token" text,
	CONSTRAINT "user_id_unique" UNIQUE("id"),
	CONSTRAINT "user_phone_number_unique" UNIQUE("phone_number"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"service_category" "service_type" NOT NULL,
	"general_number" bigint NOT NULL,
	"password" varchar(255) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"org_status" "org_status" DEFAULT 'not_verified' NOT NULL,
	"verification_token" varchar(255),
	"token_expiry" timestamp,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_name_unique" UNIQUE("name"),
	CONSTRAINT "organization_email_unique" UNIQUE("email")
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
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_type" varchar(100) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"kafka_topic" "kafka_topic_enum" NOT NULL,
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
CREATE TABLE "organization_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"subscription_id" uuid,
	"amount" integer NOT NULL,
	"khalti_pidx" varchar(255),
	"khalti_transaction_id" varchar(255),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'khalti',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"duration_months" integer NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "emergency_request" ADD CONSTRAINT "emergency_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_response" ADD CONSTRAINT "emergency_response_emergency_request_id_emergency_request_id_fk" FOREIGN KEY ("emergency_request_id") REFERENCES "public"."emergency_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_response" ADD CONSTRAINT "emergency_response_service_provider_id_service_provider_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_serviceProvider_id_service_provider_id_fk" FOREIGN KEY ("serviceProvider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_provider" ADD CONSTRAINT "service_provider_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_provider" ADD CONSTRAINT "service_provider_verified_by_organization_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_service_provider_id_service_provider_id_fk" FOREIGN KEY ("service_provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_request_id_emergency_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."emergency_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_events" ADD CONSTRAINT "request_events_provider_id_service_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."service_provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_subscriptions" ADD CONSTRAINT "organization_subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_organization_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."organization_subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spatial_idx" ON "service_provider" USING btree ("last_location");--> statement-breakpoint
CREATE INDEX "h3_idx" ON "service_provider" USING btree ("h3_index");
