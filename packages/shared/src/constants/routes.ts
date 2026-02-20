/**
 * Canonical route paths used throughout the application shell.
 * Keeping this registry centralized prevents route literal drift.
 */
export const APP_ROUTES = {
  dashboard: "/",
  jobs: "/jobs",
  resume: "/resume",
  resumeBuild: "/resume/build",
  coverLetter: "/cover-letter",
  portfolio: "/portfolio",
  portfolioPreview: "/portfolio/preview",
  interview: "/interview",
  interviewHistory: "/interview/history",
  interviewSession: "/interview/session",
  skills: "/skills",
  skillsPathways: "/skills/pathways",
  studios: "/studios",
  aiChat: "/ai/chat",
  automation: "/automation",
  automationJobApply: "/automation/job-apply",
  automationScraper: "/automation/scraper",
  automationEmail: "/automation/email",
  automationRuns: "/automation/runs",
  gamification: "/gamification",
  settings: "/settings",
  setup: "/setup",
} as const;

/**
 * Canonical query-string keys for route-driven workflows.
 */
export const APP_ROUTE_QUERY_KEYS = {
  id: "id",
  sessionId: "session",
  jobId: "job",
  resumeId: "resumeId",
  studioId: "studio",
  mode: "mode",
  source: "source",
} as const;

/**
 * Encodes a route parameter segment for safe path composition.
 *
 * @param value Raw route parameter value.
 * @returns URL-safe path segment.
 */
function encodeRouteParam(value: string): string {
  return encodeURIComponent(value.trim());
}

/**
 * Typed route builders for parameterized pages and route-query shortcuts.
 * Keeps detail-route generation centralized to avoid path literal drift.
 */
export const APP_ROUTE_BUILDERS = {
  /**
   * Builds a job detail page path.
   *
   * @param jobId Job identifier.
   * @returns Canonical job detail route.
   */
  jobDetail(jobId: string): string {
    return `${APP_ROUTES.jobs}/${encodeRouteParam(jobId)}`;
  },
  /**
   * Builds a studio detail page path.
   *
   * @param studioId Studio identifier.
   * @returns Canonical studio detail route.
   */
  studioDetail(studioId: string): string {
    return `${APP_ROUTES.studios}/${encodeRouteParam(studioId)}`;
  },
  /**
   * Builds a cover-letter detail page path.
   *
   * @param coverLetterId Cover-letter identifier.
   * @returns Canonical cover-letter detail route.
   */
  coverLetterDetail(coverLetterId: string): string {
    return `${APP_ROUTES.coverLetter}/${encodeRouteParam(coverLetterId)}`;
  },
  /**
   * Builds an automation run detail page path.
   *
   * @param runId Automation run identifier.
   * @returns Canonical automation-run detail route.
   */
  automationRunDetail(runId: string): string {
    return `${APP_ROUTES.automationRuns}/${encodeRouteParam(runId)}`;
  },
  /**
   * Builds the resume editor route with selected resume id query.
   *
   * @param resumeId Resume identifier.
   * @returns Canonical resume editor route with query.
   */
  resumeEditor(resumeId: string): string {
    return `${APP_ROUTES.resume}?${APP_ROUTE_QUERY_KEYS.id}=${encodeRouteParam(resumeId)}`;
  },
} as const;
