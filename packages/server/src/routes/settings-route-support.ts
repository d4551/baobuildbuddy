import { DEFAULT_SETTINGS_ID } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";

export const readOrCreateSettingsRow = async () => {
  let rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  if (rows.length === 0) {
    await db.insert(settings).values({ id: DEFAULT_SETTINGS_ID });
    rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  }

  return rows[0] ?? null;
};
