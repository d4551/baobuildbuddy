import { API_ERROR_INVALID_GAMIFICATION_PAYLOAD } from "@bao/shared/constants/api-errors";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import type { JsonObject } from "@bao/shared/utils/json";
import { isRecord } from "@bao/shared/utils/type-guards";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { gamification } from "../db/schema/gamification";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import type { BaoImportData } from "./data-service-contracts";
import { runWithErrorHandler } from "./data-service-helpers";
import {
  omitImportMetadata,
  parseGamificationInsert,
  sanitizeImportedSettings,
} from "./data-service-parsers";

export const importProfileSection = async (
  data: BaoImportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!data.profile) {
    return;
  }

  await runWithErrorHandler(
    async () => {
      const existing = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      const profile: JsonObject = isRecord(data.profile) ? data.profile : {};
      if (existing.length > 0) {
        const rest = omitImportMetadata(profile);
        await db
          .update(userProfile)
          .set({ ...rest, updatedAt: new Date().toISOString() })
          .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      } else {
        await db.insert(userProfile).values({ ...profile, id: DEFAULT_PROFILE_ID });
      }
      imported.profile = 1;
    },
    (message) => {
      errors.push(`Profile import failed: ${message}`);
    },
  );
};

export const importSettingsSection = async (
  data: BaoImportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!data.settings) {
    return;
  }

  await runWithErrorHandler(
    async () => {
      const normalized = sanitizeImportedSettings(data.settings);
      const existing = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
      if (existing.length > 0) {
        await db
          .update(settings)
          .set({ ...normalized, updatedAt: new Date().toISOString() })
          .where(eq(settings.id, DEFAULT_SETTINGS_ID));
      } else {
        await db.insert(settings).values({ ...normalized, id: DEFAULT_SETTINGS_ID });
      }
      imported.settings = 1;
    },
    (message) => {
      errors.push(`Settings import failed: ${message}`);
    },
  );
};

export const importGamificationSection = async (
  data: BaoImportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  if (!data.gamification) {
    return;
  }

  await runWithErrorHandler(
    async () => {
      const existing = await db
        .select()
        .from(gamification)
        .where(eq(gamification.id, DEFAULT_PROFILE_ID));
      const parsedGamification = parseGamificationInsert(data.gamification);
      if (!parsedGamification) throw new Error(API_ERROR_INVALID_GAMIFICATION_PAYLOAD);
      if (existing.length > 0) {
        const rest = omitImportMetadata(parsedGamification);
        await db
          .update(gamification)
          .set({ ...rest, updatedAt: new Date().toISOString() })
          .where(eq(gamification.id, DEFAULT_PROFILE_ID));
      } else {
        await db.insert(gamification).values({ ...parsedGamification, id: DEFAULT_PROFILE_ID });
      }
      imported.gamification = 1;
    },
    (message) => {
      errors.push(`Gamification import failed: ${message}`);
    },
  );
};
