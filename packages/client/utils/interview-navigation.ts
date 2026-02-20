import { APP_ROUTES, APP_ROUTE_QUERY_KEYS } from "@bao/shared";
import type { RouteLocationRaw } from "vue-router";

/**
 * Supported source identifiers for job-driven interview navigation.
 */
export const INTERVIEW_NAVIGATION_SOURCE_IDS = ["jobs", "jobs-list", "scraper"] as const;

/**
 * Source identifier for interview navigation tracking.
 */
export type InterviewNavigationSource = (typeof INTERVIEW_NAVIGATION_SOURCE_IDS)[number];

/**
 * Builds a typed route location for launching a job-based interview session.
 *
 * @param jobId Job identifier.
 * @param source Source surface launching the interview.
 * @returns Route location object for Vue Router.
 */
export function buildInterviewJobNavigation(
  jobId: string,
  source: InterviewNavigationSource,
): RouteLocationRaw {
  return {
    path: APP_ROUTES.interview,
    query: {
      [APP_ROUTE_QUERY_KEYS.mode]: "job",
      [APP_ROUTE_QUERY_KEYS.jobId]: jobId,
      [APP_ROUTE_QUERY_KEYS.source]: source,
    },
  };
}

/**
 * Builds a typed route location for launching a studio-based interview session.
 *
 * @param studioId Studio identifier.
 * @returns Route location object for Vue Router.
 */
export function buildInterviewStudioNavigation(studioId: string): RouteLocationRaw {
  return {
    path: APP_ROUTES.interview,
    query: {
      [APP_ROUTE_QUERY_KEYS.studioId]: studioId,
    },
  };
}
