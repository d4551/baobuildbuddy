import { DEFAULT_PROFILE_ID } from "@bao/shared";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const auth = sqliteTable("auth", {
  id: text("id").primaryKey().default(DEFAULT_PROFILE_ID),
  apiKey: text("api_key"),
});
