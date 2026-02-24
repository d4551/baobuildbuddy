import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "../schema";
import { studios } from "../schema/studios";
import { SEED_STUDIOS } from "./studios";

export function seedDatabase(db: BunSQLiteDatabase<typeof schema>): void {
  for (const studio of SEED_STUDIOS) {
    db.insert(studios).values(studio).onConflictDoNothing().run();
  }
}
