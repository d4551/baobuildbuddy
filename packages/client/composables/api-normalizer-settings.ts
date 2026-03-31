import { normalizeAIRouting } from "@bao/shared/constants/ai-provider";
import { normalizeAppDataTheme, resolveBrandSettings } from "@bao/shared/constants/branding";
import { DEFAULT_JOB_TAXONOMY_SETTINGS } from "@bao/shared/constants/jobs-taxonomy";
import { APP_LANGUAGE_CODES, DEFAULT_APP_LANGUAGE } from "@bao/shared/constants/settings";
import type { JobTaxonomySettings } from "@bao/shared/types/jobs-taxonomy";
import type { AppSettings, EmailTransportSettings } from "@bao/shared/types/settings-contracts";
import { DEFAULT_APP_AI_ROUTING, DEFAULT_EMAIL_TRANSPORT_SETTINGS } from "@bao/shared/types/settings-defaults";
import { asBoolean, asNumber, asRecord, asString, asStringArray, isRecord } from "@bao/shared/utils/type-guards";
import { normalizeLocalModelEndpoint } from "@bao/shared/types/settings-normalization";
import {
  asEnum,
  isProviderId,
  normalizeAIProvider,
  normalizeProviderDiagnosticCode,
} from "~/composables/api-normalizer-shared";
import {
  JOB_TAXONOMY_CATEGORIES,
  JOB_TAXONOMY_STUDIO_TYPES,
} from "~/composables/api-normalizer-settings-constants";
import { normalizeAutomationSettings } from "~/composables/api-normalizer-settings-automation";

const normalizeAIRoutingValue = (
  value: unknown,
  preferredProvider: ReturnType<typeof normalizeAIProvider>,
) => {
  if (!isRecord(value)) return normalizeAIRouting(DEFAULT_APP_AI_ROUTING, preferredProvider);
  return normalizeAIRouting(
    Object.fromEntries(
      Object.entries(value).flatMap(([purpose, target]) =>
        !isRecord(target)
          ? []
          : [
              [
                purpose,
                { provider: normalizeAIProvider(target.provider), model: asString(target.model) },
              ],
            ],
      ),
    ),
    preferredProvider,
  );
};

const normalizeProviderDiagnostics = (value: unknown) => {
  if (!isRecord(value)) return;
  return Object.fromEntries(
    Object.entries(value).flatMap(([providerId, entry]) =>
      !(isProviderId(providerId) && isRecord(entry))
        ? []
        : [
            [
              providerId,
              {
                provider: normalizeAIProvider(entry.provider ?? providerId),
                code: normalizeProviderDiagnosticCode(entry.code),
                checkedAt: asString(entry.checkedAt) ?? new Date(0).toISOString(),
                endpoint: asString(entry.endpoint),
                selectedModel: asString(entry.selectedModel),
                availableModels: asStringArray(entry.availableModels),
                message: asString(entry.message),
              },
            ],
          ],
    ),
  );
};

const normalizeEmailTransportSettings = (value: unknown): EmailTransportSettings | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const security =
    value.security === "tls" || value.security === "plain" ? value.security : "starttls";
  const authMethod = value.authMethod === "login" ? "login" : "plain";

  return {
    host: asString(value.host) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.host,
    port: asNumber(value.port) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.port,
    security,
    username: asString(value.username) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.username,
    fromEmail: asString(value.fromEmail) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromEmail,
    fromName: asString(value.fromName) ?? DEFAULT_EMAIL_TRANSPORT_SETTINGS.fromName,
    authMethod,
    connectionTimeoutSeconds:
      asNumber(value.connectionTimeoutSeconds) ??
      DEFAULT_EMAIL_TRANSPORT_SETTINGS.connectionTimeoutSeconds,
  };
};

const normalizeJobTaxonomySettings = (value: unknown): JobTaxonomySettings | undefined => {
  if (!isRecord(value)) return;
  const keywords = Array.isArray(value.keywords)
    ? value.keywords.filter(isRecord).map((entry, index) => ({
        id: asString(entry.id) ?? `keyword-${index}`,
        category: asEnum(entry.category, JOB_TAXONOMY_CATEGORIES) ?? "technology",
        label: asString(entry.label) ?? "",
        synonyms: asStringArray(entry.synonyms),
        sortOrder: asNumber(entry.sortOrder) ?? index,
        enabled: asBoolean(entry.enabled) ?? true,
      }))
    : DEFAULT_JOB_TAXONOMY_SETTINGS.keywords;
  const studioRules = Array.isArray(value.studioRules)
    ? value.studioRules.filter(isRecord).map((entry, index) => ({
        id: asString(entry.id) ?? `studio-rule-${index}`,
        studioType: asEnum(entry.studioType, JOB_TAXONOMY_STUDIO_TYPES) ?? "Indie",
        keyword: asString(entry.keyword) ?? "",
        sortOrder: asNumber(entry.sortOrder) ?? index,
        enabled: asBoolean(entry.enabled) ?? true,
      }))
    : DEFAULT_JOB_TAXONOMY_SETTINGS.studioRules;
  return { keywords, studioRules };
};

export const toAppSettings = (value: unknown): AppSettings | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (!id) return null;

  const notificationsRecord = asRecord(value.notifications) ?? {};
  const preferredProvider = normalizeAIProvider(value.preferredProvider);
  return {
    id,
    geminiApiKey: asString(value.geminiApiKey),
    openaiApiKey: asString(value.openaiApiKey),
    claudeApiKey: asString(value.claudeApiKey),
    huggingfaceToken: asString(value.huggingfaceToken),
    localModelEndpoint:
      normalizeLocalModelEndpoint(asString(value.localModelEndpoint)) ?? undefined,
    localModelName: asString(value.localModelName),
    aiRouting: normalizeAIRoutingValue(value.aiRouting, preferredProvider),
    providerDiagnostics: normalizeProviderDiagnostics(value.providerDiagnostics),
    preferredModel: asString(value.preferredModel),
    preferredProvider,
    theme: normalizeAppDataTheme(asString(value.theme)),
    language: asEnum(value.language, APP_LANGUAGE_CODES) ?? DEFAULT_APP_LANGUAGE,
    brandSettings: resolveBrandSettings(isRecord(value.brandSettings) ? value.brandSettings : null),
    notifications: {
      achievements: asBoolean(notificationsRecord.achievements) ?? true,
      dailyChallenges: asBoolean(notificationsRecord.dailyChallenges) ?? true,
      levelUp: asBoolean(notificationsRecord.levelUp) ?? true,
      jobAlerts: asBoolean(notificationsRecord.jobAlerts) ?? true,
    },
    automationSettings: normalizeAutomationSettings(value.automationSettings),
    jobTaxonomy: normalizeJobTaxonomySettings(value.jobTaxonomy),
    emailTransportSettings: normalizeEmailTransportSettings(value.emailTransportSettings),
    hasGeminiKey: asBoolean(value.hasGeminiKey),
    hasOpenaiKey: asBoolean(value.hasOpenaiKey),
    hasClaudeKey: asBoolean(value.hasClaudeKey),
    hasHuggingfaceToken: asBoolean(value.hasHuggingfaceToken),
    hasEmailTransportPassword: asBoolean(value.hasEmailTransportPassword),
    hasLocalKey: asBoolean(value.hasLocalKey),
  };
};
