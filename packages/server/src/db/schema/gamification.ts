import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const gamification = sqliteTable("gamification", {
  id: text("id").primaryKey().default("default"),
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  achievements: text("achievements", { mode: "json" }).$type<string[]>().default(sql`'[]'`),
  dailyChallenges: text("daily_challenges", { mode: "json" })
    .$type<Record<string, string[]>>()
    .default(sql`'{}'`),
  longestStreak: integer("longest_streak").default(0),
  currentStreak: integer("current_streak").default(0),
  lastActiveDate: text("last_active_date"),
  stats: text("stats", { mode: "json" }).$type<Record<string, unknown>>().default(sql`'{}'`),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
