import type { AIProviderType, AIRouting, AIRoutingPurpose, AIRoutingTarget } from "../types/ai";
import { AI_PROVIDER_IDS, AI_ROUTING_PURPOSE_IDS } from "../types/ai";
import {
  HTTP_STATUS_MULTIPLE_CHOICES,
  HTTP_STATUS_OK,
  HTTP_STATUS_TOO_MANY_REQUESTS,
} from "./http";

const isHttpSuccessStatus = (status: number): boolean =>
  status >= HTTP_STATUS_OK && status < HTTP_STATUS_MULTIPLE_CHOICES;

const CLAUDE_TEST_MAX_TOKENS = 1;
const CLAUDE_TEST_MODEL = "claude-sonnet-5";
const ANTHROPIC_API_VERSION = "2023-06-01";

/**
 * Claude model-id prefixes whose Messages API dropped the sampling parameters.
 *
 * Anthropic removed `temperature` / `top_p` / `top_k` from Claude Opus 4.7 onward
 * (Opus 4.7/4.8/5, Sonnet 5, Fable 5, Mythos 5). Sending any of them to one of
 * these models is a `400 invalid_request_error`, so a caller that always supplies
 * a default temperature cannot talk to the current model family at all — the
 * parameter has to be omitted, not defaulted. Older Claude models still accept it.
 */
const CLAUDE_MODEL_PREFIXES_WITHOUT_SAMPLING_PARAMETERS = [
  "claude-fable-5",
  "claude-mythos-5",
  "claude-mythos-preview",
  "claude-opus-5",
  "claude-opus-4-8",
  "claude-opus-4-7",
  "claude-sonnet-5",
] as const;

/**
 * True when the Claude model still accepts `temperature` (and the other sampling
 * parameters). Callers must omit the parameter entirely when this returns false.
 */
export const claudeModelAcceptsSamplingParameters = (model: string): boolean => {
  const normalized = model.trim().toLowerCase();
  return !CLAUDE_MODEL_PREFIXES_WITHOUT_SAMPLING_PARAMETERS.some((prefix) =>
    normalized.startsWith(prefix),
  );
};

export { AI_ROUTING_PURPOSE_IDS };

/**
 * Default local provider endpoints and model settings.
 * Single source for Ollama/RamaLama-compatible local inference base URL.
 */
export const LOCAL_AI_DEFAULT_ENDPOINT = "http://localhost:11434/v1";
export const LOCAL_AI_DEFAULT_MODEL = "";
export const LOCAL_AI_AUTO_DETECT_MODEL = "auto-detect";

/**
 * Canonical Ollama product URL used when guiding users through vendor-owned local model setup.
 */
export const OLLAMA_WEBSITE_URL = "https://ollama.com";

export const LOCAL_AI_RECOMMENDED_MODELS = ["llama3.2", "granite-code", "mistral"] as const;

export type LocalModelName = (typeof LOCAL_AI_RECOMMENDED_MODELS)[number];

export type LocalProviderServer = {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
};

export const LOCAL_AI_SERVERS: readonly LocalProviderServer[] = [
  { id: "ramalama", name: "RamaLama", baseUrl: LOCAL_AI_DEFAULT_ENDPOINT },
  { id: "ollama", name: "Ollama", baseUrl: LOCAL_AI_DEFAULT_ENDPOINT },
] as const;

export const HUGGING_FACE_SUPPORTED_MODELS = [
  "Qwen/Qwen2.5-7B-Instruct",
  "mistralai/Mistral-7B-Instruct-v0.3",
  "HuggingFaceTB/SmolLM3-3B",
] as const;
export const HUGGING_FACE_DEFAULT_MODEL = HUGGING_FACE_SUPPORTED_MODELS[0];

export type AIProviderMetadata = {
  id: AIProviderType;
  nameKey: string;
  descriptionKey: string;
  iconId: AIProviderType;
  modelHints: readonly string[];
  requiresCredential: boolean;
};

export const AI_PROVIDER_CATALOG: readonly AIProviderMetadata[] = [
  {
    id: "local",
    nameKey: "aiProviderCatalog.local.name",
    descriptionKey: "aiProviderCatalog.local.description",
    iconId: "local",
    modelHints: [...LOCAL_AI_RECOMMENDED_MODELS],
    requiresCredential: false,
  },
  {
    id: "gemini",
    nameKey: "aiProviderCatalog.gemini.name",
    descriptionKey: "aiProviderCatalog.gemini.description",
    iconId: "gemini",
    modelHints: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
    requiresCredential: true,
  },
  {
    id: "claude",
    nameKey: "aiProviderCatalog.claude.name",
    descriptionKey: "aiProviderCatalog.claude.description",
    iconId: "claude",
    modelHints: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"],
    requiresCredential: true,
  },
  {
    id: "openai",
    nameKey: "aiProviderCatalog.openai.name",
    descriptionKey: "aiProviderCatalog.openai.description",
    iconId: "openai",
    modelHints: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    requiresCredential: true,
  },
  {
    id: "huggingface",
    nameKey: "aiProviderCatalog.huggingface.name",
    descriptionKey: "aiProviderCatalog.huggingface.description",
    iconId: "huggingface",
    modelHints: [...HUGGING_FACE_SUPPORTED_MODELS],
    requiresCredential: false,
  },
] as const;

export const AI_PROVIDER_ID_LIST = AI_PROVIDER_IDS as readonly AIProviderType[];

export const AI_PROVIDER_TEST_STRATEGIES = {
  gemini: {
    provider: "gemini" as const,
    method: "GET" as const,
    buildUrl: (apiKey: string): string =>
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    buildInit: () => ({ method: "GET" as const }),
    isSuccess: isHttpSuccessStatus,
  },
  openai: {
    provider: "openai" as const,
    method: "GET" as const,
    buildUrl: (): string => "https://api.openai.com/v1/models",
    buildInit: (apiKey: string) => ({
      method: "GET" as const,
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    isSuccess: isHttpSuccessStatus,
  },
  claude: {
    provider: "claude" as const,
    method: "POST" as const,
    buildUrl: (): string => "https://api.anthropic.com/v1/messages",
    buildInit: (apiKey: string) => ({
      method: "POST" as const,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_API_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_TEST_MODEL,
        max_tokens: CLAUDE_TEST_MAX_TOKENS,
        messages: [{ role: "user", content: "hi" }],
      }),
    }),
    isSuccess: (status: number) =>
      isHttpSuccessStatus(status) || status === HTTP_STATUS_TOO_MANY_REQUESTS,
  },
  local: {
    provider: "local" as const,
    method: "GET" as const,
    buildUrl: (_: string, localEndpoint = LOCAL_AI_DEFAULT_ENDPOINT): string =>
      `${localEndpoint}/models`,
    buildInit: () => ({ method: "GET" as const }),
    isSuccess: isHttpSuccessStatus,
  },
  huggingface: {
    provider: "huggingface" as const,
    method: "GET" as const,
    buildUrl: (): string => "https://huggingface.co/api/whoami-v2",
    buildInit: (apiKey: string) => ({
      method: "GET" as const,
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    isSuccess: isHttpSuccessStatus,
  },
} satisfies Record<
  AIProviderType,
  {
    provider: AIProviderType;
    method: "GET" | "POST";
    buildUrl: (apiKey: string, localEndpoint?: string) => string;
    buildInit: (apiKey: string, localEndpoint?: string) => RequestInit;
    isSuccess: (status: number) => boolean;
  }
>;

export const AI_PROVIDER_TEST_STRATEGY_BY_ID = AI_PROVIDER_TEST_STRATEGIES;

export const AI_PROVIDER_DEFAULT_ORDER: readonly AIProviderType[] = [
  ...AI_PROVIDER_ID_LIST.filter((provider) => provider === "local"),
  ...AI_PROVIDER_ID_LIST.filter((provider) => provider !== "local"),
];

export const AI_PROVIDER_DEFAULT: AIProviderType =
  AI_PROVIDER_DEFAULT_ORDER[0] ?? AI_PROVIDER_IDS[0];

export const AI_PROVIDER_LIST_FOR_FORMS = AI_PROVIDER_DEFAULT_ORDER;

/**
 * Default routing target derived from the default provider order.
 */
export const AI_ROUTING_DEFAULT_TARGET: AIRoutingTarget = {
  provider: AI_PROVIDER_DEFAULT,
};

/**
 * Default purpose-aware AI routing table.
 */
const buildDefaultRouting = (): AIRouting =>
  Object.fromEntries(
    AI_ROUTING_PURPOSE_IDS.map((purpose) => [purpose, { ...AI_ROUTING_DEFAULT_TARGET }]),
  ) as AIRouting;

export const DEFAULT_AI_ROUTING: AIRouting = Object.freeze(buildDefaultRouting());

/**
 * Normalizes a partial routing payload into the full canonical routing table.
 */
export function normalizeAIRouting(
  routing?: Partial<Record<AIRoutingPurpose, Partial<AIRoutingTarget> | undefined>> | null,
  fallbackProvider: AIProviderType = AI_PROVIDER_DEFAULT,
  fallbackModel?: string | null,
): AIRouting {
  const entries = AI_ROUTING_PURPOSE_IDS.map((purpose) => {
    const configuredTarget = routing?.[purpose];
    const configuredProvider = configuredTarget?.provider;
    const provider = AI_PROVIDER_ID_LIST.includes(configuredProvider ?? fallbackProvider)
      ? (configuredProvider ?? fallbackProvider)
      : fallbackProvider;
    let model: string | undefined;
    if (typeof configuredTarget?.model === "string" && configuredTarget.model.trim().length > 0) {
      model = configuredTarget.model.trim();
    } else if (typeof fallbackModel === "string" && fallbackModel.trim().length > 0) {
      model = fallbackModel.trim();
    }
    return [purpose, model ? { provider, model } : { provider }] as const;
  });
  return Object.fromEntries(entries) as AIRouting;
}
