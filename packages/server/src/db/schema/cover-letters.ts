import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const coverLetters = sqliteTable("cover_letters", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  jobInfo: text("job_info", { mode: "json" }).$type<Record<string, unknown>>(),
  content: text("content", { mode: "json" }).$type<Record<string, unknown>>().default(sql`'{}'`),
  template: text("template").default("professional"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
