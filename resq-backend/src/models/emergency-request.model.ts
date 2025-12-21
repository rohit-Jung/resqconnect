import { relations } from "drizzle-orm";
import { json, pgEnum, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

import { serviceTypeEnum } from "../constants";

import { user } from "./user.model";

export const requestStatusEnum = pgEnum("request_status", [
	"pending",
	"assigned",
	"rejected",
	"in_progress",
	"completed",
]);

export const emergencyRequest = pgTable("emergency_request", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.references(() => user.id)
		.notNull(),
	serviceType: serviceTypeEnum("service_type").notNull(),
	requestStatus: requestStatusEnum("request_status").notNull().default("pending"),
	requestTime: timestamp("request_time").defaultNow(),
	dispatchTime: timestamp("dispatch_time"),
	arrivalTime: timestamp("arrival_time"),
	description: varchar({ length: 255 }),
	location: json("location")
		.$type<{
			latitude: string;
			longitude: string;
		}>()
		.notNull(),

	createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const emergencyRequestRelations = relations(emergencyRequest, ({ one }) => ({
	userId: one(user, {
		fields: [emergencyRequest.userId],
		references: [user.id],
	}),
}));

export const emergencyRequestSchema = createSelectSchema(emergencyRequest);

export const newEmergencyRequestSchema = createInsertSchema(emergencyRequest).pick({
	userId: true,
	serviceType: true,
	description: true,
	location: true,
});

export type IEmergencyRequest = z.infer<typeof emergencyRequestSchema>;
export type ICreateEmergencyRequest = z.infer<typeof newEmergencyRequestSchema>;
