/**
 * SQLite database runtime constants.
 */

/**
 * SQLite busy timeout in milliseconds.
 * Keeps the client waiting for a lock to clear before throwing SQLITE_BUSY.
 */
export const SQLITE_BUSY_TIMEOUT_MS = 30_000;
