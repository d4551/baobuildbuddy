import type { AIChatContextDomain, AIProviderType } from "../types/ai";
import { AI_PROVIDER_IDS } from "../types/ai";
import { API_ENDPOINTS } from "./endpoints";
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
export const AI_CHAT_API_ENDPOINT = API_ENDPOINTS.aiChat;

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
 * i18n translation keys for floating chat domain badges by contextual domain.
 */
export const AI_CHAT_FLOATING_CONTEXT_DOMAIN_LABEL_KEYS: Readonly<
  Record<AIChatContextDomain, string>
> = {
  resume: "floatingChat.contextDomain.resume",
  job_search: "floatingChat.contextDomain.jobSearch",
  interview: "floatingChat.contextDomain.interview",
  portfolio: "floatingChat.contextDomain.portfolio",
  skills: "floatingChat.contextDomain.skills",
  automation: "floatingChat.contextDomain.automation",
  general: "floatingChat.contextDomain.general",
};

/**
 * i18n translation keys for floating chat suggested prompts by contextual domain.
 */
export const AI_CHAT_FLOATING_CONTEXT_PROMPT_KEYS: Readonly<Record<AIChatContextDomain, string>> = {
  resume: "floatingChat.prompts.resume",
  job_search: "floatingChat.prompts.jobSearch",
  interview: "floatingChat.prompts.interview",
  portfolio: "floatingChat.prompts.portfolio",
  skills: "floatingChat.prompts.skills",
  automation: "floatingChat.prompts.automation",
  general: "floatingChat.prompts.general",
};

/**
 * i18n translation key for focused-entity prompt suggestion in floating chat.
 */
export const AI_CHAT_FLOATING_FOCUSED_ENTITY_PROMPT_KEY = "floatingChat.prompts.focusedEntity";

/**
 * Default BCP 47 locale used by browser voice APIs when no UI locale is provided.
 */
export const AI_CHAT_VOICE_DEFAULT_LOCALE = "en-US";

/**
 * Default auto-read preference for assistant replies in chat surfaces.
 */
export const AI_CHAT_VOICE_AUTO_SPEAK_DEFAULT = false;

/**
 * Persisted voice identifier used for AI chat text-to-speech playback.
 * Empty string keeps browser/system default voice selection.
 */
export const AI_CHAT_VOICE_DEFAULT_ID = "";

/**
 * Canonical voice error codes surfaced to chat UI and i18n layers.
 */
export const AI_CHAT_VOICE_ERROR_CODES = {
  unsupportedRecognition: "unsupportedRecognition",
  unsupportedSynthesis: "unsupportedSynthesis",
  startFailed: "startFailed",
  noSpeech: "noSpeech",
  aborted: "aborted",
  audioCapture: "audioCapture",
  network: "network",
  notAllowed: "notAllowed",
  serviceNotAllowed: "serviceNotAllowed",
  badGrammar: "badGrammar",
  languageNotSupported: "languageNotSupported",
  canceled: "canceled",
  interrupted: "interrupted",
  audioBusy: "audioBusy",
  audioHardware: "audioHardware",
  synthesisUnavailable: "synthesisUnavailable",
  synthesisFailed: "synthesisFailed",
  languageUnavailable: "languageUnavailable",
  voiceUnavailable: "voiceUnavailable",
  textTooLong: "textTooLong",
  invalidArgument: "invalidArgument",
  unknown: "unknown",
} as const;

export type AIChatVoiceErrorCode =
  (typeof AI_CHAT_VOICE_ERROR_CODES)[keyof typeof AI_CHAT_VOICE_ERROR_CODES];

/**
 * Canonical i18n message keys for each voice error code.
 */
export const AI_CHAT_VOICE_ERROR_MESSAGE_KEYS: Readonly<Record<AIChatVoiceErrorCode, string>> = {
  unsupportedRecognition: "aiChatCommon.voice.errors.unsupportedRecognition",
  unsupportedSynthesis: "aiChatCommon.voice.errors.unsupportedSynthesis",
  startFailed: "aiChatCommon.voice.errors.startFailed",
  noSpeech: "aiChatCommon.voice.errors.noSpeech",
  aborted: "aiChatCommon.voice.errors.aborted",
  audioCapture: "aiChatCommon.voice.errors.audioCapture",
  network: "aiChatCommon.voice.errors.network",
  notAllowed: "aiChatCommon.voice.errors.notAllowed",
  serviceNotAllowed: "aiChatCommon.voice.errors.serviceNotAllowed",
  badGrammar: "aiChatCommon.voice.errors.badGrammar",
  languageNotSupported: "aiChatCommon.voice.errors.languageNotSupported",
  canceled: "aiChatCommon.voice.errors.canceled",
  interrupted: "aiChatCommon.voice.errors.interrupted",
  audioBusy: "aiChatCommon.voice.errors.audioBusy",
  audioHardware: "aiChatCommon.voice.errors.audioHardware",
  synthesisUnavailable: "aiChatCommon.voice.errors.synthesisUnavailable",
  synthesisFailed: "aiChatCommon.voice.errors.synthesisFailed",
  languageUnavailable: "aiChatCommon.voice.errors.languageUnavailable",
  voiceUnavailable: "aiChatCommon.voice.errors.voiceUnavailable",
  textTooLong: "aiChatCommon.voice.errors.textTooLong",
  invalidArgument: "aiChatCommon.voice.errors.invalidArgument",
  unknown: "aiChatCommon.voice.errors.unknown",
};

/**
 * Raw browser speech-recognition errors mapped to canonical voice error codes.
 */
export const AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP = {
  "no-speech": AI_CHAT_VOICE_ERROR_CODES.noSpeech,
  aborted: AI_CHAT_VOICE_ERROR_CODES.aborted,
  "audio-capture": AI_CHAT_VOICE_ERROR_CODES.audioCapture,
  network: AI_CHAT_VOICE_ERROR_CODES.network,
  "not-allowed": AI_CHAT_VOICE_ERROR_CODES.notAllowed,
  "service-not-allowed": AI_CHAT_VOICE_ERROR_CODES.serviceNotAllowed,
  "bad-grammar": AI_CHAT_VOICE_ERROR_CODES.badGrammar,
  "language-not-supported": AI_CHAT_VOICE_ERROR_CODES.languageNotSupported,
} as const;

/**
 * Raw browser speech-synthesis errors mapped to canonical voice error codes.
 */
export const AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP = {
  canceled: AI_CHAT_VOICE_ERROR_CODES.canceled,
  interrupted: AI_CHAT_VOICE_ERROR_CODES.interrupted,
  "audio-busy": AI_CHAT_VOICE_ERROR_CODES.audioBusy,
  "audio-hardware": AI_CHAT_VOICE_ERROR_CODES.audioHardware,
  network: AI_CHAT_VOICE_ERROR_CODES.network,
  "synthesis-unavailable": AI_CHAT_VOICE_ERROR_CODES.synthesisUnavailable,
  "synthesis-failed": AI_CHAT_VOICE_ERROR_CODES.synthesisFailed,
  "language-unavailable": AI_CHAT_VOICE_ERROR_CODES.languageUnavailable,
  "voice-unavailable": AI_CHAT_VOICE_ERROR_CODES.voiceUnavailable,
  "text-too-long": AI_CHAT_VOICE_ERROR_CODES.textTooLong,
  "invalid-argument": AI_CHAT_VOICE_ERROR_CODES.invalidArgument,
} as const;

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
