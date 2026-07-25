/**
 * Navigation IA gate (contract-escalation-ia-2026-07-24):
 * - every sidebar item has groupId in NAVIGATION_GROUP_IDS
 * - dock ids match DOCK_NAVIGATION_IDS
 * - AppSidebar must not render always-on <kbd> shortcut chrome
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DOCK_NAVIGATION_IDS,
  getDockNavigationItems,
  NAVIGATION_GROUP_IDS,
  NAVIGATION_ITEMS,
} from "../packages/client/constants/navigation";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const SIDEBAR_PATH = "packages/client/components/layout/AppSidebar.vue";
const SIDEBAR_KBD_PATTERN = /<kbd\b/u;

export const collectNavIaViolations = (sidebarSource: string): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];

  for (const item of NAVIGATION_ITEMS) {
    if (!item.includeInSidebar) {
      continue;
    }
    if (!(NAVIGATION_GROUP_IDS as readonly string[]).includes(item.groupId)) {
      violations.push({
        filePath: "packages/client/constants/navigation.ts",
        line: 1,
        message: `Sidebar item "${item.id}" missing/invalid groupId`,
      });
    }
  }

  const dockIds = getDockNavigationItems().map((item) => item.id);
  if (JSON.stringify(dockIds) !== JSON.stringify([...DOCK_NAVIGATION_IDS])) {
    violations.push({
      filePath: "packages/client/constants/navigation.ts",
      line: 1,
      message: `Dock ids drift from DOCK_NAVIGATION_IDS (got ${dockIds.join(",")})`,
    });
  }

  if (SIDEBAR_KBD_PATTERN.test(sidebarSource)) {
    violations.push({
      filePath: SIDEBAR_PATH,
      line: 1,
      message: "AppSidebar must not render always-on <kbd> shortcut chrome (palette/tooltip only).",
    });
  }

  return violations;
};

const main = async (): Promise<void> => {
  const sidebarSource = await readFile(join(process.cwd(), SIDEBAR_PATH), "utf8");
  await reportViolations(
    "Navigation IA validation failed:",
    collectNavIaViolations(sidebarSource),
    "Navigation IA validation passed.",
  );
};

if (import.meta.main) {
  await main();
}
