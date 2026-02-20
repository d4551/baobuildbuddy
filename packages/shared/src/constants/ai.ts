import type { AIChatContextDomain, AIProviderType } from "../types/ai";
import { AI_PROVIDER_IDS } from "../types/ai";
import { APP_ROUTES, APP_ROUTE_QUERY_KEYS } from "./routes";

const CLAUDE_TEST_MAX_TOKENS = 1;
const ANTHROPIC_API_VERSION = "2023-06-01";
const CLAUDE_TEST_MODEL = "claude-sonnet-4-5-20250929";

/**
 * Default local provider endpoints and model settings.
 */
export const LOCAL_AI_DEFAULT_ENDPOINT = "http://localhost:8080/v1";
export const OLLAMA_AI_DEFAULT_ENDPOINT = "http://localhost:11434/v1";
export const LOCAL_AI_DEFAULT_MODEL = "llama3.2";

export const LOCAL_AI_RECOMMENDED_MODELS = ["llama3.2", "granite-code", "mistral"] as const;

export type LocalModelName = (typeof LOCAL_AI_RECOMMENDED_MODELS)[number];

export type LocalProviderServer = {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
};

export const LOCAL_AI_SERVERS: readonly LocalProviderServer[] = [
  { id: "ramalama", name: "RamaLama", baseUrl: LOCAL_AI_DEFAULT_ENDPOINT },
  { id: "ollama", name: "Ollama", baseUrl: OLLAMA_AI_DEFAULT_ENDPOINT },
] as const;

export type AIProviderMetadata = {
  id: AIProviderType;
  name: string;
  description: string;
  icon: string;
  modelHints: readonly string[];
  requiresCredential: boolean;
};

export const AI_PROVIDER_CATALOG: readonly AIProviderMetadata[] = [
  {
    id: "local",
    name: "Local Model",
    description: "RamaLama / Ollama — private, local-first execution.",
    icon: "💻",
    modelHints: [...LOCAL_AI_RECOMMENDED_MODELS],
    requiresCredential: false,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Primary cloud provider for general QA and generation.",
    icon: "✨",
    modelHints: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
    requiresCredential: true,
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    description: "Strong reasoning and long-context analysis.",
    icon: "🧠",
    modelHints: ["claude-sonnet-4-5-20250929", "claude-3-5-sonnet-20241022", "claude-3-opus"],
    requiresCredential: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT model family for flexible responses.",
    icon: "🤖",
    modelHints: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    requiresCredential: true,
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    description: "Cloud fallback with a mostly free starter path.",
    icon: "🤗",
    modelHints: ["Qwen/Qwen2.5-Coder-32B-Instruct", "meta-llama/Llama-3.3-70B-Instruct"],
    requiresCredential: false,
  },
];

export const AI_PROVIDER_ID_LIST = AI_PROVIDER_IDS as readonly AIProviderType[];

export const AI_PROVIDER_TEST_STRATEGIES = {
  gemini: {
    provider: "gemini" as const,
    method: "GET" as const,
    buildUrl: (apiKey: string): string =>
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    buildInit: () => ({ method: "GET" as const }),
    isSuccess: (status: number) => status >= 200 && status < 300,
  },
  openai: {
    provider: "openai" as const,
    method: "GET" as const,
    buildUrl: (): string => "https://api.openai.com/v1/models",
    buildInit: (apiKey: string) => ({
      method: "GET" as const,
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    isSuccess: (status: number) => status >= 200 && status < 300,
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
    isSuccess: (status: number) => (status >= 200 && status < 300) || status === 429,
  },
  local: {
    provider: "local" as const,
    method: "GET" as const,
    buildUrl: (_: string, localEndpoint = LOCAL_AI_DEFAULT_ENDPOINT): string =>
      `${localEndpoint}/models`,
    buildInit: () => ({ method: "GET" as const }),
    isSuccess: (status: number) => status >= 200 && status < 300,
  },
  huggingface: {
    provider: "huggingface" as const,
    method: "GET" as const,
    buildUrl: (): string => "https://huggingface.co/api/whoami-v2",
    buildInit: (apiKey: string) => ({
      method: "GET" as const,
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    isSuccess: (status: number) => status >= 200 && status < 300,
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

export const AI_PROVIDER_LIST_FOR_FORMS = AI_PROVIDER_DEFAULT_ORDER as readonly AIProviderType[];

/**
 * Max number of historical chat messages included in AI prompt context.
 */
export const AI_CHAT_CONTEXT_MESSAGE_LIMIT = 12;

/**
 * Max number of stored chat messages loaded from persistence for context assembly.
 */
export const AI_CHAT_HISTORY_FETCH_LIMIT = 20;

/**
 * Canonical full-page AI chat route path.
 */
export const AI_CHAT_PAGE_PATH = APP_ROUTES.aiChat;

/**
 * Canonical API endpoint for chat completion requests.
 */
export const AI_CHAT_API_ENDPOINT = "/api/ai/chat";

/**
 * Canonical query keys consumed when inferring AI chat entity context.
 */
export const AI_CHAT_ROUTE_QUERY_KEYS = {
  id: APP_ROUTE_QUERY_KEYS.id,
  jobId: APP_ROUTE_QUERY_KEYS.jobId,
  resumeId: APP_ROUTE_QUERY_KEYS.resumeId,
  studioId: APP_ROUTE_QUERY_KEYS.studioId,
} as const;

/**
 * Canonical route path prefixes used for AI chat entity inference.
 */
export const AI_CHAT_ENTITY_ROUTE_PATHS = {
  jobs: APP_ROUTES.jobs,
  resume: APP_ROUTES.resume,
  studios: APP_ROUTES.studios,
  interview: APP_ROUTES.interview,
  interviewSession: APP_ROUTES.interviewSession,
  automationRuns: APP_ROUTES.automationRuns,
} as const;

/**
 * Route-prefix mapping used to infer chat domain from current page.
 */
export const AI_CHAT_ROUTE_DOMAIN_RULES: ReadonlyArray<{
  readonly prefix: string;
  readonly domain: AIChatContextDomain;
}> = [
  { prefix: APP_ROUTES.resume, domain: "resume" },
  { prefix: APP_ROUTES.jobs, domain: "job_search" },
  { prefix: APP_ROUTES.interview, domain: "interview" },
  { prefix: APP_ROUTES.portfolio, domain: "portfolio" },
  { prefix: APP_ROUTES.skills, domain: "skills" },
  { prefix: APP_ROUTES.automation, domain: "automation" },
];

/**
 * Fallback AI chat domain when no route rule matches.
 */
export const AI_CHAT_DEFAULT_DOMAIN: AIChatContextDomain = "general";

/**
 * Infers AI chat domain from route path.
 *
 * @param path Route path.
 * @returns Matching domain or `general`.
 */
export function inferAIChatDomainFromRoutePath(path: string): AIChatContextDomain {
  const matchedRule = AI_CHAT_ROUTE_DOMAIN_RULES.find((rule) => path.startsWith(rule.prefix));
  return matchedRule?.domain ?? AI_CHAT_DEFAULT_DOMAIN;
}
