import { relations } from "drizzle-orm";
import {
  bigint,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

import { serviceTypeEnum } from "@/constants";
import { serviceProvider } from "./service-provider.model";

export const orgStatusEnum = pgEnum("org_status", [
  "not_active",
  "active",
  "not_verified",
]);

export const organization = pgTable("organization", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  serviceCategory: serviceTypeEnum("service_category").notNull(),
  generalNumber: bigint("general_number", { mode: "number" }).notNull(),
  status: orgStatusEnum("org_status").notNull().default("not_verified"),

  createdAt: timestamp("created_at", { mode: "string" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "string" }).notNull().defaultNow(),
});

export const organizationRelations = relations(organization, ({ many }) => ({
  serviceProviders: many(serviceProvider),
}));

export const organizationSchema = createSelectSchema(organization);
export const newOrganizationSchema = createInsertSchema(organization).pick({
  name: true,
  serviceCategory: true,
  generalNumber: true,
});

export type TOrganization = z.infer<typeof organizationSchema>;
export type TNewOrganization = z.infer<typeof newOrganizationSchema>;
