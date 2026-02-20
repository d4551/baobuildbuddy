import { Database } from "bun:sqlite";
import * as schema from "./schema";
declare const sqlite: Database;
export declare const db: import("drizzle-orm/bun-sqlite").BunSQLiteDatabase<typeof schema> & {
    $client: Database;
};
export { sqlite };
