import type { Database } from "bun:sqlite";
/**
 * Initialize SQLite schema for all supported tables.
 */
export declare function initializeDatabase(sqlite: Database): void;
