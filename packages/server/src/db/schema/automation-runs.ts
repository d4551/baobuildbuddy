import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Persisted audit trail for automation run execution and output.
 */
export const automationRuns = sqliteTable("automation_runs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "scrape" | "job_apply" | "email"
  status: text("status").notNull().default("pending"), // "pending" | "running" | "success" | "error"
  jobId: text("job_id"),
  userId: text("user_id"),
  input: text("input", { mode: "json" }).$type<Record<string, unknown>>(),
  output: text("output", { mode: "json" }).$type<Record<string, unknown>>(),
  screenshots: text("screenshots", { mode: "json" }).$type<string[]>(),
  error: text("error"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
