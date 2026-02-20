import {
  DEFAULT_SETTINGS_ID,
  type JobProviderSettings,
  automationSettingsSchema,
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
    throw new Error("Missing settings row for job provider runtime configuration");
  }

  const automationParsed = automationSettingsSchema.safeParse(rows[0]?.automationSettings);
  if (!automationParsed.success) {
    throw new Error("Invalid settings.automationSettings configuration");
  }

  const jobProviderParsed = jobProviderSettingsSchema.safeParse(automationParsed.data.jobProviders);

  if (!jobProviderParsed.success) {
    throw new Error("Missing or invalid settings.automationSettings.jobProviders configuration");
  }

  return jobProviderParsed.data;
}
