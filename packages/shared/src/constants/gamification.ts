/**
 * Canonical pipeline actions that can award gamification XP.
 */
export const PIPELINE_GAMIFICATION_ACTIONS = [
  "jobSearch",
  "scraperStudios",
  "scraperJobs",
  "resumeSave",
  "resumeEnhance",
] as const;

/**
 * Pipeline gamification action union.
 */
export type PipelineGamificationAction = (typeof PIPELINE_GAMIFICATION_ACTIONS)[number];

/**
 * XP amounts for each pipeline action.
 */
export const PIPELINE_GAMIFICATION_XP = {
  jobSearch: 15,
  scraperStudios: 20,
  scraperJobs: 25,
  resumeSave: 20,
  resumeEnhance: 35,
} as const satisfies Record<PipelineGamificationAction, number>;

/**
 * Canonical reason strings emitted for XP awards.
 */
export const PIPELINE_GAMIFICATION_REASONS = {
  jobSearch: "pipeline_job_search",
  scraperStudios: "pipeline_scraper_studios",
  scraperJobs: "pipeline_scraper_jobs",
  resumeSave: "pipeline_resume_save",
  resumeEnhance: "pipeline_resume_enhance",
} as const satisfies Record<PipelineGamificationAction, string>;

/**
 * Pipeline gamification reason union.
 */
export type PipelineGamificationReason =
  (typeof PIPELINE_GAMIFICATION_REASONS)[PipelineGamificationAction];
