/**
 * Automation type-only contracts and lightweight type guards.
 *
 * Extracted from `automation.ts` to break the circular dependency:
 *   automation.ts → settings.ts → settings-defaults.ts → ai.ts → ai-chat.ts → endpoints.ts → automation.ts
 *
 * `endpoints.ts` needs `AutomationScrapeTarget`, `AutomationJobScrapeTarget`,
 * `isAutomationJobScrapeTarget`, and `automationScrapeTargetToPortalId` to build
 * scrape endpoint URLs at the route-constant layer. Moving these to a lightweight
 * module that imports nothing but `../types/settings` breaks the cycle.
 */

import type { GamingPortalId } from "../types/settings";

// ── Types ──────────────────────────────────────────────────────────────

export const AUTOMATION_SCRAPE_PORTAL_IDS = [
  "hitmarker",
  "grackle",
  "workwithindies",
  "remotegamejobs",
  "gamesjobsdirect",
  "pocketgamer",
] as const satisfies readonly GamingPortalId[];

export type AutomationScrapePortalId = (typeof AUTOMATION_SCRAPE_PORTAL_IDS)[number];

export const AUTOMATION_SCRAPE_JOB_TARGETS = [
  "jobs_hitmarker",
  "jobs_grackle",
  "jobs_workwithindies",
  "jobs_remotegamejobs",
  "jobs_gamesjobsdirect",
  "jobs_pocketgamer",
] as const;

export const AUTOMATION_SCRAPE_TARGETS = ["studios", ...AUTOMATION_SCRAPE_JOB_TARGETS] as const;

export type AutomationJobScrapeTarget = (typeof AUTOMATION_SCRAPE_JOB_TARGETS)[number];
export type AutomationScrapeTarget = (typeof AUTOMATION_SCRAPE_TARGETS)[number];

// ── Target detail map ──────────────────────────────────────────────────

export const AUTOMATION_SCRAPE_TARGET_DETAILS = {
  studios: {
    action: "scrape_studios",
    routeSegment: "studios",
    kind: "studios",
  },
  jobs_hitmarker: {
    action: "scrape_jobs_hitmarker",
    routeSegment: "hitmarker",
    kind: "jobs",
    portalId: "hitmarker",
  },
  jobs_grackle: {
    action: "scrape_jobs_grackle",
    routeSegment: "grackle",
    kind: "jobs",
    portalId: "grackle",
  },
  jobs_workwithindies: {
    action: "scrape_jobs_workwithindies",
    routeSegment: "workwithindies",
    kind: "jobs",
    portalId: "workwithindies",
  },
  jobs_remotegamejobs: {
    action: "scrape_jobs_remotegamejobs",
    routeSegment: "remotegamejobs",
    kind: "jobs",
    portalId: "remotegamejobs",
  },
  jobs_gamesjobsdirect: {
    action: "scrape_jobs_gamesjobsdirect",
    routeSegment: "gamesjobsdirect",
    kind: "jobs",
    portalId: "gamesjobsdirect",
  },
  jobs_pocketgamer: {
    action: "scrape_jobs_pocketgamer",
    routeSegment: "pocketgamer",
    kind: "jobs",
    portalId: "pocketgamer",
  },
} as const satisfies Record<
  AutomationScrapeTarget,
  {
    readonly action: string;
    readonly routeSegment: string;
    readonly kind: "studios" | "jobs";
    readonly portalId?: AutomationScrapePortalId;
  }
>;

// ── Type guards and mappers ────────────────────────────────────────────

export function isAutomationJobScrapeTarget(
  target: AutomationScrapeTarget,
): target is AutomationJobScrapeTarget {
  return target !== "studios";
}

export function automationScrapeTargetToPortalId(
  target: AutomationJobScrapeTarget,
): AutomationScrapePortalId {
  return AUTOMATION_SCRAPE_TARGET_DETAILS[target].portalId;
}

/** Whether a portal id is a supported scraper-backed gaming portal. */
export function isAutomationScrapePortalId(portalId: string): portalId is AutomationScrapePortalId {
  return AUTOMATION_SCRAPE_PORTAL_IDS.some((candidatePortalId) => candidatePortalId === portalId);
}
