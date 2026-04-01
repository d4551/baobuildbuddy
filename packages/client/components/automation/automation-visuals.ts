import type {
  AutomationScrapeTarget,
  RpaCapabilityAuditEntry,
} from "@bao/shared/constants/automation";
import type { AppIconName } from "~/components/icons/icon-registry";

export type AutomationVisualIconName = AppIconName;

export interface AutomationCoverageItem {
  readonly id: "manual" | "scheduled" | "history" | "live";
  readonly iconName: AutomationVisualIconName;
  readonly labelKey: string;
}

export const AUTOMATION_COVERAGE_ITEMS = [
  {
    id: "manual",
    iconName: "IconBolt",
    labelKey: "automation.hub.audit.coverage.manual",
  },
  {
    id: "scheduled",
    iconName: "IconRefresh",
    labelKey: "automation.hub.audit.coverage.scheduled",
  },
  {
    id: "history",
    iconName: "IconDocumentText",
    labelKey: "automation.hub.audit.coverage.history",
  },
  {
    id: "live",
    iconName: "IconGlobe",
    labelKey: "automation.hub.audit.coverage.live",
  },
] as const satisfies readonly AutomationCoverageItem[];

export const SCRAPE_TARGET_ICON_NAMES: Record<AutomationScrapeTarget, AutomationVisualIconName> = {
  studios: "IconGlobe",
  jobs_hitmarker: "IconSearch",
  jobs_grackle: "IconSearch",
  jobs_workwithindies: "IconSearch",
  jobs_remotegamejobs: "IconSearch",
  jobs_gamesjobsdirect: "IconSearch",
  jobs_pocketgamer: "IconSearch",
};

export function resolveAutomationCapabilityIconName(
  capability: Pick<RpaCapabilityAuditEntry, "category" | "target">,
): AutomationVisualIconName {
  if (capability.category === "job_apply") {
    return "IconBolt";
  }

  if (capability.target) {
    return SCRAPE_TARGET_ICON_NAMES[capability.target];
  }

  return "IconSearch";
}
