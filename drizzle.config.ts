import type { Config } from "drizzle-kit";
import { resolveDatabasePath } from "./packages/server/src/config/paths";

export default {
  schema: "./packages/server/src/db/schema/index.ts",
  out: "./packages/server/src/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: resolveDatabasePath(process.env.DB_PATH),
  },
} satisfies Config;
