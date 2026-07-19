import { AI_PROVIDER_TEST_STRATEGY_BY_ID } from "@bao/shared/constants/ai-provider";
import { API_ERROR_UNKNOWN, API_ERROR_UNKNOWN_PROVIDER } from "@bao/shared/constants/api-errors";
import { normalizeAppDataTheme, resolveBrandSettings } from "@bao/shared/constants/branding";
import type { AIProviderType } from "@bao/shared/types/ai";
import {
  normalizeAutomationSettings,
  normalizeLocalModelEndpoint,
} from "@bao/shared/types/settings-normalization";
import { settle } from "@bao/shared/utils/promise";
import type { settings as settingsTable } from "../db/schema/settings";
import { buildAIControlPlaneState } from "../services/ai/control-plane";
import { LocalProvider } from "../services/ai/local-provider";
import { getJobTaxonomy } from "../services/jobs/job-taxonomy-service";
import { createServerLogger } from "../utils/logger";
import { validateLocalAiEndpoint } from "@bao/shared/utils/local-ai-endpoint";
import { decryptProviderKey, isEncryptionAvailable } from "../utils/crypto";

const settingsProviderLogger = createServerLogger("settings-provider-test");

const KEY_MASK_VISIBLE_CHARS = 4;

const maybeDecrypt = (value: string): string => {
  if (!value.startsWith("enc:")) return value;
  if (!isEncryptionAvailable()) return "";
  return decryptProviderKey(value);
};
type SettingsRow = typeof settingsTable.$inferSelect;

export const buildSettingsResponse = async (row: SettingsRow) => {
  const { emailTransportPassword, ...publicRow } = row;
  const [controlPlane, jobTaxonomy] = await Promise.all([
    buildAIControlPlaneState(row),
    getJobTaxonomy(),
  ]);
  const automationSettings = row.automationSettings
    ? normalizeAutomationSettings(row.automationSettings)
    : row.automationSettings;

  return {
    ...publicRow,
    automationSettings,
    localModelEndpoint: normalizeLocalModelEndpoint(row.localModelEndpoint),
    aiRouting: controlPlane.aiRouting,
    providerDiagnostics: controlPlane.providerDiagnostics,
    preferredProvider: controlPlane.preferredProvider,
    preferredModel: controlPlane.preferredModel,
    theme: normalizeAppDataTheme(row.theme),
    brandSettings: resolveBrandSettings(row.brandSettings),
    geminiApiKey: row.geminiApiKey
      ? `***${maybeDecrypt(row.geminiApiKey).slice(-KEY_MASK_VISIBLE_CHARS)}`
      : null,
    openaiApiKey: row.openaiApiKey
      ? `***${maybeDecrypt(row.openaiApiKey).slice(-KEY_MASK_VISIBLE_CHARS)}`
      : null,
    claudeApiKey: row.claudeApiKey
      ? `***${maybeDecrypt(row.claudeApiKey).slice(-KEY_MASK_VISIBLE_CHARS)}`
      : null,
    huggingfaceToken: row.huggingfaceToken
      ? `***${maybeDecrypt(row.huggingfaceToken).slice(-KEY_MASK_VISIBLE_CHARS)}`
      : null,
    hasGeminiKey: Boolean(row.geminiApiKey),
    hasOpenaiKey: Boolean(row.openaiApiKey),
    hasClaudeKey: Boolean(row.claudeApiKey),
    hasHuggingfaceToken: Boolean(row.huggingfaceToken),
    hasEmailTransportPassword: Boolean(emailTransportPassword),
    hasLocalKey: Boolean(row.localModelEndpoint),
    jobTaxonomy,
  };
};

const resolveProviderStrategy = (provider: AIProviderType) => {
  switch (provider) {
    case "gemini":
      return AI_PROVIDER_TEST_STRATEGY_BY_ID.gemini;
    case "openai":
      return AI_PROVIDER_TEST_STRATEGY_BY_ID.openai;
    case "claude":
      return AI_PROVIDER_TEST_STRATEGY_BY_ID.claude;
    case "huggingface":
      return AI_PROVIDER_TEST_STRATEGY_BY_ID.huggingface;
    default:
      return null;
  }
};

export const testProviderConnection = async (body: {
  provider: AIProviderType;
  key: string;
  model?: string;
}) => {
  if (body.provider === "local") {
    const validated = validateLocalAiEndpoint(body.key);
    if (!validated.ok) {
      return {
        valid: false,
        provider: body.provider,
        diagnosticCode: "error" as const,
        message: `Local AI endpoint rejected (${validated.code})`,
      };
    }
    const diagnostics = await LocalProvider.inspectEndpoint(validated.endpoint, body.model);
    return {
      valid: diagnostics.code === "healthy",
      provider: body.provider,
      diagnosticCode: diagnostics.code,
      message: diagnostics.message,
      availableModels: diagnostics.availableModels,
      selectedModel: diagnostics.selectedModel,
    };
  }

  const strategy = resolveProviderStrategy(body.provider);
  if (!strategy) {
    return {
      valid: false,
      provider: body.provider,
      error: API_ERROR_UNKNOWN_PROVIDER,
    };
  }

  const responseResult = await settle(
    fetch(strategy.buildUrl(body.key), strategy.buildInit(body.key)),
  );
  if (responseResult.status === "rejected") {
    settingsProviderLogger.error("Provider connection test failed", {
      provider: body.provider,
      reason:
        responseResult.reason instanceof Error ? responseResult.reason.message : API_ERROR_UNKNOWN,
    });
    return {
      valid: false,
      provider: body.provider,
      diagnosticCode: "error" as const,
      message: API_ERROR_UNKNOWN,
    };
  }

  const valid = strategy.isSuccess(responseResult.value.status);
  return {
    valid,
    provider: body.provider,
    diagnosticCode: valid ? ("healthy" as const) : ("error" as const),
    message: valid ? undefined : `HTTP ${responseResult.value.status}`,
  };
};
