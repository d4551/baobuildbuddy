import {
  AUTOMATION_SCRAPE_JOB_TARGETS as _ASJT,
  AUTOMATION_SCRAPE_PORTAL_IDS as _ASPI,
  AUTOMATION_SCRAPE_TARGETS as _AST,
  AUTOMATION_SCRAPE_TARGET_DETAILS as _ASTD,
  automationScrapeTargetToPortalId as _asttpi,
  isAutomationJobScrapeTarget as _iajst,
  isAutomationScrapePortalId as _iaspi,
  type AutomationJobScrapeTarget,
  type AutomationScrapePortalId,
  type AutomationScrapeTarget,
} from "./automation-types";

export type { AutomationJobScrapeTarget, AutomationScrapePortalId, AutomationScrapeTarget };

export const AUTOMATION_SCRAPE_JOB_TARGETS = _ASJT;
export const AUTOMATION_SCRAPE_PORTAL_IDS = _ASPI;
export const AUTOMATION_SCRAPE_TARGETS = _AST;
export const AUTOMATION_SCRAPE_TARGET_DETAILS = _ASTD;

export const automationScrapeTargetToPortalId = _asttpi;
export const isAutomationJobScrapeTarget = _iajst;
export const isAutomationScrapePortalId = _iaspi;

/**
 * Supported automation run types across API and client surfaces.
 */
export const AUTOMATION_RUN_TYPES = ["scrape", "job_apply", "email"] as const;

/**
 * Supported gaming-portal ids that are backed by RPA scrapers.
 */
export type AutomationRunType = (typeof AUTOMATION_RUN_TYPES)[number];

// ── Remaining exports (non-cycle) ─────────────────────────────────────

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
 * Stable issue codes emitted by the RPA capability audit.
 */
export const RPA_CAPABILITY_ISSUE_CODES = [
  "provider_settings_unavailable",
  "portal_configuration_missing",
  "portal_disabled",
  "portal_fallback_url_missing",
] as const;

/**
 * Union type for structured RPA capability audit issues.
 */
export type RpaCapabilityIssueCode = (typeof RPA_CAPABILITY_ISSUE_CODES)[number];

/**
 * Structured audit issue payload localized by client surfaces.
 */
export interface RpaCapabilityIssue {
  /**
   * Stable issue identifier.
   */
  code: RpaCapabilityIssueCode;
  /**
   * Related gaming portal id when the issue is portal-specific.
   */
  portalId?: AutomationScrapePortalId;
  /**
   * Resolved portal label from current settings when available.
   */
  portalName?: string;
}

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
  issues: RpaCapabilityIssue[];
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
 * Union type for an automation run status.
 */
export type AutomationRunStatus = (typeof AUTOMATION_RUN_STATUSES)[number];

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
  const capabilityId = target === "studios" ? "scrape_studios" : `scrape_${target}`;
  return capabilityId as RpaCapabilityId;
}
