import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

import { envConfig } from './src/config/env.config';

export default defineConfig({
  out: './drizzle/migrations',
  // point drizzle-kit at the shared schema package.
  schema: '../../packages/db/src/schemas',
  dialect: 'postgresql',
  dbCredentials: {
    url: envConfig.database_url as string,
  },
  extensionsFilters: ['postgis'],
});
