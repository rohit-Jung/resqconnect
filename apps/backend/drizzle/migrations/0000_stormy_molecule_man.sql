CREATE TYPE "public"."service_type" AS ENUM('ambulance', 'police', 'rescue_team', 'fire_truck');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."org_status" AS ENUM('not_active', 'active', 'not_verified');--> statement-breakpoint
CREATE TYPE "public"."service_status" AS ENUM('available', 'assigned', 'off_duty');--> statement-breakpoint
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
	"current_location" json DEFAULT '{"latitude":"","longitude":""}'::json,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp,
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
	"service_category" "service_type" NOT NULL,
	"general_number" bigint NOT NULL,
	"org_status" "org_status" DEFAULT 'not_verified' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_name_unique" UNIQUE("name")
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
	"current_location" json DEFAULT '{"latitude":"","longitude":""}'::json,
	"vehicle_information" json DEFAULT '{"type":"Not filled","number":"Not filled","model":"Not filled","color":"Not filled"}'::json,
	"service_status" "service_status" DEFAULT 'available' NOT NULL,
	"verification_token" varchar(255),
	"token_expiry" timestamp,
	"reset_password_token" varchar(255),
	"reset_password_token_expiry" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_provider_id_unique" UNIQUE("id"),
	CONSTRAINT "service_provider_email_unique" UNIQUE("email"),
	CONSTRAINT "service_provider_phone_number_unique" UNIQUE("phone_number")
);
