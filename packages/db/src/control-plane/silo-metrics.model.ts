import { index } from 'drizzle-orm/pg-core';
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// Time-series metrics pulled from silos (append-only).
export const cpSiloMetrics = pgTable(
  'cp_silo_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siloBaseUrl: text('silo_base_url').notNull(),
    sector: text('sector').notNull(),

    metrics: jsonb('metrics').$type<Record<string, unknown>>().notNull(),
    collectedAt: timestamp('collected_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  t => [
    index('cp_silo_metrics_silo_collected_idx').on(
      t.siloBaseUrl,
      t.collectedAt
    ),
  ]
);
