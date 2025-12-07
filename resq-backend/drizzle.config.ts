import "dotenv/config";
import { defineConfig } from "drizzle-kit";

import { envConfig } from "./src/config/env.config";

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./src/models",
  dialect: "postgresql",
  dbCredentials: {
    url: envConfig.database_url,
  },
});
