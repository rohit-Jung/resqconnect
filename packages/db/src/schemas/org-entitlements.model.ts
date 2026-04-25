import { relations } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { organization } from './organization.model';

// Versioned entitlements snapshots pushed from the control plane.
// Silo enforces locally so it can run even if control plane is down.
export const organizationEntitlementsSnapshot = pgTable(
  'organization_entitlements_snapshot',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    entitlements: jsonb('entitlements')
      .$type<Record<string, string | number | boolean | null>>()
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  t => ({
    orgVersionUq: uniqueIndex('org_entitlements_org_version_uq').on(
      t.organizationId,
      t.version
    ),
  })
);

export const organizationEntitlementsSnapshotRelations = relations(
  organizationEntitlementsSnapshot,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationEntitlementsSnapshot.organizationId],
      references: [organization.id],
    }),
  })
);
