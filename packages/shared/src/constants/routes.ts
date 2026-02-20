/**
 * Canonical route paths used throughout the application shell.
 * Keeping this registry centralized prevents route literal drift.
 */
export const APP_ROUTES = {
  dashboard: "/",
  jobs: "/jobs",
  resume: "/resume",
  coverLetter: "/cover-letter",
  portfolio: "/portfolio",
  interview: "/interview",
  interviewHistory: "/interview/history",
  interviewSession: "/interview/session",
  skills: "/skills",
  studios: "/studios",
  aiChat: "/ai/chat",
  automation: "/automation",
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
