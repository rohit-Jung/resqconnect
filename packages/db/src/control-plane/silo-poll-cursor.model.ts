import { uniqueIndex } from 'drizzle-orm/pg-core';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Track per-silo cursors for incremental polling.
export const cpSiloPollCursor = pgTable(
  'cp_silo_poll_cursor',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siloBaseUrl: text('silo_base_url').notNull(),

    sanitizedIndexCursor: timestamp('sanitized_index_cursor', {
      withTimezone: true,
    }),
    orgSnapshotsCursor: timestamp('org_snapshots_cursor', {
      withTimezone: true,
    }),

    lastPolledAt: timestamp('last_polled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [uniqueIndex('cp_silo_poll_cursor_silo_base_url_uq').on(t.siloBaseUrl)]
);
