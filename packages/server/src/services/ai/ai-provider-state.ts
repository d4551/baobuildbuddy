import { AI_PROVIDER_DEFAULT_ORDER } from "@bao/shared/constants/ai-provider";
import type {
  AIProviderConfig,
  AIProviderType,
  AIRouting,
  AIRoutingPurpose,
  GenerateOptions,
} from "@bao/shared/types/ai";
import { createProvider } from "./ai-provider-config";
import type { AIProvider } from "./provider-interface";

const ensureHuggingFaceFallback = (providers: Map<AIProviderType, AIProvider>): void => {
  if (providers.has("huggingface")) {
    return;
  }

  const fallbackProvider = createProvider({
    provider: "huggingface",
    enabled: true,
  });
  if (fallbackProvider) {
    providers.set("huggingface", fallbackProvider);
  }
};

export const initializeProviders = (
  configs: AIProviderConfig[],
): Map<AIProviderType, AIProvider> => {
  const providers = new Map<AIProviderType, AIProvider>();

  for (const config of configs) {
    if (!config.enabled) {
      continue;
    }

    const provider = createProvider(config);
    if (provider) {
      providers.set(config.provider, provider);
    }
  }

  ensureHuggingFaceFallback(providers);
  return providers;
};

export const buildFallbackOrder = (
  configs: readonly AIProviderConfig[],
  preferredProvider?: AIProviderType,
): AIProviderType[] => {
  const enabledProviders: AIProviderType[] = Array.from(
    new Set(configs.filter((config) => config.enabled).map((config) => config.provider)),
  );

  const ordered: AIProviderType[] = [];
  const preferred =
    preferredProvider && enabledProviders.includes(preferredProvider)
      ? preferredProvider
      : undefined;

  if (preferred) {
    ordered.push(preferred);
  }

  for (const provider of AI_PROVIDER_DEFAULT_ORDER) {
    if (!ordered.includes(provider) && enabledProviders.includes(provider)) {
      ordered.push(provider);
    }
  }

  for (const provider of enabledProviders) {
    if (!ordered.includes(provider)) {
      ordered.push(provider);
    }
  }

  return ordered;
};

export const rebuildFallbackOrderFromProviders = (
  providers: ReadonlyMap<AIProviderType, AIProvider>,
  preferredProvider?: AIProviderType,
): AIProviderType[] => {
  const providerConfigs: AIProviderConfig[] = [];

  for (const provider of providers.keys()) {
    providerConfigs.push({ provider, enabled: true });
  }

  return buildFallbackOrder(providerConfigs, preferredProvider);
};

export const resolveRoutingTarget = (
  routing: AIRouting,
  preferredProvider: AIProviderType | undefined,
  options?: GenerateOptions,
): {
  purpose: AIRoutingPurpose;
  provider: AIProviderType;
  model?: string;
} => {
  const purpose = options?.purpose ?? "chat";
  const routedTarget = routing[purpose] ?? routing.chat;
  const provider =
    options?.provider ??
    routedTarget?.provider ??
    preferredProvider ??
    AI_PROVIDER_DEFAULT_ORDER[0];
  const model =
    typeof options?.model === "string" && options.model.trim().length > 0
      ? options.model.trim()
      : routedTarget?.model;

  return model ? { purpose, provider, model } : { purpose, provider };
};

export const buildProviderOrder = (
  fallbackOrder: readonly AIProviderType[],
  routing: AIRouting,
  preferredProvider: AIProviderType | undefined,
  options?: GenerateOptions,
): AIProviderType[] => {
  const preferredTarget = resolveRoutingTarget(routing, preferredProvider, options);
  const ordered: AIProviderType[] = [preferredTarget.provider];

  if (preferredProvider && !ordered.includes(preferredProvider)) {
    ordered.push(preferredProvider);
  }

  for (const provider of fallbackOrder) {
    if (!ordered.includes(provider)) {
      ordered.push(provider);
    }
  }

  return ordered;
};
