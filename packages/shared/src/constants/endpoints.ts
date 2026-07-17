import {
  type AutomationScrapePortalId,
  type AutomationScrapeTarget,
  automationScrapeTargetToPortalId,
  isAutomationJobScrapeTarget,
} from "./automation";

/**
 * OpenAPI/Swagger documentation version.
 */
export const OPENAPI_VERSION = "0.1.0" as const;

/**
 * Canonical API prefix used by Nuxt client calls and Elysia server routes.
 */
export const API_ENDPOINT_PREFIX = "/api";

/**
 * OpenAI-compatible public API prefix for external SDK clients.
 * Mounted alongside `/api` (not under it) so `baseURL` can be `http://host:3000/v1`.
 */
export const OPENAI_COMPAT_ENDPOINT_PREFIX = "/v1";

/**
 * OpenAI-compatible HTTP endpoints (Chat Completions API surface).
 */
export const OPENAI_COMPAT_ENDPOINTS = {
  models: `${OPENAI_COMPAT_ENDPOINT_PREFIX}/models`,
  chatCompletions: `${OPENAI_COMPAT_ENDPOINT_PREFIX}/chat/completions`,
} as const;

/**
 * Canonical HTTP endpoints consumed by client-side data and mutation flows.
 */
export const API_ENDPOINTS = {
  health: `${API_ENDPOINT_PREFIX}/health`,
  authBase: `${API_ENDPOINT_PREFIX}/auth`,
  authStatus: `${API_ENDPOINT_PREFIX}/auth/status`,
  authInit: `${API_ENDPOINT_PREFIX}/auth/init`,
  authConfigured: `${API_ENDPOINT_PREFIX}/auth/configured`,
  userBase: `${API_ENDPOINT_PREFIX}/user`,
  userProfile: `${API_ENDPOINT_PREFIX}/user/profile`,
  searchBase: `${API_ENDPOINT_PREFIX}/search`,
  search: `${API_ENDPOINT_PREFIX}/search`,
  searchAutocomplete: `${API_ENDPOINT_PREFIX}/search/autocomplete`,
  jobsBase: `${API_ENDPOINT_PREFIX}/jobs`,
  jobs: `${API_ENDPOINT_PREFIX}/jobs`,
  jobsSaved: `${API_ENDPOINT_PREFIX}/jobs/saved`,
  jobsSave: `${API_ENDPOINT_PREFIX}/jobs/save`,
  jobsApply: `${API_ENDPOINT_PREFIX}/jobs/apply`,
  jobsApplications: `${API_ENDPOINT_PREFIX}/jobs/applications`,
  jobsRecommendations: `${API_ENDPOINT_PREFIX}/jobs/recommendations`,
  jobsRefresh: `${API_ENDPOINT_PREFIX}/jobs/refresh`,
  studiosBase: `${API_ENDPOINT_PREFIX}/studios`,
  studios: `${API_ENDPOINT_PREFIX}/studios`,
  studiosAnalytics: `${API_ENDPOINT_PREFIX}/studios/analytics`,
  portfolioBase: `${API_ENDPOINT_PREFIX}/portfolio`,
  portfolio: `${API_ENDPOINT_PREFIX}/portfolio`,
  portfolioProjects: `${API_ENDPOINT_PREFIX}/portfolio/projects`,
  portfolioProjectsReorder: `${API_ENDPOINT_PREFIX}/portfolio/projects/reorder`,
  resumes: `${API_ENDPOINT_PREFIX}/resumes`,
  resumeFromQuestionsGenerate: `${API_ENDPOINT_PREFIX}/resumes/from-questions/generate`,
  resumeFromQuestionsSynthesize: `${API_ENDPOINT_PREFIX}/resumes/from-questions/synthesize`,
  coverLettersBase: `${API_ENDPOINT_PREFIX}/cover-letters`,
  coverLetters: `${API_ENDPOINT_PREFIX}/cover-letters`,
  coverLettersGenerate: `${API_ENDPOINT_PREFIX}/cover-letters/generate`,
  skillsBase: `${API_ENDPOINT_PREFIX}/skills`,
  skillMappings: `${API_ENDPOINT_PREFIX}/skills/mappings`,
  skillReadiness: `${API_ENDPOINT_PREFIX}/skills/readiness`,
  interviewBase: `${API_ENDPOINT_PREFIX}/interview`,
  interviewStats: `${API_ENDPOINT_PREFIX}/interview/stats`,
  statsBase: `${API_ENDPOINT_PREFIX}/stats`,
  statsDashboard: `${API_ENDPOINT_PREFIX}/stats/dashboard`,
  statsWeekly: `${API_ENDPOINT_PREFIX}/stats/weekly`,
  statsCareer: `${API_ENDPOINT_PREFIX}/stats/career`,
  gamificationBase: `${API_ENDPOINT_PREFIX}/gamification`,
  gamificationProgress: `${API_ENDPOINT_PREFIX}/gamification/progress`,
  gamificationAwardXp: `${API_ENDPOINT_PREFIX}/gamification/award-xp`,
  gamificationChallenges: `${API_ENDPOINT_PREFIX}/gamification/challenges`,
  aiBase: `${API_ENDPOINT_PREFIX}/ai`,
  aiChat: `${API_ENDPOINT_PREFIX}/ai/chat`,
  aiModels: `${API_ENDPOINT_PREFIX}/ai/models`,
  scraperBase: `${API_ENDPOINT_PREFIX}/scraper`,
  scraperStudios: `${API_ENDPOINT_PREFIX}/scraper/studios`,
  scraperJobsBase: `${API_ENDPOINT_PREFIX}/scraper/jobs`,
  scraperJobsHitmarker: `${API_ENDPOINT_PREFIX}/scraper/jobs/hitmarker`,
  settings: `${API_ENDPOINT_PREFIX}/settings`,
  settingsExport: `${API_ENDPOINT_PREFIX}/settings/export`,
  settingsApiKeys: `${API_ENDPOINT_PREFIX}/settings/api-keys`,
  settingsJobTaxonomy: `${API_ENDPOINT_PREFIX}/settings/job-taxonomy`,
  automationBase: `${API_ENDPOINT_PREFIX}/automation`,
  automationJobApply: `${API_ENDPOINT_PREFIX}/automation/job-apply`,
  automationJobApplySchedule: `${API_ENDPOINT_PREFIX}/automation/job-apply/schedule`,
  automationEmailResponse: `${API_ENDPOINT_PREFIX}/automation/email-response`,
  automationEmailResponseSchedule: `${API_ENDPOINT_PREFIX}/automation/email-response/schedule`,
  automationScrape: `${API_ENDPOINT_PREFIX}/automation/scrape`,
  automationScrapeSchedule: `${API_ENDPOINT_PREFIX}/automation/scrape/schedule`,
  automationCapabilities: `${API_ENDPOINT_PREFIX}/automation/capabilities`,
  automationVerifyContext: `${API_ENDPOINT_PREFIX}/automation/verify/context`,
  automationRuns: `${API_ENDPOINT_PREFIX}/automation/runs`,
  automationScreenshotsBase: `${API_ENDPOINT_PREFIX}/automation/screenshots`,
  apiDocsUi: `${API_ENDPOINT_PREFIX}/docs/api`,
  apiDocsJson: `${API_ENDPOINT_PREFIX}/docs/api/json`,
} as const;

/**
 * Builds the resume export endpoint for a resume identifier.
 *
 * @param resumeId Resume identifier.
 * @returns Resume export endpoint path.
 */
export function buildResumeExportEndpoint(resumeId: string): string {
  return `${API_ENDPOINTS.resumes}/${encodeURIComponent(resumeId.trim())}/export`;
}

/**
 * Builds the job detail endpoint for a job identifier.
 *
 * @param jobId Job identifier.
 * @returns Canonical job detail endpoint path.
 */
export function buildJobDetailEndpoint(jobId: string): string {
  return `${API_ENDPOINTS.jobs}/${encodeURIComponent(jobId.trim())}`;
}

/**
 * Builds the job-save endpoint for a job identifier.
 *
 * @param jobId Job identifier.
 * @returns Canonical job-save mutation endpoint path.
 */
export function buildJobSaveEndpoint(jobId: string): string {
  return `${API_ENDPOINTS.jobsSave}/${encodeURIComponent(jobId.trim())}`;
}

/**
 * Builds the job-application detail endpoint for a saved application identifier.
 *
 * @param applicationId Application identifier.
 * @returns Canonical job-application detail endpoint path.
 */
export function buildJobApplicationEndpoint(applicationId: string): string {
  return `${API_ENDPOINTS.jobsApply}/${encodeURIComponent(applicationId.trim())}`;
}

/**
 * Builds the studio detail endpoint for a studio identifier.
 *
 * @param studioId Studio identifier.
 * @returns Canonical studio detail endpoint path.
 */
export function buildStudioDetailEndpoint(studioId: string): string {
  return `${API_ENDPOINTS.studios}/${encodeURIComponent(studioId.trim())}`;
}

/**
 * Builds the gamification challenge completion endpoint.
 *
 * @param challengeId Challenge identifier.
 * @returns Canonical challenge completion endpoint path.
 */
export function buildGamificationChallengeCompleteEndpoint(challengeId: string): string {
  return `${API_ENDPOINTS.gamificationChallenges}/${encodeURIComponent(challengeId.trim())}/complete`;
}

/**
 * Builds the manual scraper endpoint for a gaming-portal job source.
 *
 * @param portalId Supported RPA portal identifier.
 * @returns Canonical API endpoint path for the portal scraper.
 */
export function buildScraperJobsEndpoint(portalId: AutomationScrapePortalId): string {
  return `${API_ENDPOINT_PREFIX}/scraper/jobs/${encodeURIComponent(portalId.trim())}`;
}

/**
 * Builds the canonical scraper endpoint for a supported scrape target.
 *
 * @param target Supported scrape target.
 * @returns Manual scraper API endpoint path.
 */
export function buildScraperEndpoint(target: AutomationScrapeTarget): string {
  if (!isAutomationJobScrapeTarget(target)) {
    return API_ENDPOINTS.scraperStudios;
  }

  return buildScraperJobsEndpoint(automationScrapeTargetToPortalId(target));
}

/**
 * Builds the cover-letter export endpoint for a cover-letter identifier.
 *
 * @param coverLetterId Cover-letter identifier.
 * @returns Cover-letter export endpoint path.
 */
export function buildCoverLetterExportEndpoint(coverLetterId: string): string {
  return `${API_ENDPOINTS.coverLetters}/${encodeURIComponent(coverLetterId.trim())}/export`;
}

/**
 * Builds the cover-letter detail endpoint for a cover-letter identifier.
 *
 * @param coverLetterId Cover-letter identifier.
 * @returns Canonical cover-letter detail endpoint path.
 */
export function buildCoverLetterDetailEndpoint(coverLetterId: string): string {
  return `${API_ENDPOINTS.coverLetters}/${encodeURIComponent(coverLetterId.trim())}`;
}

/**
 * Canonical WebSocket endpoints used by real-time UI flows.
 */
export const WS_ENDPOINTS = {
  chat: `${API_ENDPOINT_PREFIX}/ws/chat`,
  automation: `${API_ENDPOINT_PREFIX}/ws/automation`,
  interview: `${API_ENDPOINT_PREFIX}/ws/interview`,
} as const;

/**
 * Converts an absolute API endpoint path into an Elysia route path scoped by app prefix.
 *
 * @param endpointPath Absolute API endpoint path.
 * @returns Prefix-stripped endpoint path for Elysia route registration.
 */
export function toApiScopedPath(endpointPath: string): string {
  if (endpointPath === API_ENDPOINT_PREFIX) {
    return "/";
  }
  if (!endpointPath.startsWith(API_ENDPOINT_PREFIX)) {
    return endpointPath;
  }
  return endpointPath.slice(API_ENDPOINT_PREFIX.length) || "/";
}

/**
 * Converts an absolute API endpoint into a child route path beneath a base endpoint.
 *
 * @param baseEndpointPath Absolute base API endpoint path.
 * @param endpointPath Absolute API endpoint path nested below the base.
 * @returns Child route path suitable for route registration within a prefixed module.
 */
export function toApiChildPath(baseEndpointPath: string, endpointPath: string): string {
  const scopedBasePath = toApiScopedPath(baseEndpointPath);
  const scopedEndpointPath = toApiScopedPath(endpointPath);
  if (scopedEndpointPath === scopedBasePath) {
    return "/";
  }
  if (!scopedEndpointPath.startsWith(`${scopedBasePath}/`)) {
    return scopedEndpointPath;
  }
  return scopedEndpointPath.slice(scopedBasePath.length) || "/";
}

/**
 * Builds an automation run detail API endpoint.
 *
 * @param runId Automation run identifier.
 * @returns Canonical API endpoint for a single automation run.
 */
export function buildAutomationRunEndpoint(runId: string): string {
  return `${API_ENDPOINTS.automationRuns}/${encodeURIComponent(runId.trim())}`;
}

/**
 * Builds an automation screenshot API endpoint for a run and screenshot index.
 *
 * @param runId Automation run identifier.
 * @param index Screenshot index.
 * @returns Canonical screenshot API endpoint.
 */
export function buildAutomationScreenshotEndpoint(runId: string, index: number): string {
  return `${API_ENDPOINTS.automationScreenshotsBase}/${encodeURIComponent(runId.trim())}/${index}`;
}

/**
 * Builds the resume detail endpoint for a resume identifier.
 *
 * @param resumeId Resume identifier.
 * @returns Canonical resume detail endpoint path.
 */
export function buildResumeDetailEndpoint(resumeId: string): string {
  return `${API_ENDPOINTS.resumes}/${encodeURIComponent(resumeId.trim())}`;
}

/**
 * Builds the AI-enhance endpoint for a resume identifier.
 *
 * @param resumeId Resume identifier.
 * @returns Canonical resume AI-enhancement endpoint path.
 */
export function buildResumeEnhanceEndpoint(resumeId: string): string {
  return `${buildResumeDetailEndpoint(resumeId)}/ai-enhance`;
}

/**
 * Builds the AI-score endpoint for a resume identifier.
 *
 * @param resumeId Resume identifier.
 * @returns Canonical resume AI-score endpoint path.
 */
export function buildResumeScoreEndpoint(resumeId: string): string {
  return `${buildResumeDetailEndpoint(resumeId)}/ai-score`;
}
