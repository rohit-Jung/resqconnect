import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Minimal audit log for compliance. Stored inside the silo DB.
export const auditActorTypeEnum = pgEnum('audit_actor_type', [
  'user',
  'service_provider',
  'organization',
  'admin',
  'internal',
  'anonymous',
]);

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    actorType: auditActorTypeEnum('actor_type').notNull().default('anonymous'),
    actorId: uuid('actor_id'),

    method: varchar('method', { length: 16 }).notNull(),
    path: text('path').notNull(),
    statusCode: varchar('status_code', { length: 8 }).notNull(),

    ip: varchar('ip', { length: 64 }),
    userAgent: text('user_agent'),

    // Allow operators to query by orgId when relevant without joining.
    organizationId: uuid('organization_id'),

    // Free-form metadata; should never include secrets.
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),

    createdAt: timestamp('created_at', { mode: 'string' })
      .notNull()
      .defaultNow(),
  },
  t => [
    index('audit_log_actor_idx').on(t.actorType, t.actorId),
    index('audit_log_created_idx').on(t.createdAt),
    index('audit_log_org_idx').on(t.organizationId),
  ]
);
