import type { Config } from "drizzle-kit";
import { resolveDatabasePath } from "./packages/server/src/config/database-path";

export default {
  schema: "./packages/server/src/db/schema/schema-modules.ts",
  out: "./packages/server/src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: resolveDatabasePath(process.env.DB_PATH),
  },
} satisfies Config;
