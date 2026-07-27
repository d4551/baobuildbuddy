import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TIMESTAMP_DEFAULT } from "./column-defaults";

export const chatHistory = sqliteTable(
  "chat_history",
  {
    id: text("id").primaryKey(),
    role: text("role").notNull(), // "user" | "assistant" | "system"
    content: text("content").notNull(),
    timestamp: text("timestamp").notNull(),
    sessionId: text("session_id"),
    createdAt: text("created_at").notNull().default(TIMESTAMP_DEFAULT),
  },
  (table) => [
    index("chat_history_session_id_idx").on(table.sessionId),
    index("chat_history_timestamp_idx").on(table.timestamp),
  ],
);
