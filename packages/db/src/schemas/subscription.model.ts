import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { type z } from 'zod';

import { organization } from './organization.model';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'expired',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'khalti',
  'esewa',
  'bank_transfer',
  'cash',
]);

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: integer('price').notNull(), // Amount in paisa (Khalti uses paisa)
  durationMonths: integer('duration_months').notNull(),
  features: jsonb('features').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const organizationSubscriptions = pgTable('organization_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  planId: uuid('plan_id')
    .notNull()
    .references(() => subscriptionPlans.id, { onDelete: 'restrict' }),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  startDate: timestamp('start_date', { mode: 'string' }).notNull(),
  endDate: timestamp('end_date', { mode: 'string' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(
    () => organizationSubscriptions.id,
    { onDelete: 'set null' }
  ),
  amount: integer('amount').notNull(), // Amount in paisa
  khaltiPidx: varchar('khalti_pidx', { length: 255 }),
  khaltiTransactionId: varchar('khalti_transaction_id', { length: 255 }),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paymentMethod: paymentMethodEnum('payment_method').default('khalti'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { mode: 'string' }),
});

export const subscriptionPlansRelations = relations(
  subscriptionPlans,
  ({ many }) => ({
    subscriptions: many(organizationSubscriptions),
  })
);

export const organizationSubscriptionsRelations = relations(
  organizationSubscriptions,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [organizationSubscriptions.organizationId],
      references: [organization.id],
    }),
    plan: one(subscriptionPlans, {
      fields: [organizationSubscriptions.planId],
      references: [subscriptionPlans.id],
    }),
    payments: many(payments),
  })
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organization, {
    fields: [payments.organizationId],
    references: [organization.id],
  }),
  subscription: one(organizationSubscriptions, {
    fields: [payments.subscriptionId],
    references: [organizationSubscriptions.id],
  }),
}));

export const subscriptionPlanSchema = createSelectSchema(subscriptionPlans);
export const newSubscriptionPlanSchema = createInsertSchema(
  subscriptionPlans
).pick({
  name: true,
  price: true,
  durationMonths: true,
  features: true,
  isActive: true,
});

export const organizationSubscriptionSchema = createSelectSchema(
  organizationSubscriptions
);
export const newOrganizationSubscriptionSchema = createInsertSchema(
  organizationSubscriptions
).pick({
  organizationId: true,
  planId: true,
  status: true,
  startDate: true,
  endDate: true,
});

export const paymentSchema = createSelectSchema(payments);
export const newPaymentSchema = createInsertSchema(payments).pick({
  organizationId: true,
  subscriptionId: true,
  amount: true,
  khaltiPidx: true,
  khaltiTransactionId: true,
  status: true,
  paymentMethod: true,
});

export type TSubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;
export type TNewSubscriptionPlan = z.infer<typeof newSubscriptionPlanSchema>;
export type TOrganizationSubscription = z.infer<
  typeof organizationSubscriptionSchema
>;
export type TNewOrganizationSubscription = z.infer<
  typeof newOrganizationSubscriptionSchema
>;
export type TPayment = z.infer<typeof paymentSchema>;
export type TNewPayment = z.infer<typeof newPaymentSchema>;
export type TSubscriptionStatus = 'active' | 'expired' | 'cancelled';
export type TPaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type TPaymentMethod = 'khalti' | 'esewa' | 'bank_transfer' | 'cash';
