import type {
  AIChatContextEntityType,
  AIChatContext,
  AIChatContextEntity,
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
  STATE_KEYS,
  generateId,
  inferAIChatDomainFromRoutePath,
} from "@bao/shared";
import type { LocationQueryValue } from "vue-router";
import { useI18n } from "vue-i18n";

type AIChatResponse = {
  message?: string;
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

function resolveAIChatSource(path: string, source?: AIChatContextSource): AIChatContextSource {
  if (source) return source;
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

function resolveEntityContext(
  path: string,
  routeParams: Record<string, string>,
  routeQuery: Record<string, string>,
  jobs: Job[],
  resumes: ResumeData[],
  studio: GameStudio | null,
): AIChatContextEntity | undefined {
  const routeId = routeParams[AI_CHAT_ROUTE_QUERY_KEYS.id];
  const queryJobId = routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.jobId];
  const queryResumeId = routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.resumeId];
  const queryStudioId = routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.studioId];

  const toEntity = (
    type: AIChatContextEntityType,
    id: string,
    label?: string,
  ): AIChatContextEntity => {
    if (label) {
      return { type, id, label };
    }
    return { type, id };
  };

  if (path.startsWith(`${AI_CHAT_ENTITY_ROUTE_PATHS.jobs}/`) && routeId) {
    const selectedJob = jobs.find((job) => job.id === routeId);
    const selectedJobLabel = selectedJob ? `${selectedJob.title} at ${selectedJob.company}` : "";
    if (selectedJobLabel) {
      return toEntity("job", routeId, selectedJobLabel);
    }
    return toEntity("job", routeId);
  }

  if (path.startsWith(AI_CHAT_ENTITY_ROUTE_PATHS.interview) && queryJobId) {
    const selectedJob = jobs.find((job) => job.id === queryJobId);
    const selectedJobLabel = selectedJob ? `${selectedJob.title} at ${selectedJob.company}` : "";
    if (selectedJobLabel) {
      return toEntity("job", queryJobId, selectedJobLabel);
    }
    return toEntity("job", queryJobId);
  }

  if (path.startsWith(AI_CHAT_ENTITY_ROUTE_PATHS.resume)) {
    const resolvedResumeId = routeId || queryResumeId;
    if (resolvedResumeId) {
      const selectedResume = resumes.find((resume) => resume.id === resolvedResumeId);
      const selectedResumeLabel = selectedResume?.name ?? "";
      if (selectedResumeLabel) {
        return toEntity("resume", resolvedResumeId, selectedResumeLabel);
      }
      return toEntity("resume", resolvedResumeId);
    }
  }

  if (path.startsWith(`${AI_CHAT_ENTITY_ROUTE_PATHS.studios}/`) && routeId) {
    const studioLabel = studio?.name ?? "";
    if (studioLabel) {
      return toEntity("studio", routeId, studioLabel);
    }
    return toEntity("studio", routeId);
  }

  if (queryStudioId) {
    const studioLabel = studio?.name ?? "";
    if (studioLabel) {
      return toEntity("studio", queryStudioId, studioLabel);
    }
    return toEntity("studio", queryStudioId);
  }

  const interviewSessionId = routeQuery[AI_CHAT_ROUTE_QUERY_KEYS.id];
  if (path.startsWith(AI_CHAT_ENTITY_ROUTE_PATHS.interviewSession) && interviewSessionId) {
    return toEntity("interview_session", interviewSessionId);
  }

  if (path.startsWith(`${AI_CHAT_ENTITY_ROUTE_PATHS.automationRuns}/`) && routeId) {
    return toEntity("automation_run", routeId);
  }

  return undefined;
}

/**
 * AI interaction composable for chat, analysis, and generation.
 */
export function useAI() {
  const api = useApi();
  const route = useRoute();
  const { t } = useI18n();
  const defaultAssistantGreeting = () =>
    t("aiChatCommon.defaultGreeting", { brand: APP_BRAND.name });
  const unableToProcessFallback = () => t("aiChatCommon.unableToProcessFallback");
  const requestErrorFallback = () => t("aiChatCommon.requestErrorFallback");
  const messages = useState<ChatMessage[]>(STATE_KEYS.AI_MESSAGES, () => [
    {
      role: "assistant",
      content: defaultAssistantGreeting(),
      timestamp: new Date().toISOString(),
    },
  ]);
  const sessionId = useState<string>(STATE_KEYS.AI_SESSION_ID, () => generateId());
  const streaming = useState(STATE_KEYS.AI_STREAMING, () => false);
  const loading = useState(STATE_KEYS.AI_LOADING, () => false);
  const resumes = useState<ResumeData[]>(STATE_KEYS.RESUME_LIST, () => []);
  const jobs = useState<Job[]>(STATE_KEYS.JOBS_LIST, () => []);
  const currentStudio = useState<GameStudio | null>(STATE_KEYS.STUDIO_CURRENT, () => null);
  const interviewSessions = useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []);
  const portfolioData = useState<PortfolioData | null>(STATE_KEYS.PORTFOLIO_DATA, () => null);

  function buildChatContext(source: AIChatContextSource): AIChatContext {
    const routeParams = normalizeRouteParams(route.params);
    const routeQuery = normalizeRouteQuery(route.query);
    const routeName = typeof route.name === "string" ? route.name : "";

    const contextRoute: AIChatContext["route"] = {
      path: route.path,
      params: routeParams,
      query: routeQuery,
      ...(routeName ? { name: routeName } : {}),
    };

    const contextEntity = resolveEntityContext(
      route.path,
      routeParams,
      routeQuery,
      jobs.value,
      resumes.value,
      currentStudio.value,
    );

    const contextState: AIChatContext["state"] = {
      hasResumes: resumes.value.length > 0,
      hasJobs: jobs.value.length > 0,
      hasStudios: currentStudio.value !== null,
      hasInterviewSessions: interviewSessions.value.length > 0,
      hasPortfolioProjects: (portfolioData.value?.projects.length ?? 0) > 0,
    };

    const baseContext: AIChatContext = {
      source,
      domain: inferAIChatDomainFromRoutePath(route.path),
      route: contextRoute,
      state: contextState,
    };

    if (contextEntity) {
      return { ...baseContext, entity: contextEntity };
    }

    return baseContext;
  }

  async function sendMessage(content: string, options: SendMessageOptions = {}) {
    loading.value = true;
    streaming.value = true;
    try {
      const userMessage: ChatMessage = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      messages.value.push(userMessage);

      try {
        const source = resolveAIChatSource(route.path, options.source);
        const context = buildChatContext(source);
        const { data, error } = await api.ai.chat.post({
          message: content,
          sessionId: sessionId.value,
          context,
        });
        if (error) throw new Error("Failed to send message");

        if (typeof data?.sessionId === "string" && data.sessionId.length > 0) {
          sessionId.value = data.sessionId;
        }

        const response: AIChatResponse = data ?? {};
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.message || unableToProcessFallback(),
          timestamp: new Date().toISOString(),
        };
        messages.value.push(assistantMessage);
        return data;
      } catch {
        messages.value.push({
          role: "assistant",
          content: requestErrorFallback(),
          timestamp: new Date().toISOString(),
        });
        return null;
      }
    } finally {
      loading.value = false;
      streaming.value = false;
    }
  }

  async function analyzeResume(resumeId: string) {
    loading.value = true;
    try {
      const { data, error } = await api.ai["analyze-resume"].post({ resumeId });
      if (error) throw new Error("Failed to analyze resume");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function generateCoverLetter(generationData: CoverLetterGenerationInput) {
    loading.value = true;
    try {
      const { data, error } = await api.ai["generate-cover-letter"].post(generationData);
      if (error) throw new Error("Failed to generate cover letter");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function matchJobs(resumeId: string) {
    loading.value = true;
    try {
      const { data, error } = await api.ai["match-jobs"].post({ resumeId });
      if (error) throw new Error("Failed to match jobs");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function getModels() {
    loading.value = true;
    try {
      const { data, error } = await api.ai.models.get();
      if (error) throw new Error("Failed to fetch AI models");
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function getUsage() {
    loading.value = true;
    try {
      const { data, error } = await api.ai.usage.get();
      if (error) throw new Error("Failed to fetch AI usage");
      return data;
    } finally {
      loading.value = false;
    }
  }

  function clearMessages() {
    sessionId.value = generateId();
    messages.value = [
      {
        role: "assistant",
        content: defaultAssistantGreeting(),
        timestamp: new Date().toISOString(),
      },
    ];
  }

  return {
    messages: readonly(messages),
    sessionId: readonly(sessionId),
    streaming: readonly(streaming),
    loading: readonly(loading),
    sendMessage,
    analyzeResume,
    generateCoverLetter,
    matchJobs,
    getModels,
    getUsage,
    clearMessages,
  };
}
