import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { resolveDatabasePath } from "../config/paths";
import { config } from "../config/env";
import * as schema from "./schema";

const dbPath = resolveDatabasePath(Bun.env.DB_PATH ?? config.dbPath);
const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
sqlite.exec("PRAGMA busy_timeout = 30000;");

export const db = drizzle({ client: sqlite, schema });
export { sqlite };
