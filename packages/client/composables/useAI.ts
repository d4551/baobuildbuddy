import type {
  AIChatContext,
  AIChatContextEntity,
  AIChatContextEntityType,
  AIChatContextSource,
  ChatMessage,
  GameStudio,
  InterviewSession,
  Job,
  PortfolioData,
  ResumeData,
} from "@bao/shared";
import {
  AI_CHAT_ENTITY_ROUTE_PATHS,
  AI_CHAT_PAGE_PATH,
  AI_CHAT_ROUTE_QUERY_KEYS,
  APP_BRAND,
  generateId,
  inferAIChatDomainFromRoutePath,
  STATE_KEYS,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import type { LocationQueryValue } from "vue-router";
import { assertApiResponse, settlePromise, withLoadingState } from "~/composables/async-flow";
import { createChatMessage } from "~/utils/chat";

type AIChatResponse = {
  message?: string;
  id?: string;
  sessionId?: string;
  timestamp?: string;
};

interface SendMessageOptions {
  source?: AIChatContextSource;
}

interface CoverLetterGenerationInput {
  company: string;
  position: string;
  resumeId: string;
  jobId?: string;
}

interface EntityContextInput {
  path: string;
  routeParams: Record<string, string>;
  routeQuery: Record<string, string>;
  jobs: readonly Job[];
  resumes: readonly ResumeData[];
  studio: GameStudio | null;
}

interface ContextBuilderInput {
  route: ReturnType<typeof useRoute>;
  jobs: ReturnType<typeof useState<Job[]>>;
  resumes: ReturnType<typeof useState<ResumeData[]>>;
  currentStudio: ReturnType<typeof useState<GameStudio | null>>;
  interviewSessions: ReturnType<typeof useState<InterviewSession[]>>;
  portfolioData: ReturnType<typeof useState<PortfolioData | null>>;
}

interface ChatActionInput {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
  toast: ReturnType<typeof useNuxtApp>["$toast"];
  loading: ReturnType<typeof useState<boolean>>;
  streaming: ReturnType<typeof useState<boolean>>;
  messages: ReturnType<typeof useState<ChatMessage[]>>;
  sessionId: ReturnType<typeof useState<string>>;
  buildAssistantGreetingMessage: () => ChatMessage;
  buildCurrentContext: (source?: AIChatContextSource) => AIChatContext;
  unableToProcessFallback: () => string;
  requestErrorFallback: () => string;
}

interface DataActionInput {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
  loading: ReturnType<typeof useState<boolean>>;
}

interface AIStateRefs {
  messages: ReturnType<typeof useState<ChatMessage[]>>;
  sessionId: ReturnType<typeof useState<string>>;
  streaming: ReturnType<typeof useState<boolean>>;
  loading: ReturnType<typeof useState<boolean>>;
  resumes: ReturnType<typeof useState<ResumeData[]>>;
  jobs: ReturnType<typeof useState<Job[]>>;
  currentStudio: ReturnType<typeof useState<GameStudio | null>>;
  interviewSessions: ReturnType<typeof useState<InterviewSession[]>>;
  portfolioData: ReturnType<typeof useState<PortfolioData | null>>;
  buildAssistantGreetingMessage: () => ChatMessage;
}

function resolveAIChatSource(path: string, source?: AIChatContextSource): AIChatContextSource {
  if (source) {
    return source;
  }
  return path.startsWith(AI_CHAT_PAGE_PATH) ? "chat-page" : "floating-widget";
}

function normalizeRouteParams(
  params: Record<string, string | string[] | null | undefined>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      const [firstValue] = value;
      if (typeof firstValue === "string" && firstValue.length > 0) {
        normalized[key] = firstValue;
      }
      continue;
    }
    if (typeof value === "string" && value.length > 0) {
      normalized[key] = value;
    }
  }
  return normalized;
}

function normalizeRouteQuery(
  query: Record<string, LocationQueryValue | LocationQueryValue[]>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      const firstStringValue = value.find(
        (entry): entry is string => typeof entry === "string" && entry.length > 0,
      );
      if (firstStringValue) {
        normalized[key] = firstStringValue;
      }
      continue;
    }
    if (typeof value === "string" && value.length > 0) {
      normalized[key] = value;
    }
  }
  return normalized;
}

function toEntity(type: AIChatContextEntityType, id: string, label?: string): AIChatContextEntity {
  if (!label) {
    return { type, id };
  }
  return { type, id, label };
}

function resolveJobContextEntity(input: EntityContextInput): AIChatContextEntity | undefined {
  const routeId = input.routeParams[AI_CHAT_ROUTE_QUERY_KEYS.id];
  if (!(input.path.startsWith(`${AI_CHAT_ENTITY_ROUTE_PATHS.jobs}/`) && routeId)) {
    return;
  }
  const selectedJob = input.jobs.find((job) => job.id === routeId);
  const selectedJobLabel = selectedJob ? `${selectedJob.title} at ${selectedJob.company}` : "";
  return toEntity("job", routeId, selectedJobLabel);
}

function resolveInterviewContextEntity(input: EntityContextInput): AIChatContextEntity | undefined {
  const queryJobId = input.routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.jobId];
  if (!(input.path.startsWith(AI_CHAT_ENTITY_ROUTE_PATHS.interview) && queryJobId)) {
    return;
  }
  const selectedJob = input.jobs.find((job) => job.id === queryJobId);
  const selectedJobLabel = selectedJob ? `${selectedJob.title} at ${selectedJob.company}` : "";
  return toEntity("job", queryJobId, selectedJobLabel);
}

function resolveResumeContextEntity(input: EntityContextInput): AIChatContextEntity | undefined {
  if (!input.path.startsWith(AI_CHAT_ENTITY_ROUTE_PATHS.resume)) {
    return;
  }
  const routeId = input.routeParams[AI_CHAT_ROUTE_QUERY_KEYS.id];
  const queryResumeId = input.routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.resumeId];
  const resolvedResumeId = routeId || queryResumeId;
  if (!resolvedResumeId) {
    return;
  }
  const selectedResume = input.resumes.find((resume) => resume.id === resolvedResumeId);
  return toEntity("resume", resolvedResumeId, selectedResume?.name ?? "");
}

function resolveStudioPathContextEntity(input: EntityContextInput): AIChatContextEntity | undefined {
  const routeId = input.routeParams[AI_CHAT_ROUTE_QUERY_KEYS.id];
  if (!(input.path.startsWith(`${AI_CHAT_ENTITY_ROUTE_PATHS.studios}/`) && routeId)) {
    return;
  }
  return toEntity("studio", routeId, input.studio?.name ?? "");
}

function resolveStudioQueryContextEntity(input: EntityContextInput): AIChatContextEntity | undefined {
  const queryStudioId = input.routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.studioId];
  if (!queryStudioId) {
    return;
  }
  return toEntity("studio", queryStudioId, input.studio?.name ?? "");
}

function resolveSessionContextEntity(input: EntityContextInput): AIChatContextEntity | undefined {
  const interviewSessionId = input.routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.id];
  if (input.path.startsWith(AI_CHAT_ENTITY_ROUTE_PATHS.interviewSession) && interviewSessionId) {
    return toEntity("interview_session", interviewSessionId);
  }

  const routeId = input.routeParams[AI_CHAT_ROUTE_QUERY_KEYS.id];
  if (input.path.startsWith(`${AI_CHAT_ENTITY_ROUTE_PATHS.automationRuns}/`) && routeId) {
    return toEntity("automation_run", routeId);
  }

  return;
}

function resolveEntityContext(input: EntityContextInput): AIChatContextEntity | undefined {
  const resolvers = [
    resolveJobContextEntity,
    resolveInterviewContextEntity,
    resolveResumeContextEntity,
    resolveStudioPathContextEntity,
    resolveStudioQueryContextEntity,
    resolveSessionContextEntity,
  ] as const;

  for (const resolver of resolvers) {
    const entity = resolver(input);
    if (entity) {
      return entity;
    }
  }

  return;
}

function parseAIChatResponse(data: unknown): AIChatResponse {
  const response: AIChatResponse = {};
  if (!(data && typeof data === "object")) {
    return response;
  }

  if ("message" in data && typeof data.message === "string") {
    response.message = data.message;
  }
  if ("id" in data && typeof data.id === "string") {
    response.id = data.id;
  }
  if ("sessionId" in data && typeof data.sessionId === "string") {
    response.sessionId = data.sessionId;
  }
  if ("timestamp" in data && typeof data.timestamp === "string") {
    response.timestamp = data.timestamp;
  }

  return response;
}

function createContextBuilder(input: ContextBuilderInput) {
  return (source?: AIChatContextSource): AIChatContext => {
    const routeParams = normalizeRouteParams(input.route.params);
    const routeQuery = normalizeRouteQuery(input.route.query);
    const routeName = typeof input.route.name === "string" ? input.route.name : "";
    const resolvedSource = resolveAIChatSource(input.route.path, source);
    const entityContext = resolveEntityContext({
      path: input.route.path,
      routeParams,
      routeQuery,
      jobs: input.jobs.value,
      resumes: input.resumes.value,
      studio: input.currentStudio.value,
    });

    const context: AIChatContext = {
      source: resolvedSource,
      domain: inferAIChatDomainFromRoutePath(input.route.path),
      route: {
        path: input.route.path,
        params: routeParams,
        query: routeQuery,
        ...(routeName ? { name: routeName } : {}),
      },
      state: {
        hasResumes: input.resumes.value.length > 0,
        hasJobs: input.jobs.value.length > 0,
        hasStudios: input.currentStudio.value !== null,
        hasInterviewSessions: input.interviewSessions.value.length > 0,
        hasPortfolioProjects: (input.portfolioData.value?.projects.length ?? 0) > 0,
      },
    };

    return entityContext ? { ...context, entity: entityContext } : context;
  };
}

async function requestAIChatResponse(
  input: ChatActionInput,
  content: string,
  source?: AIChatContextSource,
): Promise<AIChatResponse> {
  const userMessage = createChatMessage({
    role: "user",
    content,
    sessionId: input.sessionId.value,
    timestamp: new Date().toISOString(),
  });
  input.messages.value.push(userMessage);

  const { data, error } = await input.api.ai.chat.post({
    message: content,
    sessionId: input.sessionId.value,
    context: input.buildCurrentContext(source),
  });
  assertApiResponse(error, input.t("apiErrors.ai.sendMessageFailed"));

  const response = parseAIChatResponse(data);
  if (typeof response.sessionId === "string" && response.sessionId.length > 0) {
    input.sessionId.value = response.sessionId;
  }

  const assistantMessage = createChatMessage({
    role: "assistant",
    content: response.message || input.unableToProcessFallback(),
    id: response.id,
    sessionId: response.sessionId ?? input.sessionId.value,
    timestamp: response.timestamp ?? new Date().toISOString(),
  });
  input.messages.value.push(assistantMessage);

  return response;
}

function createChatActions(input: ChatActionInput) {
  const sendMessage = async (content: string, options: SendMessageOptions = {}) => {
    input.streaming.value = true;
    const sendResult = await settlePromise(
      withLoadingState(input.loading, () => requestAIChatResponse(input, content, options.source)),
      input.t("aiChatCommon.requestErrorToast"),
    );
    input.streaming.value = false;

    if (!sendResult.ok) {
      input.toast.error(input.t("aiChatCommon.requestErrorToast"));
      input.messages.value.push(
        createChatMessage({
          role: "assistant",
          content: input.requestErrorFallback(),
          sessionId: input.sessionId.value,
          timestamp: new Date().toISOString(),
        }),
      );
      return null;
    }

    return sendResult.value;
  };

  const clearMessages = (): void => {
    input.sessionId.value = generateId();
    input.messages.value = [input.buildAssistantGreetingMessage()];
  };

  return {
    sendMessage,
    clearMessages,
  };
}

function createDataActions(input: DataActionInput) {
  const analyzeResume = async (resumeId: string) =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai["analyze-resume"].post({ resumeId });
      assertApiResponse(error, input.t("apiErrors.ai.analyzeResumeFailed"));
      return data;
    });

  const generateCoverLetter = async (generationData: CoverLetterGenerationInput) =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai["generate-cover-letter"].post(generationData);
      assertApiResponse(error, input.t("apiErrors.ai.generateCoverLetterFailed"));
      return data;
    });

  const matchJobs = async (resumeId: string) =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai["match-jobs"].post({ resumeId });
      assertApiResponse(error, input.t("apiErrors.ai.matchJobsFailed"));
      return data;
    });

  const getModels = async () =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai.models.get();
      assertApiResponse(error, input.t("apiErrors.ai.fetchModelsFailed"));
      return data;
    });

  const getUsage = async () =>
    withLoadingState(input.loading, async () => {
      const { data, error } = await input.api.ai.usage.get();
      assertApiResponse(error, input.t("apiErrors.ai.fetchUsageFailed"));
      return data;
    });

  return {
    analyzeResume,
    generateCoverLetter,
    matchJobs,
    getModels,
    getUsage,
  };
}

function initializeAIState(t: ReturnType<typeof useI18n>["t"]): AIStateRefs {
  const messages = useState<ChatMessage[]>(STATE_KEYS.AI_MESSAGES, () => []);
  const state: AIStateRefs = {
    messages,
    sessionId: useState<string>(STATE_KEYS.AI_SESSION_ID, () => generateId()),
    streaming: useState(STATE_KEYS.AI_STREAMING, () => false),
    loading: useState(STATE_KEYS.AI_LOADING, () => false),
    resumes: useState<ResumeData[]>(STATE_KEYS.RESUME_LIST, () => []),
    jobs: useState<Job[]>(STATE_KEYS.JOBS_LIST, () => []),
    currentStudio: useState<GameStudio | null>(STATE_KEYS.STUDIO_CURRENT, () => null),
    interviewSessions: useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []),
    portfolioData: useState<PortfolioData | null>(STATE_KEYS.PORTFOLIO_DATA, () => null),
    buildAssistantGreetingMessage: () =>
      createChatMessage({
        role: "assistant",
        content: t("aiChatCommon.defaultGreeting", { brand: APP_BRAND.name }),
        timestamp: new Date().toISOString(),
      }),
  };
  if (messages.value.length === 0) {
    messages.value = [state.buildAssistantGreetingMessage()];
  }
  return state;
}

/**
 * AI interaction composable for chat, analysis, and generation.
 */
export function useAI() {
  const api = useApi();
  const route = useRoute();
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const state = initializeAIState(t);

  const buildCurrentContext = createContextBuilder({
    route,
    jobs: state.jobs,
    resumes: state.resumes,
    currentStudio: state.currentStudio,
    interviewSessions: state.interviewSessions,
    portfolioData: state.portfolioData,
  });
  const chatActions = createChatActions({
    api,
    t,
    toast: $toast,
    loading: state.loading,
    streaming: state.streaming,
    messages: state.messages,
    sessionId: state.sessionId,
    buildAssistantGreetingMessage: state.buildAssistantGreetingMessage,
    buildCurrentContext,
    unableToProcessFallback: () => t("aiChatCommon.unableToProcessFallback"),
    requestErrorFallback: () => t("aiChatCommon.requestErrorFallback"),
  });
  const dataActions = createDataActions({ api, t, loading: state.loading });

  return {
    messages: readonly(state.messages),
    sessionId: readonly(state.sessionId),
    streaming: readonly(state.streaming),
    loading: readonly(state.loading),
    buildCurrentContext,
    ...chatActions,
    ...dataActions,
  };
}
