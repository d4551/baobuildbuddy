import type { Database } from "bun:sqlite";
import {
  AUTOMATION_RUNS_REQUIRED_COLUMNS,
  AUTOMATION_RUNS_TABLE_NAME,
  JOBS_REQUIRED_COLUMNS,
  JOBS_TABLE_NAME,
  SETTINGS_REQUIRED_COLUMNS,
  SETTINGS_TABLE_NAME,
  STUDIOS_REQUIRED_COLUMNS,
  STUDIOS_TABLE_NAME,
} from "./init-constants";
import { DEFAULT_PROFILE_ID, DEFAULT_SETTINGS_ID } from "./init-schema";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const ensureSingletonRows = (sqlite: Database): void => {
  sqlite.exec(`INSERT OR IGNORE INTO settings (id) VALUES ('${DEFAULT_SETTINGS_ID}')`);
  sqlite.exec(`INSERT OR IGNORE INTO auth (id) VALUES ('${DEFAULT_PROFILE_ID}')`);
  sqlite.exec(`INSERT OR IGNORE INTO gamification (id) VALUES ('${DEFAULT_PROFILE_ID}')`);
  sqlite.exec(`INSERT OR IGNORE INTO user_profile (id) VALUES ('${DEFAULT_PROFILE_ID}')`);
};

const readTableColumnNames = (sqlite: Database, tableName: string): Set<string> => {
  const rows = sqlite.query(`PRAGMA table_info(${tableName})`).all();
  const names = new Set<string>();

  for (const row of rows) {
    if (!isRecord(row)) {
      continue;
    }
    const name = row.name;
    if (typeof name === "string" && name.length > 0) {
      names.add(name);
    }
  }

  return names;
};

const ensureColumns = (
  sqlite: Database,
  tableName: string,
  requiredColumns: Record<string, string>,
): void => {
  const existingColumns = readTableColumnNames(sqlite, tableName);

  for (const [columnName, columnDefinition] of Object.entries(requiredColumns)) {
    if (existingColumns.has(columnName)) {
      continue;
    }
    sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
};

export const ensureDatabaseMigrations = (sqlite: Database): void => {
  ensureColumns(sqlite, AUTOMATION_RUNS_TABLE_NAME, AUTOMATION_RUNS_REQUIRED_COLUMNS);
  ensureColumns(sqlite, SETTINGS_TABLE_NAME, SETTINGS_REQUIRED_COLUMNS);
  ensureColumns(sqlite, JOBS_TABLE_NAME, JOBS_REQUIRED_COLUMNS);
  ensureColumns(sqlite, STUDIOS_TABLE_NAME, STUDIOS_REQUIRED_COLUMNS);
  ensureSingletonRows(sqlite);
};
