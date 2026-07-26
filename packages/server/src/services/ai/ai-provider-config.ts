import {
  AI_PROVIDER_DEFAULT_ORDER,
  HUGGING_FACE_DEFAULT_MODEL,
  LOCAL_AI_AUTO_DETECT_MODEL,
  LOCAL_AI_DEFAULT_ENDPOINT,
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
      // Always carry an endpoint. `canCreateLocalProvider` requires a parseable
      // `baseUrl`, so omitting it when settings held none meant the local provider was
      // never registered — despite `LocalProvider` defaulting to this very endpoint.
      // Out of the box that made every AI feature fail with "All providers failed to
      // generate" and degraded the OpenAI-compatible `/v1/models` list to static hints.
      baseUrl: localModelEndpoint ?? LOCAL_AI_DEFAULT_ENDPOINT,
      ...(localModelName ? { model: localModelName } : {}),
    },
  ];

  appendOptionalProviderConfig(configs, "gemini", settings?.geminiApiKey);
  appendOptionalProviderConfig(configs, "claude", settings?.claudeApiKey);
  appendOptionalProviderConfig(configs, "openai", settings?.openaiApiKey);
  if (
    typeof settings?.huggingfaceToken === "string" &&
    settings.huggingfaceToken.trim().length > 0
  ) {
    configs.push({
      provider: "huggingface",
      enabled: true,
      apiKey: settings.huggingfaceToken.trim(),
      model: HUGGING_FACE_DEFAULT_MODEL,
    });
  }

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

export const isConfiguredProviderConfig = (config: AIProviderConfig): boolean => {
  if (config.provider === "local") {
    return canCreateLocalProvider(config);
  }

  return typeof config.apiKey === "string" && config.apiKey.trim().length > 0;
};

export const createProvider = (config: AIProviderConfig): AIProvider | null => {
  switch (config.provider) {
    case "gemini":
      return config.apiKey ? new GeminiProvider(config.apiKey, config.model) : null;
    case "claude":
      return config.apiKey ? new ClaudeProvider(config.apiKey, config.model) : null;
    case "openai":
      return config.apiKey ? new OpenAIProvider(config.apiKey, config.model) : null;
    case "huggingface":
      return config.apiKey ? new HuggingFaceProvider(config.apiKey, config.model) : null;
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
  providerFailoverOrder: [TEST_AI_PROVIDER_NAME] as const satisfies AIProviderType[],
  preferredProvider: TEST_AI_PROVIDER_NAME,
  providers: new Map<AIProviderType, AIProvider>([
    [TEST_AI_PROVIDER_NAME, new DeterministicTestProvider()],
  ]),
  routing: normalizeAIRouting(undefined, TEST_AI_PROVIDER_NAME, TEST_AI_MODEL_NAME),
});
