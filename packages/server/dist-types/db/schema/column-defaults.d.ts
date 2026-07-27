/**
 * Single owner of the timestamp column default.
 *
 * SQLite's `CURRENT_TIMESTAMP` emits `YYYY-MM-DD HH:MM:SS` while every application write uses
 * `new Date().toISOString()`. Both landed in the same `text` column, and SQLite compares text
 * — `' '` (0x20) sorts before `'T'` (0x54) — so a default-stamped row sorted ahead of an ISO
 * row regardless of actual time: `'2026-07-26 23:00:00' < '2026-07-26T01:00:00.000Z'` is true.
 *
 * `strftime('%Y-%m-%dT%H:%M:%fZ','now')` reproduces `toISOString()` byte for byte, so a row
 * stamped by the database and a row stamped by the application are directly comparable.
 */
export declare const TIMESTAMP_DEFAULT_SQL = "(strftime('%Y-%m-%dT%H:%M:%fZ','now'))";
/** Drizzle form for the schema modules. `init-schema.ts` consumes the raw text above. */
export declare const TIMESTAMP_DEFAULT: import("drizzle-orm").SQL<unknown>;
