import {
  API_ERROR_INVALID_AUTOMATION_CONFIG,
  API_ERROR_MISSING_JOB_PROVIDERS,
  API_ERROR_MISSING_SETTINGS_ROW,
  automationSettingsSchema,
  DEFAULT_SETTINGS_ID,
  type JobProviderSettings,
  jobProviderSettingsSchema,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../../../db/client";
import { settings } from "../../../db/schema/settings";

/**
 * Loads persisted job-provider runtime settings from the settings table.
 */
export async function loadJobProviderSettings(): Promise<JobProviderSettings> {
  const rows = await db
    .select({ automationSettings: settings.automationSettings })
    .from(settings)
    .where(eq(settings.id, DEFAULT_SETTINGS_ID))
    .limit(1);

  if (rows.length === 0) {
    throw new Error(API_ERROR_MISSING_SETTINGS_ROW);
  }

  const automationParsed = automationSettingsSchema.safeParse(rows[0]?.automationSettings);
  if (!automationParsed.success) {
    throw new Error(API_ERROR_INVALID_AUTOMATION_CONFIG);
  }

  const jobProviderParsed = jobProviderSettingsSchema.safeParse(automationParsed.data.jobProviders);

  if (!jobProviderParsed.success) {
    throw new Error(API_ERROR_MISSING_JOB_PROVIDERS);
  }

  return jobProviderParsed.data;
}
