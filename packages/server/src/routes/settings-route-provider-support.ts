import type { AIProviderType } from "@bao/shared";
import {
  AI_PROVIDER_TEST_STRATEGY_BY_ID,
  API_ERROR_UNKNOWN_PROVIDER,
  normalizeAppDataTheme,
  resolveBrandSettings,
  settle,
  toErrorMessage,
} from "@bao/shared";
import type { settings as settingsTable } from "../db/schema/settings";
import { buildAIControlPlaneState } from "../services/ai/control-plane";
import { LocalProvider } from "../services/ai/local-provider";

const KEY_MASK_VISIBLE_CHARS = 4;
type SettingsRow = typeof settingsTable.$inferSelect;

export const buildSettingsResponse = async (row: SettingsRow) => {
  const { emailTransportPassword, ...publicRow } = row;
  const controlPlane = await buildAIControlPlaneState(row);

  return {
    ...publicRow,
    aiRouting: controlPlane.aiRouting,
    providerDiagnostics: controlPlane.providerDiagnostics,
    preferredProvider: controlPlane.preferredProvider,
    preferredModel: controlPlane.preferredModel,
    theme: normalizeAppDataTheme(row.theme),
    brandSettings: resolveBrandSettings(row.brandSettings),
    geminiApiKey: row.geminiApiKey ? `***${row.geminiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
    openaiApiKey: row.openaiApiKey ? `***${row.openaiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
    claudeApiKey: row.claudeApiKey ? `***${row.claudeApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
    huggingfaceToken: row.huggingfaceToken
      ? `***${row.huggingfaceToken.slice(-KEY_MASK_VISIBLE_CHARS)}`
      : null,
    hasGeminiKey: Boolean(row.geminiApiKey),
    hasOpenaiKey: Boolean(row.openaiApiKey),
    hasClaudeKey: Boolean(row.claudeApiKey),
    hasHuggingfaceToken: Boolean(row.huggingfaceToken),
    hasEmailTransportPassword: Boolean(emailTransportPassword),
    hasLocalKey: Boolean(row.localModelEndpoint),
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
    const diagnostics = await LocalProvider.inspectEndpoint(body.key, body.model);
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

  const responseResult = await settle(fetch(strategy.buildUrl(body.key), strategy.buildInit(body.key)));
  if (responseResult.status === "rejected") {
    return {
      valid: false,
      provider: body.provider,
      diagnosticCode: "error" as const,
      message: toErrorMessage(responseResult.reason),
    };
  }

  const valid = strategy.isSuccess(responseResult.value.status);
  return {
    valid,
    provider: body.provider,
    diagnosticCode: valid ? "healthy" as const : "error" as const,
    message: valid ? undefined : `HTTP ${responseResult.value.status}`,
  };
};
