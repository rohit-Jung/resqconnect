import { integer, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { cpOrganization } from './org-registry.model';

export const cpComplianceConfig = pgTable('cp_compliance_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  cpOrgId: uuid('cp_org_id')
    .notNull()
    .references(() => cpOrganization.id, { onDelete: 'cascade' })
    .unique(),

  config: jsonb('config')
    .$type<{
      hipaa: boolean;
      cjis: boolean;
      sessionTimeoutSeconds: number;
      mfaRequired: boolean;
      failedLoginLockoutEnabled: boolean;
      failedLoginMaxAttempts: number;
      failedLoginWindowSeconds: number;
      failedLoginLockSeconds: number;
    }>()
    .notNull(),

  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
