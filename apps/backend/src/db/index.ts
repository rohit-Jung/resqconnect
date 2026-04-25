import * as models from '@repo/db/schemas';

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

import { envConfig } from '@/config';

// Connect to the database
const db = drizzle(envConfig.database_url, { schema: models });

export default db;
