import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const auditLog = sqliteTable("audit-log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  actor: text("actor"),
  detail: text("detail"),
  ip: text("ip"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
