import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const auth = sqliteTable("auth", {
  id: text("id").primaryKey().default("default"),
  apiKey: text("api_key"),
});
