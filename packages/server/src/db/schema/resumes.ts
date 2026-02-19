import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resumes = sqliteTable("resumes", {
  id: text("id").primaryKey(),
  name: text("name").default("Untitled Resume"),
  personalInfo: text("personal_info", { mode: "json" }).$type<Record<string, unknown>>(),
  summary: text("summary"),
  experience: text("experience", { mode: "json" }).$type<unknown[]>().default(sql`'[]'`),
  education: text("education", { mode: "json" }).$type<unknown[]>().default(sql`'[]'`),
  skills: text("skills", { mode: "json" }).$type<Record<string, unknown>>(),
  projects: text("projects", { mode: "json" }).$type<unknown[]>().default(sql`'[]'`),
  gamingExperience: text("gaming_experience", { mode: "json" }).$type<Record<string, unknown>>(),
  template: text("template").default("modern"),
  theme: text("theme").default("light"),
  isDefault: integer("is_default", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
