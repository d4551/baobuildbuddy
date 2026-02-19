import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const interviewSessions = sqliteTable(
  "interview_sessions",
  {
    id: text("id").primaryKey(),
    studioId: text("studio_id").notNull(),
    config: text("config", { mode: "json" }).$type<Record<string, unknown>>(),
    questions: text("questions", { mode: "json" }).$type<unknown[]>().default(sql`'[]'`),
    responses: text("responses", { mode: "json" }).$type<unknown[]>().default(sql`'[]'`),
    finalAnalysis: text("final_analysis", { mode: "json" }).$type<Record<string, unknown>>(),
    status: text("status").default("preparing"),
    startTime: integer("start_time"),
    endTime: integer("end_time"),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [index("interview_sessions_studio_id_idx").on(table.studioId)],
);
