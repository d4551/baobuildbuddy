import { sql } from "drizzle-orm";
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chatHistory = sqliteTable(
  "chat_history",
  {
    id: text("id").primaryKey(),
    role: text("role").notNull(), // "user" | "assistant" | "system"
    content: text("content").notNull(),
    timestamp: text("timestamp").notNull(),
    sessionId: text("session_id"),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => [
    index("chat_history_session_id_idx").on(table.sessionId),
    index("chat_history_timestamp_idx").on(table.timestamp),
  ],
);
