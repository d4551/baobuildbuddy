import { DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { normalizeLocalModelEndpoint } from "@bao/shared/types/settings-normalization";
import { eq } from "drizzle-orm";
import { config } from "../config/env";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";

/**
 * Seeds LOCAL_MODEL_* from process env into settings when DB endpoint is empty.
 * Keeps `.env` from becoming a silent dual source after first boot.
 */
const applyLocalModelEnvDefaults = async (
  row: typeof settings.$inferSelect,
): Promise<typeof settings.$inferSelect> => {
  const envEndpoint = normalizeLocalModelEndpoint(config.localModelEndpoint);
  const envModel = config.localModelName?.trim() || null;
  const hasDbEndpoint =
    typeof row.localModelEndpoint === "string" && row.localModelEndpoint.trim().length > 0;
  if (hasDbEndpoint || !envEndpoint) {
    return row;
  }

  const update = {
    localModelEndpoint: envEndpoint,
    ...(envModel ? { localModelName: envModel } : {}),
    updatedAt: new Date().toISOString(),
  };
  await db.update(settings).set(update).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  const refreshed = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  return refreshed[0] ?? { ...row, ...update };
};

export const readOrCreateSettingsRow = async () => {
  let rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  if (rows.length === 0) {
    await db.insert(settings).values({ id: DEFAULT_SETTINGS_ID });
    rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  }

  const row = rows[0] ?? null;
  if (!row) {
    return null;
  }
  return applyLocalModelEnvDefaults(row);
};
