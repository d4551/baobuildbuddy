import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const studios = sqliteTable("studios", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  website: text("website"),
  location: text("location"),
  size: text("size"),
  type: text("type"),
  description: text("description"),
  games: text("games", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
  technologies: text("technologies", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
  culture: text("culture", { mode: "json" }).$type<Record<string, unknown>>(),
  interviewStyle: text("interview_style"),
  remoteWork: integer("remote_work", { mode: "boolean" }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
