import type {
  RpaCapabilityAuditEntry,
  RpaCapabilityAuditReport,
  RpaCapabilityAuditSummary,
} from "@bao/shared";
import {
  AUTOMATION_SCRAPE_JOB_TARGETS,
  automationScrapeTargetToPortalId,
  buildRpaCapabilityIdFromScrapeTarget,
  toErrorMessage,
  settle,
} from "@bao/shared";
import { loadJobProviderSettings } from "../jobs/providers/provider-settings";

interface ScrapePortalAuditConfig {
  name: string;
  enabled: boolean;
  fallbackUrl: string;
}

interface ScrapePortalAuditSnapshot {
  portalConfigById: Map<string, ScrapePortalAuditConfig>;
  sharedSettingsIssue: string | null;
}

const createJobApplyCapabilityAuditEntry = (): RpaCapabilityAuditEntry => ({
  id: "job_apply",
  category: "job_apply",
  name: "Job Apply",
  target: null,
  implemented: true,
  configured: true,
  enabled: true,
  manualRunAvailable: true,
  scheduledRunAvailable: true,
  runHistoryAvailable: true,
  liveUpdatesAvailable: true,
  issues: [],
});

const createStudioScrapeCapabilityAuditEntry = (): RpaCapabilityAuditEntry => ({
  id: buildRpaCapabilityIdFromScrapeTarget("studios"),
  category: "scrape",
  name: "Studios",
  target: "studios",
  implemented: true,
  configured: true,
  enabled: true,
  manualRunAvailable: true,
  scheduledRunAvailable: true,
  runHistoryAvailable: true,
  liveUpdatesAvailable: true,
  issues: [],
});

const summarizeRpaCapabilities = (
  capabilities: readonly RpaCapabilityAuditEntry[],
): RpaCapabilityAuditSummary =>
  capabilities.reduce<RpaCapabilityAuditSummary>(
    (accumulator, capability) => ({
      total: accumulator.total + 1,
      configured: accumulator.configured + (capability.configured ? 1 : 0),
      manualRunAvailable: accumulator.manualRunAvailable + (capability.manualRunAvailable ? 1 : 0),
      scheduledRunAvailable:
        accumulator.scheduledRunAvailable + (capability.scheduledRunAvailable ? 1 : 0),
      runHistoryAvailable:
        accumulator.runHistoryAvailable + (capability.runHistoryAvailable ? 1 : 0),
      liveUpdatesAvailable:
        accumulator.liveUpdatesAvailable + (capability.liveUpdatesAvailable ? 1 : 0),
    }),
    {
      total: 0,
      configured: 0,
      manualRunAvailable: 0,
      scheduledRunAvailable: 0,
      runHistoryAvailable: 0,
      liveUpdatesAvailable: 0,
    },
  );

const loadScrapePortalAuditSnapshot = async (): Promise<ScrapePortalAuditSnapshot> => {
  const providerSettingsResult = await settle(loadJobProviderSettings());
  const portalConfigById = new Map<string, ScrapePortalAuditConfig>();
  const sharedSettingsIssue =
    providerSettingsResult.status === "rejected"
      ? toErrorMessage(providerSettingsResult.reason, "Job provider settings are unavailable.")
      : null;

  if (providerSettingsResult.status === "fulfilled") {
    for (const portal of providerSettingsResult.value.gamingPortals) {
      portalConfigById.set(portal.id, {
        name: portal.name,
        enabled: portal.enabled,
        fallbackUrl: portal.fallbackUrl,
      });
    }
  }

  return {
    portalConfigById,
    sharedSettingsIssue,
  };
};

const buildScrapeCapabilityIssues = (
  configuredPortal: ScrapePortalAuditConfig | null,
  portalId: string,
  sharedSettingsIssue: string | null,
): string[] => {
  if (sharedSettingsIssue) {
    return [sharedSettingsIssue];
  }

  if (!configuredPortal) {
    return [`Missing ${portalId} gaming portal configuration.`];
  }

  const issues: string[] = [];
  if (!configuredPortal.enabled) {
    issues.push(`${configuredPortal.name} is disabled in job provider settings.`);
  }
  if (configuredPortal.fallbackUrl.trim().length === 0) {
    issues.push(`${configuredPortal.name} is missing a fallback URL.`);
  }
  return issues;
};

const buildJobScrapeCapabilityAuditEntry = (
  target: (typeof AUTOMATION_SCRAPE_JOB_TARGETS)[number],
  auditSnapshot: ScrapePortalAuditSnapshot,
): RpaCapabilityAuditEntry => {
  const portalId = automationScrapeTargetToPortalId(target);
  const configuredPortal = auditSnapshot.portalConfigById.get(portalId) ?? null;
  const issues = buildScrapeCapabilityIssues(
    configuredPortal,
    portalId,
    auditSnapshot.sharedSettingsIssue,
  );
  const enabled = configuredPortal?.enabled === true;
  const configured = Boolean(
    configuredPortal?.enabled && configuredPortal.fallbackUrl.trim().length > 0,
  );

  return {
    id: buildRpaCapabilityIdFromScrapeTarget(target),
    category: "scrape",
    name: configuredPortal?.name ?? portalId,
    target,
    implemented: true,
    configured,
    enabled,
    manualRunAvailable: true,
    scheduledRunAvailable: true,
    runHistoryAvailable: true,
    liveUpdatesAvailable: true,
    issues,
  };
};

export const createRpaCapabilityAuditReport = async (): Promise<RpaCapabilityAuditReport> => {
  const auditSnapshot = await loadScrapePortalAuditSnapshot();
  const capabilities: RpaCapabilityAuditEntry[] = [
    createJobApplyCapabilityAuditEntry(),
    createStudioScrapeCapabilityAuditEntry(),
    ...AUTOMATION_SCRAPE_JOB_TARGETS.map((target) =>
      buildJobScrapeCapabilityAuditEntry(target, auditSnapshot),
    ),
  ];

  return {
    generatedAt: new Date().toISOString(),
    summary: summarizeRpaCapabilities(capabilities),
    capabilities,
  };
};
