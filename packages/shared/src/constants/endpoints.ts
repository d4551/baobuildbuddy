import type { AutomationScrapePortalId } from "./automation-types";

/**
 * OpenAPI/Swagger documentation version.
 */
export const OPENAPI_VERSION = "0.1.0" as const;

/**
 * Canonical API prefix used by Nuxt client calls and Elysia server routes.
 */
export const API_ENDPOINT_PREFIX = "/api";

/**
 * OpenAI Chat Completions public API prefix for external SDK clients.
 * Mounted alongside `/api` (not under it) so `baseURL` can be `http://host:3000/v1`.
 */
export const OPENAI_V1_ENDPOINT_PREFIX = "/v1";

/**
 * OpenAI Chat Completions HTTP endpoints (Chat Completions API surface).
 */
export const OPENAI_V1_ENDPOINTS = {
  models: `${OPENAI_V1_ENDPOINT_PREFIX}/models`,
  chatCompletions: `${OPENAI_V1_ENDPOINT_PREFIX}/chat/completions`,
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
  authRotate: `${API_ENDPOINT_PREFIX}/auth/rotate`,
  authRevoke: `${API_ENDPOINT_PREFIX}/auth/revoke`,
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
  skillPathways: `${API_ENDPOINT_PREFIX}/skills/pathways`,
  skillReadiness: `${API_ENDPOINT_PREFIX}/skills/readiness`,
  skillAiAnalyze: `${API_ENDPOINT_PREFIX}/skills/ai-analyze`,
  interviewBase: `${API_ENDPOINT_PREFIX}/interview`,
  interviewSessions: `${API_ENDPOINT_PREFIX}/interview/sessions`,
  interviewStats: `${API_ENDPOINT_PREFIX}/interview/stats`,
  statsBase: `${API_ENDPOINT_PREFIX}/stats`,
  statsDashboard: `${API_ENDPOINT_PREFIX}/stats/dashboard`,
  statsWeekly: `${API_ENDPOINT_PREFIX}/stats/weekly`,
  statsCareer: `${API_ENDPOINT_PREFIX}/stats/career`,
  gamificationBase: `${API_ENDPOINT_PREFIX}/gamification`,
  gamificationProgress: `${API_ENDPOINT_PREFIX}/gamification/progress`,
  gamificationAwardXp: `${API_ENDPOINT_PREFIX}/gamification/award-xp`,
  gamificationAchievements: `${API_ENDPOINT_PREFIX}/gamification/achievements`,
  gamificationChallenges: `${API_ENDPOINT_PREFIX}/gamification/challenges`,
  gamificationWeekly: `${API_ENDPOINT_PREFIX}/gamification/weekly`,
  gamificationMonthly: `${API_ENDPOINT_PREFIX}/gamification/monthly`,
  aiBase: `${API_ENDPOINT_PREFIX}/ai`,
  aiChat: `${API_ENDPOINT_PREFIX}/ai/chat`,
  aiAnalyzeResume: `${API_ENDPOINT_PREFIX}/ai/analyze-resume`,
  aiGenerateCoverLetter: `${API_ENDPOINT_PREFIX}/ai/generate-cover-letter`,
  aiMatchJobs: `${API_ENDPOINT_PREFIX}/ai/match-jobs`,
  aiModels: `${API_ENDPOINT_PREFIX}/ai/models`,
  aiUsage: `${API_ENDPOINT_PREFIX}/ai/usage`,
  aiAutomationAction: `${API_ENDPOINT_PREFIX}/ai/automation-action`,
  speechBase: `${API_ENDPOINT_PREFIX}/speech`,
  speechTranscribe: `${API_ENDPOINT_PREFIX}/speech/transcribe`,
  speechSynthesize: `${API_ENDPOINT_PREFIX}/speech/synthesize`,
  scraperBase: `${API_ENDPOINT_PREFIX}/scraper`,
  scraperStudios: `${API_ENDPOINT_PREFIX}/scraper/studios`,
  scraperJobsBase: `${API_ENDPOINT_PREFIX}/scraper/jobs`,
  scraperJobsHitmarker: `${API_ENDPOINT_PREFIX}/scraper/jobs/hitmarker`,
  settings: `${API_ENDPOINT_PREFIX}/settings`,
  settingsExport: `${API_ENDPOINT_PREFIX}/settings/export`,
  settingsImport: `${API_ENDPOINT_PREFIX}/settings/import`,
  settingsApiKeys: `${API_ENDPOINT_PREFIX}/settings/api-keys`,
  settingsTestApiKey: `${API_ENDPOINT_PREFIX}/settings/test-api-key`,
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
 * Endpoints the first-run setup wizard must reach before an API key exists.
 *
 * The setup wizard runs on a brand-new instance: `/api/auth/status` reports
 * `bootstrapRequired: true` and there is no credential for the browser to send.
 * Every route behind the auth guard therefore answers 401 during onboarding,
 * which made "Test Local Endpoint" unusable on the very first screen.
 *
 * This is an explicit, method-scoped allowlist — not a blanket bypass. The
 * server only honours it while no API key hash exists in the database; the
 * moment the instance is bootstrapped the grace closes permanently. Keep the
 * list minimal: an entry here is reachable unauthenticated on a fresh install.
 */
export const SETUP_PREBOOTSTRAP_ENDPOINTS = [
  { method: "POST", path: `${API_ENDPOINT_PREFIX}/settings/test-api-key` },
] as const;

/**
 * Reports whether a method/path pair is part of the first-run setup allowlist.
 *
 * @param method HTTP method of the incoming request.
 * @param pathname Request pathname without query string.
 * @returns True when the pair is allowlisted for pre-bootstrap access.
 */
export function isSetupPreBootstrapEndpoint(method: string, pathname: string): boolean {
  const normalizedMethod = method.toUpperCase();
  return SETUP_PREBOOTSTRAP_ENDPOINTS.some(
    (entry) => entry.method === normalizedMethod && entry.path === pathname,
  );
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
