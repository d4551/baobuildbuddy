import {
  APP_ROUTES,
  DASHBOARD_HERO_TEXT_ROTATE_INTERVAL_MS,
  MS_PER_DAY,
  MS_PER_HOUR,
  MS_PER_MINUTE,
} from "@bao/shared";
import type { DashboardOnboardingStep, DashboardStatCard } from "./dashboard-contracts";

/**
 * Progress and dial limits for dashboard gamification visuals.
 */
export const DASHBOARD_GAMIFICATION_PROGRESS_MIN = 0;
export const DASHBOARD_GAMIFICATION_PROGRESS_MAX = 100;
export const DASHBOARD_GAMIFICATION_LEVEL_DIAL_SIZE_REM = 5.5;
export const DASHBOARD_GAMIFICATION_LEVEL_DIAL_THICKNESS_REM = 0.4;

/**
 * Builds a radial dial style object for dashboard-level XP ring rendering.
 */
export function getDashboardGamificationDialStyle(percentage: number): Record<string, string> {
  return {
    "--value": String(percentage),
    "--size": `${DASHBOARD_GAMIFICATION_LEVEL_DIAL_SIZE_REM}rem`,
    "--thickness": `${DASHBOARD_GAMIFICATION_LEVEL_DIAL_THICKNESS_REM}rem`,
  };
}

/**
 * useAsyncData key for SSR dashboard bootstrap.
 */
export const DASHBOARD_ASYNC_DATA_KEY = "dashboard-bootstrap";

/**
 * Maximum number of recent activity entries shown on dashboard.
 */
export const DASHBOARD_RECENT_ACTIVITY_LIMIT = 5;

/**
 * Time conversion constants for relative timestamps.
 */
export const DASHBOARD_TIME_CONSTANTS = {
  millisecondsPerMinute: MS_PER_MINUTE,
  millisecondsPerHour: MS_PER_HOUR,
  millisecondsPerDay: MS_PER_DAY,
  heroTextRotateIntervalMs: DASHBOARD_HERO_TEXT_ROTATE_INTERVAL_MS,
} as const;

/**
 * Suggested onboarding path for first-time dashboard users.
 */
export const DASHBOARD_ONBOARDING_STEPS: readonly DashboardOnboardingStep[] = [
  { id: "profile", labelKey: "dashboard.onboarding.profile", to: APP_ROUTES.settings },
  { id: "aiProvider", labelKey: "dashboard.onboarding.aiProvider", to: APP_ROUTES.settings },
  { id: "resume", labelKey: "dashboard.onboarding.resume", to: APP_ROUTES.resume },
  { id: "jobs", labelKey: "dashboard.onboarding.jobs", to: APP_ROUTES.jobs },
] as const;

/**
 * Shared card configuration for top-level dashboard metrics.
 */
export const DASHBOARD_STAT_CARDS: readonly DashboardStatCard[] = [
  {
    id: "saved-jobs",
    titleKey: "dashboard.stats.savedJobsTitle",
    to: APP_ROUTES.jobs,
    statKey: "savedJobs",
    iconPath:
      "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    accentClass: "text-primary",
    ctaLabelKey: "dashboard.stats.savedJobsCta",
  },
  {
    id: "resumes",
    titleKey: "dashboard.stats.resumesTitle",
    to: APP_ROUTES.resume,
    statKey: "resumeCount",
    iconPath:
      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    accentClass: "text-secondary",
    ctaLabelKey: "dashboard.stats.resumesCta",
  },
  {
    id: "interview-sessions",
    titleKey: "dashboard.stats.interviewSessionsTitle",
    to: APP_ROUTES.interview,
    statKey: "interviewSessionCount",
    iconPath:
      "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    accentClass: "text-accent",
    ctaLabelKey: "dashboard.stats.interviewSessionsCta",
  },
] as const;
