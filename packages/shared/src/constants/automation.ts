import type { GamingPortalId } from "../types/settings";

/**
 * Supported automation run types across API and client surfaces.
 */
export const AUTOMATION_RUN_TYPES = ["scrape", "job_apply", "email"] as const;

/**
 * Supported gaming-portal ids that are backed by RPA scrapers.
 */
export const AUTOMATION_SCRAPE_PORTAL_IDS = [
  "hitmarker",
  "grackle",
  "workwithindies",
  "remotegamejobs",
  "gamesjobsdirect",
  "pocketgamer",
] as const satisfies readonly GamingPortalId[];

/**
 * Union type for supported RPA gaming-portal ids.
 */
export type AutomationScrapePortalId = (typeof AUTOMATION_SCRAPE_PORTAL_IDS)[number];

/**
 * Whether a portal id is a supported scraper-backed gaming portal.
 *
 * @param portalId Portal id under evaluation.
 * @returns `true` when the portal id maps to a supported scraper integration.
 */
export function isAutomationScrapePortalId(portalId: string): portalId is AutomationScrapePortalId {
  return AUTOMATION_SCRAPE_PORTAL_IDS.some((candidatePortalId) => candidatePortalId === portalId);
}

/**
 * Supported job-board scrape targets across API and client surfaces.
 */
export const AUTOMATION_SCRAPE_JOB_TARGETS = [
  "jobs_hitmarker",
  "jobs_grackle",
  "jobs_workwithindies",
  "jobs_remotegamejobs",
  "jobs_gamesjobsdirect",
  "jobs_pocketgamer",
] as const;

/**
 * Supported scheduled scrape targets across API and client surfaces.
 */
export const AUTOMATION_SCRAPE_TARGETS = ["studios", ...AUTOMATION_SCRAPE_JOB_TARGETS] as const;

/**
 * Union type for a job-board scrape target.
 */
export type AutomationJobScrapeTarget = (typeof AUTOMATION_SCRAPE_JOB_TARGETS)[number];

/**
 * Structured metadata for each supported scrape target.
 */
export interface AutomationScrapeTargetDetail {
  /**
   * Stable action emitted in run events and persisted scheduled-run input.
   */
  readonly action: string;
  /**
   * URL segment used by manual scraper endpoints.
   */
  readonly routeSegment: string;
  /**
   * Target category used by UI and audit surfaces.
   */
  readonly kind: "studios" | "jobs";
  /**
   * Backing gaming-portal id for job-board targets.
   */
  readonly portalId?: AutomationScrapePortalId;
}

/**
 * Central target metadata used by routes, services, and UI surfaces.
 */
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
} as const satisfies Record<AutomationScrapeTarget, AutomationScrapeTargetDetail>;

/**
 * Stable audit/report categories for RPA capabilities.
 */
export const RPA_CAPABILITY_CATEGORIES = ["job_apply", "scrape"] as const;

/**
 * Union type for audit/report RPA capability categories.
 */
export type RpaCapabilityCategory = (typeof RPA_CAPABILITY_CATEGORIES)[number];

/**
 * Stable identifiers returned by the RPA capability audit endpoint.
 */
export const RPA_CAPABILITY_IDS = [
  "job_apply",
  "scrape_studios",
  "scrape_jobs_hitmarker",
  "scrape_jobs_grackle",
  "scrape_jobs_workwithindies",
  "scrape_jobs_remotegamejobs",
  "scrape_jobs_gamesjobsdirect",
  "scrape_jobs_pocketgamer",
] as const;

/**
 * Union type for audit/report RPA capability identifiers.
 */
export type RpaCapabilityId = (typeof RPA_CAPABILITY_IDS)[number];

/**
 * Point-in-time audit row for one RPA capability.
 */
export interface RpaCapabilityAuditEntry {
  /**
   * Stable capability id.
   */
  id: RpaCapabilityId;
  /**
   * Capability family shown by audit UIs.
   */
  category: RpaCapabilityCategory;
  /**
   * Human-readable capability name.
   */
  name: string;
  /**
   * Bound scrape target when the capability is scrape-driven.
   */
  target: AutomationScrapeTarget | null;
  /**
   * Whether the implementation exists in the current build.
   */
  implemented: boolean;
  /**
   * Whether the capability is configured to run in the current environment.
   */
  configured: boolean;
  /**
   * Whether the capability is enabled for execution.
   */
  enabled: boolean;
  /**
   * Whether an immediate/manual run is available.
   */
  manualRunAvailable: boolean;
  /**
   * Whether future scheduling is available.
   */
  scheduledRunAvailable: boolean;
  /**
   * Whether automation run history captures executions for the capability.
   */
  runHistoryAvailable: boolean;
  /**
   * Whether live automation events are emitted for the capability.
   */
  liveUpdatesAvailable: boolean;
  /**
   * Audit warnings or missing-configuration notes.
   */
  issues: string[];
}

/**
 * Aggregate counts derived from an RPA capability audit report.
 */
export interface RpaCapabilityAuditSummary {
  /**
   * Total capability rows returned in the report.
   */
  total: number;
  /**
   * Count of configured capabilities.
   */
  configured: number;
  /**
   * Count of capabilities that allow immediate/manual runs.
   */
  manualRunAvailable: number;
  /**
   * Count of capabilities that support scheduled execution.
   */
  scheduledRunAvailable: number;
  /**
   * Count of capabilities captured in automation run history.
   */
  runHistoryAvailable: number;
  /**
   * Count of capabilities that emit live automation events.
   */
  liveUpdatesAvailable: number;
}

/**
 * Full RPA capability audit response contract.
 */
export interface RpaCapabilityAuditReport {
  /**
   * UTC timestamp when the report was generated.
   */
  generatedAt: string;
  /**
   * Aggregate counts for quick dashboards.
   */
  summary: RpaCapabilityAuditSummary;
  /**
   * Detailed capability rows.
   */
  capabilities: RpaCapabilityAuditEntry[];
}

/**
 * Canonical automation run status lifecycle values.
 */
export const AUTOMATION_RUN_STATUSES = ["pending", "running", "success", "error"] as const;

/**
 * Default maximum number of automation runs returned by history endpoints.
 */
export const AUTOMATION_RUN_HISTORY_LIMIT = 50;

/**
 * Maximum length for job application URLs.
 */
export const AUTOMATION_MAX_JOB_URL_LENGTH = 2_048;

/**
 * Maximum length for custom answer keys.
 */
export const AUTOMATION_MAX_CUSTOM_ANSWER_KEY_LENGTH = 120;

/**
 * Maximum length for custom answer values.
 */
export const AUTOMATION_MAX_CUSTOM_ANSWER_VALUE_LENGTH = 2_000;

/**
 * Maximum number of custom answers per job application.
 */
export const AUTOMATION_MAX_CUSTOM_ANSWER_COUNT = 50;

/**
 * Maximum days to retain automation screenshots before cleanup.
 */
export const AUTOMATION_MAX_SCREENSHOT_RETENTION_DAYS = 30;

/**
 * Maximum number of runs to process per cleanup batch.
 */
export const AUTOMATION_CLEANUP_LIMIT = 500;

/**
 * Maximum concurrent automation runs.
 */
export const AUTOMATION_MAX_CONCURRENT_RUNS = 5;

/**
 * Maximum length for AI-generated email response body.
 */
export const AUTOMATION_MAX_EMAIL_MESSAGE_LENGTH = 12_000;

/**
 * Delay before retrying a failed scheduled run (ms).
 */
export const AUTOMATION_SCHEDULE_RETRY_DELAY_MS = 30_000;

/**
 * Maximum lead time for scheduling a run (30 days, ms).
 */
export const AUTOMATION_MAX_SCHEDULE_LEAD_TIME_MS = 30 * 24 * 60 * 60 * 1000;

/** Progress value when run is complete (100%). */
export const AUTOMATION_FINISHED_PROGRESS = 100;

/** Max length for screenshot filenames. */
export const AUTOMATION_MAX_SCREENSHOT_NAME_LENGTH = 96;

/** Max progress steps for run progress tracking. */
export const AUTOMATION_MAX_PROGRESS_STEPS = 10_000;

/** Min length for run IDs. */
export const AUTOMATION_MIN_ID_LENGTH = 8;

/**
 * Union type for an automation run type.
 */
export type AutomationRunType = (typeof AUTOMATION_RUN_TYPES)[number];

/**
 * Union type for a scheduled scrape target.
 */
export type AutomationScrapeTarget = (typeof AUTOMATION_SCRAPE_TARGETS)[number];

/**
 * Union type for an automation run status.
 */
export type AutomationRunStatus = (typeof AUTOMATION_RUN_STATUSES)[number];

/**
 * Whether a scrape target maps to a gaming job-board portal.
 *
 * @param target Scrape target under evaluation.
 * @returns `true` when the target is portal-backed instead of studio ingestion.
 */
export function isAutomationJobScrapeTarget(
  target: AutomationScrapeTarget,
): target is AutomationJobScrapeTarget {
  return target !== "studios";
}

/**
 * Resolve the backing portal id for a job-board scrape target.
 *
 * @param target Supported job-board scrape target.
 * @returns Backing gaming-portal identifier.
 */
export function automationScrapeTargetToPortalId(
  target: AutomationJobScrapeTarget,
): AutomationScrapePortalId {
  return AUTOMATION_SCRAPE_TARGET_DETAILS[target].portalId;
}

/**
 * Resolve the manual route segment for a scrape target.
 *
 * @param target Supported scrape target.
 * @returns Route segment used by `/api/scraper/...`.
 */
export function automationScrapeTargetToRouteSegment(target: AutomationScrapeTarget): string {
  return AUTOMATION_SCRAPE_TARGET_DETAILS[target].routeSegment;
}

/**
 * Resolve the stable action emitted for a scrape target.
 *
 * @param target Supported scrape target.
 * @returns Stable action string for events and scheduled-run input.
 */
export function automationScrapeTargetToAction(target: AutomationScrapeTarget): string {
  return AUTOMATION_SCRAPE_TARGET_DETAILS[target].action;
}

/**
 * Build the audit capability id for a scrape target.
 *
 * @param target Supported scrape target.
 * @returns Stable audit capability identifier.
 */
export function buildRpaCapabilityIdFromScrapeTarget(
  target: AutomationScrapeTarget,
): RpaCapabilityId {
  return target === "studios" ? "scrape_studios" : (`scrape_${target}` as RpaCapabilityId);
}
