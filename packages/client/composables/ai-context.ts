import type {
  AIChatContext,
  AIChatContextEntity,
  AIChatContextEntityType,
  AIChatContextSource,
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
  inferAIChatDomainFromRoutePath,
} from "@bao/shared";
import type { LocationQueryValue } from "vue-router";

interface EntityContextInput {
  path: string;
  routeParams: Record<string, string>;
  routeQuery: Record<string, string>;
  jobs: readonly Job[];
  resumes: readonly ResumeData[];
  studio: GameStudio | null;
  interviewSessions: readonly InterviewSession[];
}

interface ContextBuilderInput {
  route: ReturnType<typeof useRoute>;
  jobs: ReturnType<typeof useState<Job[]>>;
  resumes: ReturnType<typeof useState<ResumeData[]>>;
  currentStudio: ReturnType<typeof useState<GameStudio | null>>;
  interviewSessions: ReturnType<typeof useState<InterviewSession[]>>;
  portfolioData: ReturnType<typeof useState<PortfolioData | null>>;
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

function buildInterviewSessionLabel(session: InterviewSession): string {
  const role =
    session.role?.trim() ||
    session.config.targetJob?.title?.trim() ||
    session.config.roleType.trim() ||
    "";
  const studio =
    session.studioName?.trim() ||
    session.config.targetJob?.company?.trim() ||
    session.studioId.trim() ||
    "";

  if (role.length > 0 && studio.length > 0) {
    return `${role} at ${studio}`;
  }

  return role || studio;
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
    const interviewSession = input.interviewSessions.find(
      (session) => session.id === interviewSessionId,
    );
    return toEntity(
      "interview_session",
      interviewSessionId,
      interviewSession ? buildInterviewSessionLabel(interviewSession) : undefined,
    );
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

export function createContextBuilder(input: ContextBuilderInput) {
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
      interviewSessions: input.interviewSessions.value,
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
        resumeCount: input.resumes.value.length,
        hasJobs: input.jobs.value.length > 0,
        jobCount: input.jobs.value.length,
        hasStudios: input.currentStudio.value !== null,
        studioCount: input.currentStudio.value ? 1 : 0,
        hasInterviewSessions: input.interviewSessions.value.length > 0,
        interviewSessionCount: input.interviewSessions.value.length,
        hasPortfolioProjects: (input.portfolioData.value?.projects.length ?? 0) > 0,
        portfolioProjectCount: input.portfolioData.value?.projects.length ?? 0,
      },
    };

    return entityContext ? { ...context, entity: entityContext } : context;
  };
}
