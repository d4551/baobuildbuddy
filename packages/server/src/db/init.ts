import type { Database } from "bun:sqlite";
import { ensureDatabaseMigrations } from "./init-migrations";
import { INDEXES, TABLE_DEFINITIONS } from "./init-schema";

/**
 * Initialize SQLite schema for all supported tables.
 */
export function initializeDatabase(sqlite: Database): void {
  for (const ddl of TABLE_DEFINITIONS) {
    sqlite.exec(ddl);
  }

  ensureDatabaseMigrations(sqlite);

  for (const indexSql of INDEXES) {
    sqlite.exec(indexSql);
  }
}
