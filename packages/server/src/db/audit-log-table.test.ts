import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { initializeDatabase } from "./init";
import { auditLog } from "./schema/audit-log";

/**
 * Tables are declared twice — `init-schema.ts` creates them with raw SQL, the drizzle schema
 * types the queries against them. Nothing checked the two agreed on a name, and they did not:
 * the schema said `audit-log` while the creator said `audit_log`. Every
 * `db.insert(auditLog)` in `auth.routes.ts` therefore threw "no such table: audit-log", so no
 * auth event was ever recorded and the created table stayed empty in the live database.
 *
 * Asserting through drizzle against a real initialized database is what catches this: a test
 * that only exercised the drizzle schema, or only the raw SQL, passes with the names divergent.
 */
/** The exact shape `new Date().toISOString()` produces, which the column default must match. */
const ISO_8601_MILLIS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

describe("audit log table identity", () => {
  test("a drizzle insert reaches the table init-schema creates", async () => {
    const sqlite = new Database(":memory:");
    initializeDatabase(sqlite);
    const db = drizzle({ client: sqlite });

    await db
      .insert(auditLog)
      .values({ event: "api_key_rotated", actor: "operator", detail: "rotation", ip: null });

    const rows = sqlite.query("SELECT event, actor FROM audit_log").all();

    expect(rows).toEqual([{ event: "api_key_rotated", actor: "operator" }]);
  });

  test("the created row carries an ISO-8601 timestamp from the column default", async () => {
    const sqlite = new Database(":memory:");
    initializeDatabase(sqlite);
    const db = drizzle({ client: sqlite });

    await db.insert(auditLog).values({ event: "api_key_revoked", actor: null, detail: null });
    const row = sqlite.query("SELECT created_at FROM audit_log").get() as { created_at: string };

    expect(row.created_at).toMatch(ISO_8601_MILLIS);
  });
});
