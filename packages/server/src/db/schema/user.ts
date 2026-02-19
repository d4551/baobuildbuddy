import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userProfile = sqliteTable("user_profile", {
  id: text("id").primaryKey().default("default"),
  name: text("name").notNull().default(""),
  email: text("email"),
  phone: text("phone"),
  location: text("location"),
  website: text("website"),
  linkedin: text("linkedin"),
  github: text("github"),
  summary: text("summary"),
  currentRole: text("current_role"),
  currentCompany: text("current_company"),
  yearsExperience: integer("years_experience"),
  technicalSkills: text("technical_skills", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
  softSkills: text("soft_skills", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
  gamingExperience: text("gaming_experience", { mode: "json" })
    .$type<Record<string, unknown>>()
    .default(sql`'{}'`),
  careerGoals: text("career_goals", { mode: "json" })
    .$type<Record<string, unknown>>()
    .default(sql`'{}'`),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
