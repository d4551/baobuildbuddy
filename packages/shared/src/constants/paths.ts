/**
 * Path constants for BaoBuildBuddy data directory.
 * Single source of truth for .bao directory structure.
 */

/** Relative path from user home: .bao/bao.db */
export const DEFAULT_DB_PATH_RELATIVE = ".bao/bao.db" as const;

/** Default DB path with tilde expansion (for env/docs): ~/.bao/bao.db */
export const DEFAULT_DB_PATH_TILDE = `~/${DEFAULT_DB_PATH_RELATIVE}` as const;
