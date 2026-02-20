import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "../schema";
export declare function seedDatabase(db: BunSQLiteDatabase<typeof schema>): Promise<void>;
