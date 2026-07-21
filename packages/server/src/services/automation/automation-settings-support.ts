import {
  AUTOMATION_MAX_CONCURRENT_RUNS,
  AUTOMATION_MAX_SCHEDULE_LEAD_TIME_MS,
} from "@bao/shared/constants/automation-limits";
import {
  automationSettingsSchema,
  emailTransportSettingsSchema,
} from "@bao/shared/schemas/settings.schema";
import type { AutomationSettings } from "@bao/shared/types/settings-contracts";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
} from "@bao/shared/types/settings-defaults";
import { isEmailTransportConfigured } from "@bao/shared/utils/email-transport";
import { settle } from "@bao/shared/utils/promise";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../../db/schema/settings";
import { decryptProviderKeys } from "../../utils/settings-decrypt";
import { AIService } from "../ai/ai-service";
import type { EmailTransportRuntimeConfig } from "../email-delivery-service";
import { AutomationValidationError } from "./automation-errors";

const MIN_CONCURRENT_RUNS = 1;
const MIN_SCHEDULE_LEAD_TIME_MS = 1_000;

export const loadAutomationSettings = async (): Promise<AutomationSettings> => {
  const settingsQueryResult = await settle(
    db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1),
  );
  if (settingsQueryResult.status === "rejected") {
    return DEFAULT_AUTOMATION_SETTINGS;
  }

  const rows = settingsQueryResult.value;
  if (rows.length > 0 && rows[0].automationSettings) {
    const parsedSettings = automationSettingsSchema.safeParse(rows[0].automationSettings);
    if (parsedSettings.success) {
      return parsedSettings.data;
    }
  }

  return DEFAULT_AUTOMATION_SETTINGS;
};

export const resolveMaxConcurrentRuns = (settingsValue: AutomationSettings): number => {
  const configured = Number.isFinite(settingsValue.maxConcurrentRuns)
    ? Math.trunc(settingsValue.maxConcurrentRuns)
    : DEFAULT_AUTOMATION_SETTINGS.maxConcurrentRuns;

  return Math.min(Math.max(MIN_CONCURRENT_RUNS, configured), AUTOMATION_MAX_CONCURRENT_RUNS);
};

export const tryLoadAIService = async (): Promise<AIService | null> => {
  const settingsQueryResult = await settle(
    db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1),
  );
  if (settingsQueryResult.status === "rejected") {
    return null;
  }

  const [row] = settingsQueryResult.value;
  return AIService.fromSettings({ ...row, ...decryptProviderKeys(row) });
};

export const loadEmailTransportConfig = async (
  missingSettingsMessage: string,
): Promise<EmailTransportRuntimeConfig> => {
  const settingsQueryResult = await settle(
    db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID)).limit(1),
  );
  if (settingsQueryResult.status === "rejected") {
    throw new Error(missingSettingsMessage);
  }

  const [row] = settingsQueryResult.value;
  const parsedTransportSettings = emailTransportSettingsSchema.safeParse(
    row?.emailTransportSettings ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  );

  if (!parsedTransportSettings.success) {
    throw new Error(missingSettingsMessage);
  }

  const hasPassword = Boolean(row?.emailTransportPassword);
  if (!isEmailTransportConfigured(parsedTransportSettings.data, hasPassword)) {
    throw new Error(missingSettingsMessage);
  }

  return {
    ...parsedTransportSettings.data,
    password: row?.emailTransportPassword ?? null,
  };
};

export const normalizeScheduledRunAt = (runAt: string): string => {
  const parsedRunAt = new Date(runAt);
  const targetMs = parsedRunAt.getTime();
  if (Number.isNaN(targetMs)) {
    throw new AutomationValidationError("runAt must be a valid ISO timestamp");
  }

  const leadTimeMs = targetMs - Date.now();
  if (leadTimeMs < MIN_SCHEDULE_LEAD_TIME_MS) {
    throw new AutomationValidationError("runAt must be at least 1 second in the future");
  }
  if (leadTimeMs > AUTOMATION_MAX_SCHEDULE_LEAD_TIME_MS) {
    throw new AutomationValidationError("runAt must be within 30 days");
  }

  return parsedRunAt.toISOString();
};
