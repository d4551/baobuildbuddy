import {
  AI_PROVIDER_CATALOG,
  AI_PROVIDER_DEFAULT,
  AI_PROVIDER_DEFAULT_ORDER,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_RECOMMENDED_MODELS,
  type AIProviderMetadata,
  type AIProviderDiagnostic,
  type AIProviderDiagnostics,
  type AIProviderType,
  type AIRoutingPurpose,
} from "@bao/shared";

type AppSettingsSnapshot = {
  readonly preferredProvider?: string | null;
  readonly preferredModel?: string | null;
  readonly localModelName?: string | null;
  readonly localModelEndpoint?: string | null;
  readonly hasLocalKey?: boolean;
  readonly hasGeminiKey?: boolean;
  readonly hasOpenaiKey?: boolean;
  readonly hasClaudeKey?: boolean;
  readonly hasHuggingfaceToken?: boolean;
  readonly providerDiagnostics?: AIProviderDiagnostics | null;
  readonly aiRouting?: Partial<
    Record<
      AIRoutingPurpose,
      {
        readonly provider?: AIProviderType;
        readonly model?: string | null;
      }
    >
  > | null;
};

const providerCatalogById = new Map<AIProviderType, AIProviderMetadata>(
  AI_PROVIDER_CATALOG.map<[AIProviderType, AIProviderMetadata]>((provider) => [
    provider.id,
    provider,
  ]),
);

const isProviderId = (value: string): value is AIProviderType =>
  AI_PROVIDER_CATALOG.some((provider) => provider.id === value);

const resolveNonEmptyString = (value?: string | null): string => value?.trim() ?? "";

const uniqueNonEmptyStrings = (values: Iterable<string | null | undefined>): string[] => {
  const ordered = new Set<string>();
  for (const value of values) {
    const trimmed = resolveNonEmptyString(value);
    if (trimmed.length > 0) {
      ordered.add(trimmed);
    }
  }
  return [...ordered];
};

const resolvePreferredProviderId = (value?: string | null): AIProviderType => {
  const candidate = resolveNonEmptyString(value);
  return candidate && isProviderId(candidate) ? candidate : AI_PROVIDER_DEFAULT;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
  typeof value === "string" ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const providerHealthValues = new Set(["healthy", "degraded", "down", "unconfigured"]);

const isProviderHealth = (value: string): value is AIProviderHealth =>
  providerHealthValues.has(value);

const hasExplicitOverride = (value: string | null | undefined): boolean =>
  value !== undefined && value !== null;

const resolveLocalConfiguredModel = (
  settings: AppSettingsSnapshot | null | undefined,
  model?: string | null,
): string =>
  hasExplicitOverride(model)
    ? resolveNonEmptyString(model)
    : resolveNonEmptyString(settings?.localModelName);

const resolveLocalEndpoint = (
  settings: AppSettingsSnapshot | null | undefined,
  endpoint?: string | null,
): string =>
  hasExplicitOverride(endpoint)
    ? resolveNonEmptyString(endpoint) || LOCAL_AI_DEFAULT_ENDPOINT
    : resolveNonEmptyString(settings?.localModelEndpoint) || LOCAL_AI_DEFAULT_ENDPOINT;

const resolveLocalDiagnosticCode = (
  diagnostics: AIProviderDiagnostic | undefined,
  testResult?: ClientProviderTestResult | null,
): AIProviderDiagnostic["code"] | "unconfigured" => {
  if (testResult) {
    return testResult.valid ? "healthy" : (testResult.diagnosticCode ?? "error");
  }
  return diagnostics?.code ?? "unconfigured";
};

const resolveLocalAvailableModels = (
  diagnostics: AIProviderDiagnostic | undefined,
  testResult?: ClientProviderTestResult | null,
): string[] =>
  uniqueNonEmptyStrings([
    testResult?.selectedModel,
    ...(testResult?.availableModels ?? []),
    diagnostics?.selectedModel,
    ...(diagnostics?.availableModels ?? []),
    ...LOCAL_AI_RECOMMENDED_MODELS,
  ]);

const resolveLocalSelectedModel = (
  configuredModel: string,
  availableModels: readonly string[],
  diagnostics: AIProviderDiagnostic | undefined,
  testResult?: ClientProviderTestResult | null,
): string =>
  configuredModel ||
  resolveNonEmptyString(testResult?.selectedModel) ||
  resolveNonEmptyString(diagnostics?.selectedModel) ||
  availableModels[0] ||
  "";

/**
 * Client-facing provider test result fields returned by the settings test endpoint.
 */
export interface ClientProviderTestResult {
  valid: boolean;
  diagnosticCode?: AIProviderDiagnostic["code"];
  message?: string;
  availableModels?: string[];
  selectedModel?: string;
}

/**
 * Normalized provider/model pair resolved from persisted AI routing settings.
 */
export interface AIRoutingPreferenceState {
  provider: AIProviderType;
  model: string;
}

/**
 * Canonical local-provider readiness and model-selection state for client surfaces.
 */
export interface LocalProviderState {
  endpoint: string;
  configuredModel: string;
  selectedModel: string;
  availableModels: string[];
  diagnosticCode: AIProviderDiagnostic["code"] | "unconfigured";
  message?: string;
  isHealthy: boolean;
}

/**
 * Canonical client-side provider health values rendered across AI surfaces.
 */
export type AIProviderHealth = "healthy" | "degraded" | "down" | "unconfigured";

/**
 * Canonical normalized provider row returned to AI dashboard and settings surfaces.
 */
export interface AIProviderRow {
  id: AIProviderType;
  iconId: AIProviderType;
  models: string[];
  available: boolean;
  health: AIProviderHealth;
}

/**
 * Looks up the canonical provider catalog row.
 */
export function resolveProviderMetadata(
  providerId: AIProviderType,
): AIProviderMetadata | undefined {
  return providerCatalogById.get(providerId);
}

/**
 * Returns a stable provider-diagnostics map from persisted settings.
 */
export function resolveProviderDiagnostics(
  settings?: AppSettingsSnapshot | null,
): AIProviderDiagnostics {
  return settings?.providerDiagnostics ?? {};
}

/**
 * Resolves whether the given provider is configured from the canonical settings payload.
 */
export function isProviderConfigured(
  settings: AppSettingsSnapshot | null | undefined,
  providerId: AIProviderType,
): boolean {
  if (!settings) {
    return false;
  }

  if (providerId === "local") {
    return settings.hasLocalKey ?? resolveNonEmptyString(settings.localModelEndpoint).length > 0;
  }
  if (providerId === "gemini") {
    return Boolean(settings.hasGeminiKey);
  }
  if (providerId === "openai") {
    return Boolean(settings.hasOpenaiKey);
  }
  if (providerId === "claude") {
    return Boolean(settings.hasClaudeKey);
  }
  return Boolean(settings.hasHuggingfaceToken);
}

/**
 * Resolves the canonical provider/model selection for one AI routing purpose.
 */
export function resolveAIRoutingPreference(
  settings: AppSettingsSnapshot | null | undefined,
  purpose: AIRoutingPurpose = "chat",
): AIRoutingPreferenceState {
  const preferredProvider = resolvePreferredProviderId(settings?.preferredProvider);
  const routedTarget = settings?.aiRouting?.[purpose];
  const provider = resolvePreferredProviderId(routedTarget?.provider ?? preferredProvider);
  const model =
    resolveNonEmptyString(routedTarget?.model) ||
    (purpose === "chat" ? resolveNonEmptyString(settings?.preferredModel) : "");

  return {
    provider,
    model,
  };
}

/**
 * Builds the ordered model-option list for one provider from diagnostics, routing, and catalog hints.
 */
export function resolveProviderModelOptions(
  providerId: AIProviderType,
  settings: AppSettingsSnapshot | null | undefined,
  extraModels: readonly string[] = [],
): string[] {
  const diagnostics = resolveProviderDiagnostics(settings)[providerId];
  const chatRouting = resolveAIRoutingPreference(settings, "chat");
  const catalogEntry = providerCatalogById.get(providerId);

  return uniqueNonEmptyStrings([
    ...(chatRouting.provider === providerId ? [chatRouting.model] : []),
    ...(settings?.preferredProvider === providerId ? [settings?.preferredModel] : []),
    diagnostics?.selectedModel,
    ...(diagnostics?.availableModels ?? []),
    ...extraModels,
    ...(catalogEntry?.modelHints ?? []),
  ]);
}

/**
 * Resolves the currently selected model for a provider from the canonical routing contract.
 */
export function resolveProviderModelSelection(
  providerId: AIProviderType,
  settings: AppSettingsSnapshot | null | undefined,
  extraModels: readonly string[] = [],
): string {
  const chatRouting = resolveAIRoutingPreference(settings, "chat");
  if (chatRouting.provider === providerId && chatRouting.model.length > 0) {
    return chatRouting.model;
  }

  return resolveProviderModelOptions(providerId, settings, extraModels)[0] ?? "";
}

const normalizeProviderRow = (
  row: unknown,
  settings: AppSettingsSnapshot | null | undefined,
): AIProviderRow | null => {
  if (!isRecord(row)) {
    return null;
  }

  const rawId = asString(row.id);
  if (!(rawId && isProviderId(rawId))) {
    return null;
  }

  const catalogEntry = resolveProviderMetadata(rawId);
  if (!catalogEntry) {
    return null;
  }

  const available = asBoolean(row.available) ?? isProviderConfigured(settings, rawId);
  const rawHealth = asString(row.health);
  const health =
    rawHealth && isProviderHealth(rawHealth) ? rawHealth : available ? "healthy" : "unconfigured";
  const models = asStringArray(row.models);

  return {
    id: rawId,
    iconId: catalogEntry.iconId,
    models: models.length > 0 ? models : [...catalogEntry.modelHints],
    available,
    health,
  };
};

/**
 * Normalizes provider rows from the canonical shared AI models payload shape.
 */
export function normalizeProviderRows(
  value: unknown,
  settings: AppSettingsSnapshot | null | undefined,
): AIProviderRow[] {
  if (!isRecord(value)) {
    return [];
  }

  const rows = Array.isArray(value.providers) ? value.providers : [];
  return rows
    .map((row) => normalizeProviderRow(row, settings))
    .filter((provider): provider is AIProviderRow => provider !== null);
}

/**
 * Builds fallback provider rows when diagnostics are unavailable.
 */
export function buildFallbackProviderRows(
  settings: AppSettingsSnapshot | null | undefined,
): AIProviderRow[] {
  return AI_PROVIDER_DEFAULT_ORDER.map((providerId) => {
    const catalogEntry = resolveProviderMetadata(providerId);

    return {
      id: providerId,
      iconId: catalogEntry?.iconId ?? providerId,
      models: catalogEntry ? [...catalogEntry.modelHints] : [],
      available: isProviderConfigured(settings, providerId),
      health: isProviderConfigured(settings, providerId) ? "degraded" : "unconfigured",
    };
  });
}

/**
 * Resolves the local-provider endpoint, model, and diagnostics into one stable presentation state.
 */
export function resolveLocalProviderState(options: {
  settings?: AppSettingsSnapshot | null;
  endpoint?: string | null;
  model?: string | null;
  diagnostic?: AIProviderDiagnostic | null;
  testResult?: ClientProviderTestResult | null;
}): LocalProviderState {
  const diagnostics =
    options.diagnostic ?? resolveProviderDiagnostics(options.settings).local ?? undefined;
  const configuredModel = resolveLocalConfiguredModel(options.settings, options.model);
  const availableModels = resolveLocalAvailableModels(diagnostics, options.testResult);
  const selectedModel = resolveLocalSelectedModel(
    configuredModel,
    availableModels,
    diagnostics,
    options.testResult,
  );
  const diagnosticCode = resolveLocalDiagnosticCode(diagnostics, options.testResult);

  return {
    endpoint: resolveLocalEndpoint(options.settings, options.endpoint),
    configuredModel,
    selectedModel,
    availableModels,
    diagnosticCode,
    message: options.testResult?.message ?? diagnostics?.message,
    isHealthy: diagnosticCode === "healthy",
  };
}
