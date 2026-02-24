import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "../schema/schema-modules";
export declare function seedDatabase(db: BunSQLiteDatabase<typeof schema>): void;
