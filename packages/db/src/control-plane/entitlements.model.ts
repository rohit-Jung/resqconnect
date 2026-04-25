import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { cpOrganization } from './org-registry.model';

// Minimal mirror of subscription plans in the control-plane.
// Features are stored as key=value strings.
export const cpSubscriptionPlan = pgTable('cp_subscription_plan', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(), // paisa
  durationMonths: integer('duration_months').notNull(),
  features: jsonb('features').$type<string[]>().notNull().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Stores the latest computed entitlements for an org.
export const cpOrgEntitlements = pgTable(
  'cp_org_entitlements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cpOrgId: uuid('cp_org_id')
      .notNull()
      .references(() => cpOrganization.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    entitlements: jsonb('entitlements')
      .$type<Record<string, string | number | boolean | null>>()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => ({
    orgVersionUq: uniqueIndex('cp_org_entitlements_org_version_uq').on(
      t.cpOrgId,
      t.version
    ),
  })
);

// Maps a Khalti pidx to org+plan so the webhook can compute entitlements.
export const cpPaymentIntent = pgTable(
  'cp_payment_intent',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cpOrgId: uuid('cp_org_id')
      .notNull()
      .references(() => cpOrganization.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => cpSubscriptionPlan.id, { onDelete: 'restrict' }),
    khaltiPidx: text('khalti_pidx').notNull(),
    // Keep a copy for listing/debugging; webhook lookup is still the authority.
    khaltiStatus: text('khalti_status').notNull().default('initiated'),
    // Nullable until lookup happens.
    khaltiTransactionId: text('khalti_transaction_id'),
    amount: integer('amount').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [uniqueIndex('cp_payment_intent_khalti_pidx_uq').on(t.khaltiPidx)]
);

export const cpOrgEntitlementsRelations = relations(
  cpOrgEntitlements,
  ({ one }) => ({
    org: one(cpOrganization, {
      fields: [cpOrgEntitlements.cpOrgId],
      references: [cpOrganization.id],
    }),
  })
);

export const cpPaymentIntentRelations = relations(
  cpPaymentIntent,
  ({ one }) => ({
    org: one(cpOrganization, {
      fields: [cpPaymentIntent.cpOrgId],
      references: [cpOrganization.id],
    }),
    plan: one(cpSubscriptionPlan, {
      fields: [cpPaymentIntent.planId],
      references: [cpSubscriptionPlan.id],
    }),
  })
);
