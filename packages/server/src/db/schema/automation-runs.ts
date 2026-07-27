import type { JsonObject } from "@bao/shared/utils/json";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TIMESTAMP_DEFAULT } from "./column-defaults";

/**
 * Persisted audit trail for automation run execution and output.
 */
export const automationRuns = sqliteTable("automation_runs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "scrape" | "job_apply" | "email"
  status: text("status").notNull().default("pending"), // "pending" | "running" | "success" | "error"
  jobId: text("job_id"),
  userId: text("user_id"),
  input: text("input", { mode: "json" }).$type<JsonObject>(),
  output: text("output", { mode: "json" }).$type<JsonObject>(),
  screenshots: text("screenshots", { mode: "json" }).$type<string[]>(),
  error: text("error"),
  // Progress tracking fields for WebSocket streaming
  progress: integer("progress").default(0),
  currentStep: integer("current_step"),
  totalSteps: integer("total_steps"),
  exitCode: integer("exit_code"),
  timedOut: integer("timed_out", { mode: "boolean" }).notNull().default(false),
  aborted: integer("aborted", { mode: "boolean" }).notNull().default(false),
  executionMs: integer("execution_ms"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(TIMESTAMP_DEFAULT),
  updatedAt: text("updated_at").notNull().default(TIMESTAMP_DEFAULT),
});
