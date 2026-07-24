import type { RpaCapabilityAuditEntry, RpaCapabilityIssue } from "@bao/shared/constants/automation";
import { APP_ROUTE_BUILDERS, APP_ROUTES } from "@bao/shared/constants/routes";

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface AutomationCapabilityAction {
  readonly to: string;
  readonly label: string;
  readonly ariaLabel: string;
}

const JOB_PROVIDER_SETTINGS_ROUTE = APP_ROUTE_BUILDERS.settingsSection("jobIntelligence");

function resolveCapabilityIssueLabel(issue: RpaCapabilityIssue, t: Translate): string {
  if (issue.code === "provider_settings_unavailable") {
    return t("automation.hub.audit.issues.providerSettingsUnavailable");
  }
  if (issue.code === "portal_configuration_missing") {
    return t("automation.hub.audit.issues.portalConfigurationMissing", {
      portalId: issue.portalId ?? "",
    });
  }
  if (issue.code === "portal_disabled") {
    return t("automation.hub.audit.issues.portalDisabled", {
      portalName: issue.portalName ?? issue.portalId ?? "",
    });
  }
  return t("automation.hub.audit.issues.portalFallbackUrlMissing", {
    portalName: issue.portalName ?? issue.portalId ?? "",
  });
}

export function resolveAutomationCapabilityDisplayName(
  capability: Pick<RpaCapabilityAuditEntry, "id" | "name">,
  t: Translate,
): string {
  if (capability.id === "job_apply") {
    return t("automation.hub.audit.capabilities.jobApply");
  }
  if (capability.id === "scrape_studios") {
    return t("automation.hub.audit.capabilities.studios");
  }
  return capability.name;
}

/**
 * Normalizes structured capability issues into localized UI copy.
 */
export function resolveAutomationCapabilityIssues(
  capability: Pick<RpaCapabilityAuditEntry, "issues">,
  t: Translate,
): string[] {
  return capability.issues.map((issue) => resolveCapabilityIssueLabel(issue, t));
}

export function resolveAutomationCapabilityAction(
  capability: Pick<RpaCapabilityAuditEntry, "category" | "issues">,
  t: Translate,
): AutomationCapabilityAction {
  if (capability.issues.length > 0 && capability.category === "scrape") {
    return {
      to: JOB_PROVIDER_SETTINGS_ROUTE,
      label: t("automation.hub.audit.actions.fixSetup"),
      ariaLabel: t("automation.hub.audit.actions.fixSetupAria"),
    };
  }

  if (capability.category === "job_apply") {
    return {
      to: APP_ROUTES.automationJobApply,
      label: t("automation.hub.audit.actions.openJobApply"),
      ariaLabel: t("automation.hub.audit.actions.openJobApplyAria"),
    };
  }

  return {
    to: APP_ROUTES.automationScraper,
    label: t("automation.hub.audit.actions.openScraper"),
    ariaLabel: t("automation.hub.audit.actions.openScraperAria"),
  };
}
