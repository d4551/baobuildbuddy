import { COVER_LETTER_DEFAULT_TEMPLATE } from "@bao/shared/constants/cover-letter";
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TIMESTAMP_DEFAULT } from "./column-defaults";

export const coverLetters = sqliteTable("cover_letters", {
  id: text("id").primaryKey(),
  company: text("company").notNull(),
  position: text("position").notNull(),
  jobInfo: text("job_info", { mode: "json" }).$type<Record<string, unknown>>(),
  content: text("content", { mode: "json" }).$type<Record<string, unknown>>().default(sql`'{}'`),
  template: text("template").default(COVER_LETTER_DEFAULT_TEMPLATE),
  createdAt: text("created_at").notNull().default(TIMESTAMP_DEFAULT),
  updatedAt: text("updated_at").notNull().default(TIMESTAMP_DEFAULT),
});
