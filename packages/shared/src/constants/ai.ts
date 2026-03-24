import type {
  AIChatContextDomain,
  AIRouting,
  AIRoutingPurpose,
  AIRoutingTarget,
  AIProviderType,
} from "../types/ai";
import { AI_PROVIDER_IDS, AI_ROUTING_PURPOSE_IDS } from "../types/ai";

export { AI_ROUTING_PURPOSE_IDS };
import { API_ENDPOINTS } from "./endpoints";
import { APP_ROUTE_QUERY_KEYS, APP_ROUTES } from "./routes";

const CLAUDE_TEST_MAX_TOKENS = 1;
const ANTHROPIC_API_VERSION = "2023-06-01";

/** Default temperature for analysis, matching, and structured outputs (lower = more deterministic). */
export const AI_DEFAULT_TEMPERATURE = 0.3;

/** Default temperature for creative generation (resume, cover letter). */
export const AI_DEFAULT_TEMPERATURE_CREATIVE = 0.7;

/** Default temperature for interview Q&A and feedback (slightly higher than analysis). */
export const AI_DEFAULT_TEMPERATURE_INTERVIEW = 0.35;

/** Default temperature for interview question generation (more varied questions). */
export const AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS = 0.65;

/** Default temperature for structured extraction (field mapping, low variance). */
export const AI_DEFAULT_TEMPERATURE_STRUCTURED = 0.1;

/** AI generation max token limits by use case. Single source of truth. */
export const AI_MAX_TOKENS_CHAT = 1000;
export const AI_MAX_TOKENS_ANALYSIS = 1200;
export const AI_MAX_TOKENS_MATCH = 1500;
export const AI_MAX_TOKENS_RESUME = 1500;
export const AI_MAX_TOKENS_WS = 2048;
export const AI_MAX_TOKENS_QUESTION = 900;
export const AI_MAX_TOKENS_FEEDBACK = 500;
export const AI_MAX_TOKENS_CV_QUESTION = 1200;
export const AI_MAX_TOKENS_CV_ANALYSIS = 2000;
export const AI_MAX_TOKENS_FIELD_MAPPER = 1000;
export const AI_MAX_TOKENS_SCRAPE_ENRICHMENT = 900;
export const AI_MAX_TOKENS_SCORE = 2000;
const CLAUDE_TEST_MODEL = "claude-sonnet-4-5-20250929";

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
    modelHints: ["claude-sonnet-4-5-20250929", "claude-3-5-sonnet-20241022", "claude-3-opus"],
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
export const DEFAULT_AI_ROUTING: AIRouting = Object.freeze(
  Object.fromEntries(
    AI_ROUTING_PURPOSE_IDS.map((purpose) => [purpose, { ...AI_ROUTING_DEFAULT_TARGET }]),
  ) as AIRouting,
);

/**
 * Normalizes a partial routing payload into the full canonical routing table.
 */
export function normalizeAIRouting(
  routing?: Partial<Record<AIRoutingPurpose, Partial<AIRoutingTarget> | undefined>> | null,
  fallbackProvider: AIProviderType = AI_PROVIDER_DEFAULT,
  fallbackModel?: string | null,
): AIRouting {
  return Object.fromEntries(
    AI_ROUTING_PURPOSE_IDS.map((purpose) => {
      const configuredTarget = routing?.[purpose];
      const configuredProvider = configuredTarget?.provider;
      const provider = AI_PROVIDER_ID_LIST.includes(configuredProvider ?? fallbackProvider)
        ? (configuredProvider ?? fallbackProvider)
        : fallbackProvider;
      const model =
        typeof configuredTarget?.model === "string" && configuredTarget.model.trim().length > 0
          ? configuredTarget.model.trim()
          : typeof fallbackModel === "string" && fallbackModel.trim().length > 0
            ? fallbackModel.trim()
            : undefined;
      return [purpose, model ? { provider, model } : { provider }];
    }),
  ) as AIRouting;
}

/**
 * Max number of historical chat messages included in AI prompt context.
 */
export const AI_CHAT_CONTEXT_MESSAGE_LIMIT = 12;

/**
 * Max number of stored chat messages loaded from persistence for context assembly.
 */
export const AI_CHAT_HISTORY_FETCH_LIMIT = 20;

/**
 * Max number of recent jobs fetched for AI context (e.g. job match analysis).
 */
export const AI_CHAT_RECENT_JOBS_LIMIT = 10;

/**
 * Max number of most recent chat messages included in context assembly.
 */
export const AI_CHAT_CONTEXT_TAIL_LIMIT = 10;

/** Max saved jobs in job-search context. */
export const AI_CHAT_CONTEXT_SAVED_JOBS_LIMIT = 10;

/** Max interview sessions in interview context. */
export const AI_CHAT_CONTEXT_INTERVIEW_SESSIONS_LIMIT = 3;

/** Max portfolio projects in portfolio context. */
export const AI_CHAT_CONTEXT_PORTFOLIO_PROJECTS_LIMIT = 10;

/** Max skill mappings in skills context. */
export const AI_CHAT_CONTEXT_SKILL_MAPPINGS_LIMIT = 20;

/** Max automation runs in automation context. */
export const AI_CHAT_CONTEXT_AUTOMATION_RUNS_LIMIT = 5;

/** Max available resumes in automation context. */
export const AI_CHAT_CONTEXT_AVAILABLE_RESUMES_LIMIT = 10;

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
