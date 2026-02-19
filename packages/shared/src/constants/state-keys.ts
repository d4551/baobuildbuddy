/**
 * Central Nuxt useState key registry.
 * Use these keys in composables to prevent collisions and enable clearNuxtState on logout.
 */

export const STATE_KEYS = {
  // Resume
  RESUME_LIST: "resumes-list",
  RESUME_CURRENT: "resume-current",
  RESUME_LOADING: "resume-loading",

  // Interview
  INTERVIEW_SESSIONS: "interview-sessions",
  INTERVIEW_CURRENT_SESSION: "interview-current-session",
  INTERVIEW_STATS: "interview-stats",
  INTERVIEW_LOADING: "interview-loading",

  // Jobs
  JOBS_LIST: "jobs-list",
  JOBS_SAVED: "jobs-saved",
  JOBS_APPLICATIONS: "jobs-applications",
  JOBS_FILTERS: "jobs-filters",
  JOBS_LOADING: "jobs-loading",
  JOBS_RECOMMENDATIONS: "jobs-recommendations",

  // Studios
  STUDIOS_LIST: "studios-list",
  STUDIO_CURRENT: "studio-current",
  STUDIO_LOADING: "studio-loading",

  // Portfolio
  PORTFOLIO_DATA: "portfolio-data",
  PORTFOLIO_PROJECTS: "portfolio-projects",
  PORTFOLIO_LOADING: "portfolio-loading",

  // Cover letter
  COVERLETTERS_LIST: "coverletters-list",
  COVERLETTER_CURRENT: "coverletter-current",
  COVERLETTER_LOADING: "coverletter-loading",

  // Skills
  SKILLS_MAPPINGS: "skills-mappings",
  SKILLS_PATHWAYS: "skills-pathways",
  SKILLS_READINESS: "skills-readiness",
  SKILLS_LOADING: "skills-loading",

  // AI
  AI_MESSAGES: "ai-messages",
  AI_STREAMING: "ai-streaming",
  AI_LOADING: "ai-loading",

  // User & Auth
  USER_PROFILE: "user-profile",
  USER_LOADING: "user-loading",

  // Settings
  APP_SETTINGS: "app-settings",
  SETTINGS_LOADING: "settings-loading",

  // Theme
  APP_THEME: "app-theme",

  // Search
  SEARCH_QUERY: "search-query",
  SEARCH_RESULTS: "search-results",
  SEARCH_SUGGESTIONS: "search-suggestions",
  SEARCH_LOADING: "search-loading",

  // Gamification
  GAMIFICATION_PROGRESS: "gamification-progress",
  GAMIFICATION_ACHIEVEMENTS: "gamification-achievements",
  GAMIFICATION_CHALLENGES: "gamification-challenges",
  GAMIFICATION_LOADING: "gamification-loading",
  GAMIFICATION_WEEKLY: "gamification-weekly",
  GAMIFICATION_MONTHLY: "gamification-monthly",

  // Statistics
  STATS_DASHBOARD: "stats-dashboard",
  STATS_WEEKLY: "stats-weekly",
  STATS_CAREER: "stats-career",
  STATS_LOADING: "stats-loading",

  // WebSocket
  WS_CONNECTED: "ws-connected",
  WS_LAST_MESSAGE: "ws-last-message",
} as const;

export type StateKey = (typeof STATE_KEYS)[keyof typeof STATE_KEYS];
