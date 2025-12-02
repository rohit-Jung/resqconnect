import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

import { envConfig } from "@/config/env.config";
import * as models from "@/models";

// Connect to the database
const db = drizzle(envConfig.database_url, { schema: models });

export default db;
