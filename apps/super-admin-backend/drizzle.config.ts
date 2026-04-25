import { defineConfig } from 'drizzle-kit';

// NOTE: Do not import envConfig here.
// drizzle-kit runs in contexts where process.env may be incomplete.
// For generate, drizzle-kit doesn't need a live DB connection.
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/resq_control_plane';

export default defineConfig({
  out: './drizzle/migrations',
  schema: '../../packages/db/src/control-plane',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});
