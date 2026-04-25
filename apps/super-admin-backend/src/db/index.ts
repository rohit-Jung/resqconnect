import * as schema from '@repo/db/control-plane';

import { drizzle } from 'drizzle-orm/node-postgres';

import { envConfig } from '@/config';

export const db = drizzle(envConfig.database_url, { schema });

export type ControlPlaneSchema = typeof schema;
