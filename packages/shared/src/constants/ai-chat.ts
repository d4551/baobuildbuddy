import type { AIChatContextDomain } from "../types/ai";
import { API_ENDPOINTS } from "./endpoints";
import { APP_ROUTE_QUERY_KEYS, APP_ROUTES } from "./routes";

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

export const AI_CHAT_CONTEXT_SAVED_JOBS_LIMIT = 10;
export const AI_CHAT_CONTEXT_INTERVIEW_SESSIONS_LIMIT = 3;
export const AI_CHAT_CONTEXT_PORTFOLIO_PROJECTS_LIMIT = 10;
export const AI_CHAT_CONTEXT_PORTFOLIO_DESCRIPTION_SNIPPET_LENGTH = 120;
export const AI_CHAT_CONTEXT_SKILL_MAPPINGS_LIMIT = 20;
export const AI_CHAT_CONTEXT_AUTOMATION_RUNS_LIMIT = 5;
export const AI_CHAT_CONTEXT_AVAILABLE_RESUMES_LIMIT = 10;

export const AI_CHAT_PAGE_PATH = APP_ROUTES.aiChat;
export const AI_CHAT_API_ENDPOINT = API_ENDPOINTS.aiChat;

export const AI_CHAT_ROUTE_QUERY_KEYS = {
  id: APP_ROUTE_QUERY_KEYS.id,
  jobId: APP_ROUTE_QUERY_KEYS.jobId,
  resumeId: APP_ROUTE_QUERY_KEYS.resumeId,
  studioId: APP_ROUTE_QUERY_KEYS.studioId,
} as const;

export const AI_CHAT_ENTITY_ROUTE_PATHS = {
  jobs: APP_ROUTES.jobs,
  resume: APP_ROUTES.resume,
  studios: APP_ROUTES.studios,
  interview: APP_ROUTES.interview,
  interviewSession: APP_ROUTES.interviewSession,
  automationRuns: APP_ROUTES.automationRuns,
} as const;

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

export const AI_CHAT_DEFAULT_DOMAIN: AIChatContextDomain = "general";

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

export const AI_CHAT_FLOATING_CONTEXT_PROMPT_KEYS: Readonly<Record<AIChatContextDomain, string>> = {
  resume: "floatingChat.prompts.resume",
  job_search: "floatingChat.prompts.jobSearch",
  interview: "floatingChat.prompts.interview",
  portfolio: "floatingChat.prompts.portfolio",
  skills: "floatingChat.prompts.skills",
  automation: "floatingChat.prompts.automation",
  general: "floatingChat.prompts.general",
};

export const AI_CHAT_FLOATING_FOCUSED_ENTITY_PROMPT_KEY = "floatingChat.prompts.focusedEntity";

/**
 * Infers AI chat domain from route path.
 */
export function inferAIChatDomainFromRoutePath(path: string): AIChatContextDomain {
  const matchedRule = AI_CHAT_ROUTE_DOMAIN_RULES.find((rule) => path.startsWith(rule.prefix));
  return matchedRule?.domain ?? AI_CHAT_DEFAULT_DOMAIN;
}
