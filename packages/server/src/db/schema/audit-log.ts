import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { TIMESTAMP_DEFAULT } from "./column-defaults";

// Table name must match `init-schema.ts`, which creates `audit_log`. A hyphen here meant every
// `db.insert(auditLog)` in auth.routes.ts threw "no such table: audit-log" — auth audit logging
// never recorded an event, and the created table sat empty.
export const auditLog = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  event: text("event").notNull(),
  actor: text("actor"),
  detail: text("detail"),
  ip: text("ip"),
  createdAt: text("created_at").notNull().default(TIMESTAMP_DEFAULT),
});
