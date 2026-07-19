import {
  AUTOMATION_SCRAPE_JOB_TARGETS,
  type AutomationScrapePortalId,
  automationScrapeTargetToPortalId,
  buildRpaCapabilityIdFromScrapeTarget,
  type RpaCapabilityAuditEntry,
  type RpaCapabilityAuditReport,
  type RpaCapabilityAuditSummary,
  type RpaCapabilityIssue,
} from "@bao/shared/constants/automation";
import { settle } from "@bao/shared/utils/promise";
import { loadJobProviderSettings } from "../jobs/providers/provider-settings";

interface ScrapePortalAuditConfig {
  name: string;
  enabled: boolean;
  fallbackUrl: string;
}

interface ScrapePortalAuditSnapshot {
  portalConfigById: Map<AutomationScrapePortalId, ScrapePortalAuditConfig>;
  sharedSettingsIssue: RpaCapabilityIssue | null;
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
  const portalConfigById = new Map<AutomationScrapePortalId, ScrapePortalAuditConfig>();
  const sharedSettingsIssue =
    providerSettingsResult.status === "rejected"
      ? ({ code: "provider_settings_unavailable" } satisfies RpaCapabilityIssue)
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
  portalId: AutomationScrapePortalId,
  sharedSettingsIssue: RpaCapabilityIssue | null,
): RpaCapabilityIssue[] => {
  if (sharedSettingsIssue) {
    return [sharedSettingsIssue];
  }

  if (!configuredPortal) {
    return [{ code: "portal_configuration_missing", portalId }];
  }

  const issues: RpaCapabilityIssue[] = [];
  if (!configuredPortal.enabled) {
    issues.push({
      code: "portal_disabled",
      portalId,
      portalName: configuredPortal.name,
    });
  }
  if (configuredPortal.fallbackUrl.trim().length === 0) {
    issues.push({
      code: "portal_fallback_url_missing",
      portalId,
      portalName: configuredPortal.name,
    });
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
