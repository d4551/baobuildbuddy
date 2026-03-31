import {
  AI_PROVIDER_DEFAULT_ORDER,
  LOCAL_AI_AUTO_DETECT_MODEL,
  normalizeAIRouting,
} from "@bao/shared/constants/ai-provider";
import type { AIProviderConfig, AIProviderType, AIRouting } from "@bao/shared/types/ai";
import { normalizeLocalModelEndpoint } from "@bao/shared/types/settings-normalization";
import {
  DeterministicTestProvider,
  TEST_AI_MODEL_NAME,
  TEST_AI_PROVIDER_NAME,
} from "./ai-deterministic-provider";
import { ClaudeProvider } from "./claude-provider";
import { GeminiProvider } from "./gemini-provider";
import { HuggingFaceProvider } from "./huggingface-provider";
import { LocalProvider } from "./local-provider";
import { OpenAIProvider } from "./openai-provider";
import type { AIProvider } from "./provider-interface";

export type AIServiceSettings = {
  geminiApiKey?: string | null;
  claudeApiKey?: string | null;
  openaiApiKey?: string | null;
  huggingfaceToken?: string | null;
  localModelEndpoint?: string | null;
  localModelName?: string | null;
  aiRouting?: AIRouting | null;
  preferredProvider?: string | null;
  preferredModel?: string | null;
};

export const appendOptionalProviderConfig = (
  configs: AIProviderConfig[],
  provider: Exclude<AIProviderType, "local" | "huggingface">,
  apiKey?: string | null,
): void => {
  if (!apiKey) {
    return;
  }

  configs.push({
    provider,
    apiKey,
    enabled: true,
  });
};

export const buildProviderConfigs = (settings?: AIServiceSettings): AIProviderConfig[] => {
  const localModelEndpoint = normalizeLocalModelEndpoint(settings?.localModelEndpoint);
  const localModelName =
    typeof settings?.localModelName === "string" && settings.localModelName.trim()
      ? settings.localModelName.trim()
      : null;

  const configs: AIProviderConfig[] = [
    {
      provider: "local",
      enabled: true,
      ...(localModelEndpoint ? { baseUrl: localModelEndpoint } : {}),
      ...(localModelName ? { model: localModelName } : {}),
    },
  ];

  appendOptionalProviderConfig(configs, "gemini", settings?.geminiApiKey);
  appendOptionalProviderConfig(configs, "claude", settings?.claudeApiKey);
  appendOptionalProviderConfig(configs, "openai", settings?.openaiApiKey);
  configs.push({
    provider: "huggingface",
    enabled: true,
    ...(settings?.huggingfaceToken ? { apiKey: settings.huggingfaceToken } : {}),
  });

  return configs;
};

export const resolvePreferredProvider = (preferredProvider?: string | null): AIProviderType => {
  if (!preferredProvider) {
    return AI_PROVIDER_DEFAULT_ORDER[0];
  }

  const matchedProvider = AI_PROVIDER_DEFAULT_ORDER.find(
    (provider) => provider === preferredProvider,
  );
  return matchedProvider ?? AI_PROVIDER_DEFAULT_ORDER[0];
};

export const canCreateLocalProvider = (config: AIProviderConfig): boolean =>
  config.provider === "local" &&
  typeof config.baseUrl === "string" &&
  config.baseUrl.trim().length > 0 &&
  URL.canParse(config.baseUrl);

export const createProvider = (config: AIProviderConfig): AIProvider | null => {
  switch (config.provider) {
    case "gemini":
      return config.apiKey ? new GeminiProvider(config.apiKey, config.model) : null;
    case "claude":
      return config.apiKey ? new ClaudeProvider(config.apiKey, config.model) : null;
    case "openai":
      return config.apiKey ? new OpenAIProvider(config.apiKey, config.model) : null;
    case "huggingface":
      return new HuggingFaceProvider(config.apiKey, config.model);
    case "local":
      if (!canCreateLocalProvider(config)) {
        return null;
      }
      return new LocalProvider(config.baseUrl, config.model || LOCAL_AI_AUTO_DETECT_MODEL);
    default:
      return null;
  }
};

export const createDeterministicServiceState = () => ({
  fallbackOrder: [TEST_AI_PROVIDER_NAME] as AIProviderType[],
  preferredProvider: TEST_AI_PROVIDER_NAME,
  providers: new Map<AIProviderType, AIProvider>([
    [TEST_AI_PROVIDER_NAME, new DeterministicTestProvider()],
  ]),
  routing: normalizeAIRouting(undefined, TEST_AI_PROVIDER_NAME, TEST_AI_MODEL_NAME),
});
