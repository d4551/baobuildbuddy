import { describe, expect, test } from "bun:test";
import {
  collectDrizzleTables,
  collectInitSchemaTables,
  collectSchemaParityViolations,
  type TableDefinition,
} from "./validate-schema-definition-parity";

const INIT_SOURCE = [
  "export const TABLE_DEFINITIONS = [",
  "  `CREATE TABLE IF NOT EXISTS audit_log (",
  "      id INTEGER PRIMARY KEY AUTOINCREMENT,",
  "      event TEXT NOT NULL,",
  "      created_at TEXT NOT NULL DEFAULT (x)",
  "    )`,",
  "];",
].join("\n");

const drizzleSource = (tableName: string, extraColumn = ""): string =>
  [
    `export const auditLog = sqliteTable("${tableName}", {`,
    '  id: integer("id").primaryKey(),',
    '  event: text("event").notNull(),',
    '  createdAt: text("created_at").notNull(),',
    extraColumn,
    "});",
  ].join("\n");

const definitionsOf = (source: string, table: string): TableDefinition[] =>
  collectDrizzleTables(source).filter((entry) => entry.table === table);

describe("collectInitSchemaTables", () => {
  test("reads the table name and its columns from raw CREATE TABLE SQL", () => {
    const [table] = collectInitSchemaTables(INIT_SOURCE);

    expect(table?.table).toBe("audit_log");
    expect([...(table?.columns ?? [])].sort()).toEqual(["created_at", "event", "id"]);
  });
});

describe("collectDrizzleTables", () => {
  test("reads the table name and its columns from a sqliteTable declaration", () => {
    const [table] = definitionsOf(drizzleSource("audit_log"), "audit_log");

    expect([...(table?.columns ?? [])].sort()).toEqual(["created_at", "event", "id"]);
  });

  /** A hyphenated name is the defect to report; matching only `\w+` silently skipped it. */
  test("reads a table name that is not a bare word", () => {
    expect(definitionsOf(drizzleSource("audit-log"), "audit-log")).toHaveLength(1);
  });
});

describe("collectSchemaParityViolations", () => {
  test("passes when both sides agree", () => {
    const violations = collectSchemaParityViolations(
      collectInitSchemaTables(INIT_SOURCE),
      collectDrizzleTables(drizzleSource("audit_log")),
    );

    expect(violations).toHaveLength(0);
  });

  test("flags a drizzle table the bootstrap never creates", () => {
    const violations = collectSchemaParityViolations(
      collectInitSchemaTables(INIT_SOURCE),
      collectDrizzleTables(drizzleSource("audit-log")),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("audit-log");
    expect(violations[0]?.message).toContain("no such table");
  });

  test("flags a column the drizzle schema queries but the bootstrap never creates", () => {
    const violations = collectSchemaParityViolations(
      collectInitSchemaTables(INIT_SOURCE),
      collectDrizzleTables(drizzleSource("audit_log", '  actor: text("actor"),')),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("actor");
  });

  /** Raw SQL may own tables no ORM query reaches, so that direction is not a defect. */
  test("permits a created table with no drizzle declaration", () => {
    const violations = collectSchemaParityViolations(collectInitSchemaTables(INIT_SOURCE), []);

    expect(violations).toHaveLength(0);
  });
});
