import {
  AI_PROVIDER_CATALOG,
  AI_PROVIDER_DEFAULT,
  AI_PROVIDER_ID_LIST,
  normalizeAIRouting,
} from "@bao/shared/constants/ai-provider";
import { API_MESSAGE_AI_NO_PROVIDERS } from "@bao/shared/constants/api-messages";
import type { AIProviderDiagnostic, AIProviderStatus, AIProviderType } from "@bao/shared/types/ai";
import type { AIProviderDiagnostics } from "@bao/shared/types/settings-contracts";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { settle } from "@bao/shared/utils/promise";
import type { settings as settingsTable } from "../../db/schema/settings";
import { decryptProviderKeys } from "../../utils/settings-decrypt";
import { AIService } from "./ai-service";

type SettingsRow = typeof settingsTable.$inferSelect;

const resolveKnownProvider = (value?: string | null): (typeof AI_PROVIDER_ID_LIST)[number] =>
  AI_PROVIDER_ID_LIST.find((provider) => provider === value) ?? AI_PROVIDER_DEFAULT;

interface AIControlPlaneProviderRow {
  id: (typeof AI_PROVIDER_CATALOG)[number]["id"];
  nameKey: string;
  descriptionKey: string;
  iconId: (typeof AI_PROVIDER_CATALOG)[number]["iconId"];
  models: string[];
  available: boolean;
  health: "healthy" | "degraded" | "down" | "unconfigured";
  selectedModel?: string;
  diagnosticCode?: AIProviderStatus["diagnosticCode"];
  availableModels?: readonly string[];
  error?: string;
}

/**
 * Shared AI control-plane payload consumed by settings and provider-discovery routes.
 */
export interface AIControlPlaneState {
  aiRouting: ReturnType<typeof normalizeAIRouting>;
  configuredProviders: ReturnType<AIService["getConfiguredProviders"]>;
  error?: string;
  preferredModel: string | null;
  preferredProvider: SettingsRow["preferredProvider"];
  providerDiagnostics?: AIProviderDiagnostics;
  providers: AIControlPlaneProviderRow[];
}

const toProviderDiagnosticEntry = (status: AIProviderStatus): AIProviderDiagnostic => ({
  provider: status.provider,
  code: status.diagnosticCode ?? (status.available ? "healthy" : "error"),
  checkedAt: new Date(status.lastCheck ?? Date.now()).toISOString(),
  endpoint: status.endpoint,
  selectedModel: status.selectedModel,
  availableModels: status.availableModels,
  message: status.error,
});

const buildProviderDiagnostics = (providerStatuses: AIProviderStatus[]): AIProviderDiagnostics => {
  const statusByProvider = new Map(
    providerStatuses.map((status) => [status.provider, status] as const),
  );

  return Object.fromEntries(
    AI_PROVIDER_CATALOG.map((provider) => {
      const status = statusByProvider.get(provider.id);
      return [
        provider.id,
        status
          ? toProviderDiagnosticEntry(status)
          : {
              provider: provider.id,
              code: "unconfigured",
              checkedAt: new Date(0).toISOString(),
            },
      ];
    }),
  );
};

const hasConfiguredProvider = (row: SettingsRow, providerId: AIProviderType): boolean => {
  if (providerId === "local") {
    return typeof row.localModelEndpoint === "string" && row.localModelEndpoint.trim().length > 0;
  }
  if (providerId === "gemini") {
    return typeof row.geminiApiKey === "string" && row.geminiApiKey.trim().length > 0;
  }
  if (providerId === "openai") {
    return typeof row.openaiApiKey === "string" && row.openaiApiKey.trim().length > 0;
  }
  if (providerId === "claude") {
    return typeof row.claudeApiKey === "string" && row.claudeApiKey.trim().length > 0;
  }
  return typeof row.huggingfaceToken === "string" && row.huggingfaceToken.trim().length > 0;
};

const resolveFallbackSelectedModel = (
  row: SettingsRow,
  providerId: AIProviderType,
  aiRouting: ReturnType<typeof normalizeAIRouting>,
): string | undefined => {
  if (providerId === "local") {
    return row.localModelName ?? aiRouting.chat.model;
  }
  if (aiRouting.chat.provider === providerId) {
    return aiRouting.chat.model ?? row.preferredModel ?? undefined;
  }
};

const resolveFallbackModels = (
  row: SettingsRow,
  providerId: AIProviderType,
  aiRouting: ReturnType<typeof normalizeAIRouting>,
): string[] => {
  const catalogProvider = AI_PROVIDER_CATALOG.find((provider) => provider.id === providerId);
  const selectedModel = resolveFallbackSelectedModel(row, providerId, aiRouting);
  return selectedModel
    ? [
        selectedModel,
        ...(catalogProvider?.modelHints.filter((hint) => hint !== selectedModel) ?? []),
      ]
    : [...(catalogProvider?.modelHints ?? [])];
};

const buildFallbackProviderRows = (
  row: SettingsRow,
  aiRouting: ReturnType<typeof normalizeAIRouting>,
): AIControlPlaneProviderRow[] =>
  AI_PROVIDER_CATALOG.map((provider) => {
    const configured = hasConfiguredProvider(row, provider.id);
    const selectedModel = resolveFallbackSelectedModel(row, provider.id, aiRouting);

    return {
      id: provider.id,
      nameKey: provider.nameKey,
      descriptionKey: provider.descriptionKey,
      iconId: provider.iconId,
      models: resolveFallbackModels(row, provider.id, aiRouting),
      available: false,
      health: configured ? "degraded" : "unconfigured",
      selectedModel,
      ...(provider.id === "local" &&
      typeof row.localModelEndpoint === "string" &&
      row.localModelEndpoint.trim().length > 0
        ? {
            availableModels: [row.localModelName].filter((value): value is string =>
              Boolean(value),
            ),
          }
        : {}),
    };
  });

const buildFallbackProviderDiagnostics = (
  row: SettingsRow,
  aiRouting: ReturnType<typeof normalizeAIRouting>,
  error: string,
): AIProviderDiagnostics => {
  const checkedAt = new Date().toISOString();

  return Object.fromEntries(
    AI_PROVIDER_CATALOG.map((provider) => {
      const configured = hasConfiguredProvider(row, provider.id);
      const selectedModel = resolveFallbackSelectedModel(row, provider.id, aiRouting);
      const localEndpoint =
        provider.id === "local" &&
        typeof row.localModelEndpoint === "string" &&
        row.localModelEndpoint.trim().length > 0
          ? row.localModelEndpoint.trim()
          : undefined;

      return [
        provider.id,
        {
          provider: provider.id,
          code: configured ? "error" : "unconfigured",
          checkedAt,
          selectedModel,
          ...(localEndpoint ? { endpoint: localEndpoint } : {}),
          ...(configured ? { message: error } : {}),
        } satisfies AIProviderDiagnostic,
      ];
    }),
  );
};

const resolveConfiguredProvidersFromRow = (
  row: SettingsRow,
): ReturnType<AIService["getConfiguredProviders"]> =>
  AI_PROVIDER_CATALOG.filter((provider) => hasConfiguredProvider(row, provider.id)).map(
    (provider) => provider.id,
  );

const buildFallbackControlPlaneState = (row: SettingsRow, error: string): AIControlPlaneState => {
  const aiRouting = normalizeAIRouting(
    row.aiRouting,
    resolveKnownProvider(row.preferredProvider),
    row.preferredModel,
  );

  return {
    aiRouting,
    configuredProviders: resolveConfiguredProvidersFromRow(row),
    preferredProvider: aiRouting.chat.provider,
    preferredModel: aiRouting.chat.model ?? row.preferredModel,
    providers: buildFallbackProviderRows(row, aiRouting),
    providerDiagnostics: buildFallbackProviderDiagnostics(row, aiRouting, error),
    ...(error ? { error } : {}),
  };
};

const buildProviderRows = (
  providerStatuses: AIProviderStatus[],
  aiRouting: ReturnType<typeof normalizeAIRouting>,
): AIControlPlaneProviderRow[] => {
  const statusByProvider = new Map(
    providerStatuses.map((status) => [status.provider, status] as const),
  );

  return AI_PROVIDER_CATALOG.map((provider) => {
    const status = statusByProvider.get(provider.id);
    const selectedModel = status?.selectedModel ?? aiRouting.chat.model;
    const models = selectedModel
      ? [selectedModel, ...provider.modelHints.filter((hint) => hint !== selectedModel)]
      : [...provider.modelHints];

    return {
      id: provider.id,
      nameKey: provider.nameKey,
      descriptionKey: provider.descriptionKey,
      iconId: provider.iconId,
      models,
      available: status?.available ?? false,
      health: status?.health ?? "unconfigured",
      selectedModel,
      diagnosticCode: status?.diagnosticCode,
      availableModels: status?.availableModels,
      error: status?.error,
    };
  });
};

/**
 * Builds the canonical AI control-plane state from one persisted settings row.
 */
export async function buildAIControlPlaneState(settingsRow: SettingsRow): Promise<AIControlPlaneState> {
  const decryptedKeys = decryptProviderKeys(settingsRow);
  const row = { ...settingsRow, ...decryptedKeys };
  const aiRouting = normalizeAIRouting(
    row.aiRouting,
    resolveKnownProvider(row.preferredProvider),
    row.preferredModel,
  );
  const aiServiceResult = await settle(Promise.resolve(AIService.fromSettings(row)));
  if (aiServiceResult.status !== "fulfilled") {
    return buildFallbackControlPlaneState(
      row,
      toErrorMessage(aiServiceResult.reason, API_MESSAGE_AI_NO_PROVIDERS),
    );
  }

  const aiService = aiServiceResult.value;
  const providerStatusesResult = await settle(aiService.getAvailableProviders());
  if (providerStatusesResult.status !== "fulfilled") {
    return buildFallbackControlPlaneState(
      row,
      toErrorMessage(providerStatusesResult.reason, API_MESSAGE_AI_NO_PROVIDERS),
    );
  }

  const providerStatuses = providerStatusesResult.value;

  return {
    aiRouting,
    configuredProviders: aiService.getConfiguredProviders(),
    preferredProvider: aiRouting.chat.provider,
    preferredModel: aiRouting.chat.model ?? row.preferredModel,
    providerDiagnostics: buildProviderDiagnostics(providerStatuses),
    providers: buildProviderRows(providerStatuses, aiRouting),
  };
}
