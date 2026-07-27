import { normalizeAIRouting } from "@bao/shared/constants/ai-provider";
import {
  type AppDataTheme,
  mergeBrandSettings,
  normalizeAppDataTheme,
  resolveBrandSettings,
} from "@bao/shared/tokens/branding";
import {
  automationSettingsSchema,
  brandSettingsPatchSchema,
  brandSettingsSchema,
  emailTransportSettingsSchema,
} from "@bao/shared/schemas/settings.schema";
import {
  AI_ROUTING_PURPOSE_IDS,
  type AIProviderType,
  type AIRouting,
  type AIRoutingPurpose,
  type AIRoutingTarget,
} from "@bao/shared/types/ai";
import type {
  AutomationSettings,
  BrandSettings,
  BrandSettingsPatch,
  EmailTransportSettings,
  NotificationPreferences,
} from "@bao/shared/types/settings-contracts";
import {
  DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "@bao/shared/types/settings-defaults";
import {
  normalizeAutomationSettings,
  normalizeLocalModelEndpoint,
} from "@bao/shared/types/settings-normalization";
import type { settings as settingsTable } from "../db/schema/settings";
import { encryptProviderKey, isEncryptionAvailable } from "../utils/crypto";
import { resolveKnownProvider } from "./settings-route-contracts";

const automationSettingsPatchSchema = automationSettingsSchema.removeDefault().partial();
const emailTransportSettingsPatchSchema = emailTransportSettingsSchema.removeDefault().partial();
type SettingsRow = typeof settingsTable.$inferSelect;
type SettingsInsert = typeof settingsTable.$inferInsert;

const normalizeNotificationPreferences = (
  current: Record<string, boolean> | NotificationPreferences | null | undefined,
): NotificationPreferences => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  achievements:
    typeof current?.achievements === "boolean"
      ? current.achievements
      : DEFAULT_NOTIFICATION_PREFERENCES.achievements,
  dailyChallenges:
    typeof current?.dailyChallenges === "boolean"
      ? current.dailyChallenges
      : DEFAULT_NOTIFICATION_PREFERENCES.dailyChallenges,
  levelUp:
    typeof current?.levelUp === "boolean"
      ? current.levelUp
      : DEFAULT_NOTIFICATION_PREFERENCES.levelUp,
  jobAlerts:
    typeof current?.jobAlerts === "boolean"
      ? current.jobAlerts
      : DEFAULT_NOTIFICATION_PREFERENCES.jobAlerts,
});

const toNotificationRecord = (value: NotificationPreferences): Record<string, boolean> => ({
  achievements: value.achievements,
  dailyChallenges: value.dailyChallenges,
  levelUp: value.levelUp,
  jobAlerts: value.jobAlerts,
});

const mergeNotifications = (
  current: Record<string, boolean> | NotificationPreferences | null | undefined,
  patch: Partial<NotificationPreferences> | null | undefined,
): NotificationPreferences => ({
  ...DEFAULT_NOTIFICATION_PREFERENCES,
  ...normalizeNotificationPreferences(current),
  ...(patch ?? {}),
});

const mergeAutomationSettings = (
  current: AutomationSettings | null | undefined,
  patch: Partial<AutomationSettings> | null | undefined,
): AutomationSettings | null => {
  const currentParsed = automationSettingsSchema.safeParse(current);
  const patchParsed = automationSettingsPatchSchema.safeParse(patch ?? {});
  if (!(currentParsed.success && patchParsed.success)) {
    return null;
  }

  const mergedCandidate: AutomationSettings = {
    ...currentParsed.data,
    ...patchParsed.data,
    jobProviders: patchParsed.data.jobProviders ?? currentParsed.data.jobProviders,
  };

  const mergedParsed = automationSettingsSchema.safeParse(
    normalizeAutomationSettings(mergedCandidate),
  );
  return mergedParsed.success ? mergedParsed.data : null;
};

const mergeEmailTransportSettings = (
  current: EmailTransportSettings | null | undefined,
  patch: Partial<EmailTransportSettings> | null | undefined,
): EmailTransportSettings | null => {
  const currentParsed = emailTransportSettingsSchema.safeParse(
    current ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS,
  );
  const patchParsed = emailTransportSettingsPatchSchema.safeParse(patch ?? {});
  if (!(currentParsed.success && patchParsed.success)) {
    return null;
  }

  const mergedCandidate: EmailTransportSettings = {
    ...currentParsed.data,
    ...patchParsed.data,
  };

  const mergedParsed = emailTransportSettingsSchema.safeParse(mergedCandidate);
  return mergedParsed.success ? mergedParsed.data : null;
};

const mergePersistedBrandSettings = (
  current: BrandSettings | null | undefined,
  patch: BrandSettingsPatch | null | undefined,
): BrandSettings | null => {
  const currentParsed = brandSettingsSchema.safeParse(resolveBrandSettings(current));
  const patchParsed = brandSettingsPatchSchema.safeParse(patch ?? {});
  if (!(currentParsed.success && patchParsed.success)) {
    return null;
  }

  const mergedCandidate = mergeBrandSettings(currentParsed.data, patchParsed.data);
  const mergedParsed = brandSettingsSchema.safeParse(mergedCandidate);
  return mergedParsed.success ? mergedParsed.data : null;
};

interface SettingsUpdateInput {
  aiRouting?: AIRouting;
  preferredProvider?: AIProviderType;
  preferredModel?: string;
  theme?: AppDataTheme | "bao-light" | "bao-dark";
  language?: string;
  brandSettings?: BrandSettingsPatch;
  notifications?: Partial<NotificationPreferences>;
  automationSettings?: Partial<AutomationSettings>;
  emailTransportSettings?: Partial<EmailTransportSettings>;
}

/**
 * `normalizeAIRouting` treats a per-purpose provider/model already present in the
 * persisted routing as authoritative and only falls back to the top-level values.
 * So a request carrying just `preferredModel` was silently discarded — the stored
 * `aiRouting.chat.model` won — while the route still answered `{ success: true }`.
 * Changing the model from the API or the settings UI was therefore impossible once a
 * routing entry existed.
 *
 * When the caller sets the top-level fields and does NOT send an explicit
 * `aiRouting`, they are stating intent for every purpose, so clear the persisted
 * per-purpose overrides and let the top-level values apply.
 */
type PartialAIRouting = Partial<Record<AIRoutingPurpose, Partial<AIRoutingTarget> | undefined>>;

const clearRoutingOverrides = (
  routing: SettingsRow["aiRouting"],
  clearProvider: boolean,
  clearModel: boolean,
): PartialAIRouting | null => {
  if (!routing || (!clearProvider && !clearModel)) {
    return routing;
  }

  const cleared: PartialAIRouting = {};
  for (const purpose of AI_ROUTING_PURPOSE_IDS) {
    const target = routing[purpose];
    if (!target) {
      continue;
    }
    cleared[purpose] = {
      ...(clearProvider ? {} : { provider: target.provider }),
      ...(clearModel ? {} : { model: target.model }),
    };
  }
  return cleared;
};

const resolveRoutingUpdate = (existingRow: SettingsRow, body: SettingsUpdateInput) => {
  const nextPreferredProvider =
    body.preferredProvider ?? resolveKnownProvider(existingRow.preferredProvider);
  const nextPreferredModel = body.preferredModel ?? existingRow.preferredModel ?? undefined;
  const shouldUpdateRouting =
    body.aiRouting !== undefined ||
    body.preferredProvider !== undefined ||
    body.preferredModel !== undefined;

  if (!shouldUpdateRouting) {
    return;
  }

  const baseRouting =
    body.aiRouting ??
    clearRoutingOverrides(
      existingRow.aiRouting,
      body.preferredProvider !== undefined,
      body.preferredModel !== undefined,
    );

  const aiRouting = normalizeAIRouting(baseRouting, nextPreferredProvider, nextPreferredModel);

  return {
    aiRouting,
    preferredProvider: aiRouting.chat.provider,
    preferredModel: aiRouting.chat.model ?? null,
  };
};

export const buildSettingsUpdate = (
  existingRow: SettingsRow,
  body: SettingsUpdateInput,
): Partial<SettingsInsert> | null => {
  const update: Partial<SettingsInsert> = {};
  const routingUpdate = resolveRoutingUpdate(existingRow, body);

  if (routingUpdate) {
    update.aiRouting = routingUpdate.aiRouting;
    update.preferredProvider = routingUpdate.preferredProvider;
    update.preferredModel = routingUpdate.preferredModel;
  }

  if (body.theme !== undefined) {
    update.theme = normalizeAppDataTheme(body.theme);
  }
  if (body.language !== undefined) {
    update.language = body.language;
  }

  if (body.brandSettings !== undefined) {
    const mergedBrandSettings = mergePersistedBrandSettings(
      existingRow.brandSettings,
      body.brandSettings,
    );
    if (!mergedBrandSettings) {
      return null;
    }
    update.brandSettings = mergedBrandSettings;
  }

  if (body.notifications !== undefined) {
    update.notifications = toNotificationRecord(
      mergeNotifications(existingRow.notifications, body.notifications),
    );
  }

  if (body.automationSettings !== undefined) {
    const mergedAutomationSettings = mergeAutomationSettings(
      existingRow.automationSettings,
      body.automationSettings,
    );
    if (!mergedAutomationSettings) {
      return null;
    }
    update.automationSettings = mergedAutomationSettings;
  }

  if (body.emailTransportSettings !== undefined) {
    const mergedEmailTransportSettings = mergeEmailTransportSettings(
      existingRow.emailTransportSettings,
      body.emailTransportSettings,
    );
    if (!mergedEmailTransportSettings) {
      return null;
    }
    update.emailTransportSettings = mergedEmailTransportSettings;
  }

  return update;
};

type ApiKeysUpdateBody = {
  geminiApiKey?: string;
  openaiApiKey?: string;
  claudeApiKey?: string;
  huggingfaceToken?: string;
  localModelEndpoint?: string;
  localModelName?: string;
  emailTransportPassword?: string;
};

const encryptOptionalSecret = (value: string | undefined): string | null | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return value.length > 0 ? encryptProviderKey(value) : null;
};

const assertEncryptionReadyForSecrets = (body: ApiKeysUpdateBody): void => {
  const secretWrites = [
    body.geminiApiKey,
    body.openaiApiKey,
    body.claudeApiKey,
    body.huggingfaceToken,
    body.emailTransportPassword,
  ].some((value) => typeof value === "string" && value.length > 0);

  if (secretWrites && !isEncryptionAvailable()) {
    throw new Error("BAO_ENCRYPTION_KEY must be set to encrypt provider keys");
  }
};

export const buildApiKeysUpdate = (body: ApiKeysUpdateBody): Partial<SettingsInsert> => {
  assertEncryptionReadyForSecrets(body);

  const update: Partial<SettingsInsert> = {};
  const geminiApiKey = encryptOptionalSecret(body.geminiApiKey);
  if (geminiApiKey !== undefined) {
    update.geminiApiKey = geminiApiKey;
  }
  const openaiApiKey = encryptOptionalSecret(body.openaiApiKey);
  if (openaiApiKey !== undefined) {
    update.openaiApiKey = openaiApiKey;
  }
  const claudeApiKey = encryptOptionalSecret(body.claudeApiKey);
  if (claudeApiKey !== undefined) {
    update.claudeApiKey = claudeApiKey;
  }
  const huggingfaceToken = encryptOptionalSecret(body.huggingfaceToken);
  if (huggingfaceToken !== undefined) {
    update.huggingfaceToken = huggingfaceToken;
  }
  if (body.localModelEndpoint !== undefined) {
    update.localModelEndpoint = normalizeLocalModelEndpoint(body.localModelEndpoint);
  }
  if (body.localModelName !== undefined) {
    update.localModelName = body.localModelName;
  }
  const emailTransportPassword = encryptOptionalSecret(body.emailTransportPassword);
  if (emailTransportPassword !== undefined) {
    update.emailTransportPassword = emailTransportPassword;
  }
  update.updatedAt = new Date().toISOString();
  return update;
};
