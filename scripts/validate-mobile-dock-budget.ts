import {
  getDockNavigationItems,
  MOBILE_DOCK_MAX_ITEMS,
  NAVIGATION_ITEMS,
} from "../packages/client/constants/navigation";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

/**
 * Mobile dock budget gate — Apple HIG primary destinations (3–5).
 * Catches cat-and-mouse growth of includeInDock flags.
 */
export const collectMobileDockBudgetViolations = (): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const flagged = NAVIGATION_ITEMS.filter((item) => item.includeInDock);
  const resolved = getDockNavigationItems();

  if (flagged.length > MOBILE_DOCK_MAX_ITEMS) {
    violations.push({
      filePath: "packages/client/constants/navigation.ts",
      line: 1,
      message: `includeInDock flags ${String(flagged.length)} items (ids: ${flagged
        .map((item) => item.id)
        .join(", ")}); MOBILE_DOCK_MAX_ITEMS=${String(MOBILE_DOCK_MAX_ITEMS)}. Demote secondary destinations (docs/API/chat) out of the dock.`,
    });
  }

  if (resolved.length > MOBILE_DOCK_MAX_ITEMS) {
    violations.push({
      filePath: "packages/client/constants/navigation.ts",
      line: 1,
      message: `getDockNavigationItems() returned ${String(resolved.length)} items; cap is ${String(MOBILE_DOCK_MAX_ITEMS)}.`,
    });
  }

  if (resolved.some((item) => item.id === "apiDocs")) {
    violations.push({
      filePath: "packages/client/constants/navigation.ts",
      line: 1,
      message: `apiDocs must not appear in the mobile dock (secondary chrome belongs in sidebar).`,
    });
  }

  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Mobile dock budget validation failed:",
    collectMobileDockBudgetViolations(),
    "Mobile dock budget validation passed.",
  );
}
