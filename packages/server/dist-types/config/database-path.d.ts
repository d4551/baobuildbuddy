/**
 * Expand a path that starts with ~ to the current user home directory.
 */
export declare function expandHomeDirectory(pathValue: string): string;
/**
 * Resolve a DB path and ensure its parent directory exists.
 */
export declare function resolveDatabasePath(rawPath?: string): string;
