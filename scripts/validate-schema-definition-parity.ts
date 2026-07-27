import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * The raw `CREATE TABLE` statements and the drizzle schema must describe the same tables.
 *
 * Tables are declared twice: `init-schema.ts` creates them at runtime, the drizzle schema types
 * every query against them. Nothing compared the two, and they diverged — the schema said
 * `audit-log` while the creator said `audit_log`, so every `db.insert(auditLog)` in
 * `auth.routes.ts` threw "no such table" and no auth event was ever recorded. A test covering
 * only one side passes while the two disagree; only a comparison catches it.
 */
const INIT_SCHEMA_PATH = "packages/server/src/db/init-schema.ts";
const SCHEMA_DIR = "packages/server/src/db/schema";

const CREATE_TABLE_PATTERN = /CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\n\s*\)`/gu;
const SQL_COLUMN_PATTERN = /^\s{4,}(\w+)\s+(?:TEXT|INTEGER|REAL|BLOB|NUMERIC)\b/gmu;
/** Accepts any quoted name, not just `\w+` — a malformed name is the defect to catch, not skip. */
const DRIZZLE_TABLE_PATTERN = /sqliteTable\(\s*"([^"]+)"\s*,\s*\{([\s\S]*?)\n\s*\}/gu;
const DRIZZLE_COLUMN_PATTERN = /\w+:\s*(?:text|integer|real|blob|numeric)\(\s*"(\w+)"/gu;

export type TableDefinition = {
  readonly table: string;
  readonly columns: ReadonlySet<string>;
};

const readMatches = (source: string, pattern: RegExp): string[] =>
  [...source.matchAll(pattern)].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));

/** Tables created by the raw bootstrap SQL. */
export const collectInitSchemaTables = (source: string): TableDefinition[] =>
  [...source.matchAll(CREATE_TABLE_PATTERN)].flatMap((match) => {
    const table = match[1];
    const body = match[2];
    if (table === undefined || body === undefined) {
      return [];
    }
    return [{ table, columns: new Set(readMatches(body, SQL_COLUMN_PATTERN)) }];
  });

/** Tables the drizzle schema types queries against. */
export const collectDrizzleTables = (source: string): TableDefinition[] =>
  [...source.matchAll(DRIZZLE_TABLE_PATTERN)].flatMap((match) => {
    const table = match[1];
    const body = match[2];
    if (table === undefined || body === undefined) {
      return [];
    }
    return [{ table, columns: new Set(readMatches(body, DRIZZLE_COLUMN_PATTERN)) }];
  });

const describeMissing = (names: readonly string[]): string => names.slice().sort().join(", ");

/**
 * Reports drizzle tables the bootstrap never creates, and column sets that disagree.
 *
 * The reverse direction — a created table with no drizzle definition — is not a defect: raw SQL
 * may own tables no query reaches through the ORM.
 */
export const collectSchemaParityViolations = (
  initTables: readonly TableDefinition[],
  drizzleTables: readonly TableDefinition[],
): ValidationViolation[] => {
  const created = new Map(initTables.map((entry) => [entry.table, entry.columns]));

  return drizzleTables.flatMap((declared) => {
    const createdColumns = created.get(declared.table);
    if (!createdColumns) {
      return [
        {
          filePath: INIT_SCHEMA_PATH,
          line: 1,
          message: `Drizzle declares table \`${declared.table}\` but the bootstrap never creates it — every query against it fails with "no such table".`,
        },
      ];
    }
    const absent = [...declared.columns].filter((column) => !createdColumns.has(column));
    if (absent.length === 0) {
      return [];
    }
    return [
      {
        filePath: INIT_SCHEMA_PATH,
        line: 1,
        message: `Table \`${declared.table}\` is missing column(s) the drizzle schema queries: ${describeMissing(absent)}.`,
      },
    ];
  });
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const initSource = await Bun.file(INIT_SCHEMA_PATH).text();
  const schemaFiles = await collectProjectFileEntries({
    scanRoots: [SCHEMA_DIR],
    allowedExtensions: new Set([".ts"]),
  });

  const drizzleTables = schemaFiles.flatMap(({ content }) => collectDrizzleTables(content));
  return collectSchemaParityViolations(collectInitSchemaTables(initSource), drizzleTables);
};

if (import.meta.main) {
  await reportViolations(
    "Schema definition parity validation failed:",
    await collectViolations(),
    "Schema definition parity validation passed: every drizzle table is created with the columns it queries.",
  );
}
