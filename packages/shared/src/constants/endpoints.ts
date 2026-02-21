/**
 * Canonical API prefix used by Nuxt client calls and Elysia server routes.
 */
export const API_ENDPOINT_PREFIX = "/api";

/**
 * Canonical HTTP endpoints consumed by client-side data and mutation flows.
 */
export const API_ENDPOINTS = {
  health: `${API_ENDPOINT_PREFIX}/health`,
  aiChat: `${API_ENDPOINT_PREFIX}/ai/chat`,
  scraperStudios: `${API_ENDPOINT_PREFIX}/scraper/studios`,
  scraperJobsGamedev: `${API_ENDPOINT_PREFIX}/scraper/jobs/gamedev`,
  resumes: `${API_ENDPOINT_PREFIX}/resumes`,
  resumesFromQuestionsGenerate: `${API_ENDPOINT_PREFIX}/resumes/from-questions/generate`,
  resumesFromQuestionsSynthesize: `${API_ENDPOINT_PREFIX}/resumes/from-questions/synthesize`,
  coverLetters: `${API_ENDPOINT_PREFIX}/cover-letters`,
  automationJobApply: `${API_ENDPOINT_PREFIX}/automation/job-apply`,
  automationJobApplySchedule: `${API_ENDPOINT_PREFIX}/automation/job-apply/schedule`,
  automationEmailResponse: `${API_ENDPOINT_PREFIX}/automation/email-response`,
  automationRuns: `${API_ENDPOINT_PREFIX}/automation/runs`,
  automationScreenshotsBase: `${API_ENDPOINT_PREFIX}/automation/screenshots`,
} as const;

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
