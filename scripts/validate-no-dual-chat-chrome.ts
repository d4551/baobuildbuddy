import { readFile } from "node:fs/promises";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

const AI_CHAT_DOCK_ID_THEN_FLAG_PATTERN = /id:\s*["']ai-chat["'][\s\S]*?includeInDock:\s*true/u;
const AI_CHAT_DOCK_FLAG_THEN_ID_PATTERN = /includeInDock:\s*true[\s\S]*?id:\s*["']ai-chat["']/u;

/**
 * Dual-chat chrome gate: when mobile dock owns AI Chat, floating chat must be
 * gated to desktop (isDesktopViewport) and never on /ai/*.
 * Catches papered-over dual primary destinations.
 */
export const collectDualChatChromeViolations = async (): Promise<ValidationViolation[]> => {
  const violations: ValidationViolation[] = [];
  const layoutPath = "packages/client/layouts/default.vue";
  const navPath = "packages/client/constants/navigation.ts";
  const [layout, nav] = await Promise.all([
    readFile(layoutPath, "utf8"),
    readFile(navPath, "utf8"),
  ]);

  const dockHasAiChat =
    AI_CHAT_DOCK_ID_THEN_FLAG_PATTERN.test(nav) || AI_CHAT_DOCK_FLAG_THEN_ID_PATTERN.test(nav);

  if (!dockHasAiChat) {
    return violations;
  }

  if (!layout.includes("FloatingChatWidget") && !layout.includes("LazyFloatingChatWidget")) {
    return violations;
  }

  if (!layout.includes("isDesktopViewport")) {
    violations.push({
      filePath: layoutPath,
      line: 1,
      message:
        "Dock includes ai-chat but floating chat is not gated on isDesktopViewport — dual chat chrome below lg.",
    });
  }

  if (!layout.includes("APP_ROUTES.ai") && !layout.includes("AI_CHAT_PAGE_PATH")) {
    violations.push({
      filePath: layoutPath,
      line: 1,
      message: "Floating chat must hide on APP_ROUTES.ai (and children) when dock owns AI Chat.",
    });
  }

  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Dual chat chrome validation failed:",
    await collectDualChatChromeViolations(),
    "Dual chat chrome validation passed.",
  );
}
