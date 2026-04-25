import { uniqueIndex } from 'drizzle-orm/pg-core';
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Sanitized audit aggregates pulled from silos.
// No identifiers; safe for cross-silo dashboarding.
export const cpSanitizedAuditAggregate = pgTable(
  'cp_sanitized_audit_aggregate',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siloBaseUrl: text('silo_base_url').notNull(),
    sector: text('sector').notNull(),

    bucket: text('bucket').notNull(),
    actorType: text('actor_type').notNull(),
    statusClass: text('status_class').notNull(),
    count: integer('count').notNull(),

    // First time we saw this bucket entry from the silo.
    bucketStart: timestamp('bucket_start', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [
    uniqueIndex('cp_sanitized_audit_agg_uq').on(
      t.siloBaseUrl,
      t.bucket,
      t.actorType,
      t.statusClass
    ),
  ]
);
