import { count } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schema from "../schema";
import { studios } from "../schema/studios";
import { SEED_STUDIOS } from "./studios";

export async function seedDatabase(db: BunSQLiteDatabase<typeof schema>) {
  const result = db.select({ count: count() }).from(studios).get();
  if (!result || result.count === 0) {
    for (const studio of SEED_STUDIOS) {
      try {
        db.insert(studios).values(studio).onConflictDoNothing().run();
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`Seeded ${SEED_STUDIOS.length} gaming studios`);
  } else {
    console.log(`Studios already seeded (${result.count} records)`);
  }
}
