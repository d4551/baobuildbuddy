/**
 * Fail catalog EmptyState mounts that omit a primary CTA.
 * Softening ban: list emptiness must offer a next action (cta-label-key).
 * Scoped to pages + list panels — chat/prompt empties may omit CTA.
 */
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client/pages", "packages/client/components"] as const;
const sourceExtensions = [".vue"] as const;

const EMPTY_STATE_BLOCK_PATTERN = /<EmptyState\b[\s\S]*?(?:\/>|<\/EmptyState>)/gu;
const CTA_PATTERN = /cta-label-key\s*=/u;
const CATALOG_TITLE_PATTERN =
  /title-key="[^"]*(emptyStateTitle|emptyTitle|notFoundTitle|emptyState\.title)[^"]*"/u;
const EMPTY_CATALOG_TITLE_PATTERN = /emptyCatalogTitle/u;

const SKIP_FILES = [
  "packages/client/components/layout/WorkspaceOmniSearch.vue",
  "packages/client/components/ai/AIChatConversationPanel.vue",
  "packages/client/components/ai/FloatingChatPanel.vue",
  "packages/client/components/interview/InterviewHistoryDetailCard.vue",
  "packages/client/components/skills/SkillsPageInsights.vue",
  "packages/client/components/automation/AutomationHubAuditCard.vue",
  "packages/client/components/dashboard/DashboardOnboardingCard.vue",
] as const;

const collectViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (SKIP_FILES.some((allowed) => filePath.endsWith(allowed))) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  for (const match of content.matchAll(EMPTY_STATE_BLOCK_PATTERN)) {
    const block = match[0] ?? "";
    if (!CATALOG_TITLE_PATTERN.test(block)) {
      continue;
    }
    if (CTA_PATTERN.test(block)) {
      continue;
    }
    // Jobs catalog empty intentionally omits CTA (hero Configure owns primary).
    if (EMPTY_CATALOG_TITLE_PATTERN.test(block)) {
      continue;
    }
    violations.push({
      filePath,
      line: 1,
      message:
        "Catalog EmptyState is missing cta-label-key. Wire a primary next action (cta-to or @cta).",
    });
  }
  return violations;
};

export const collectEmptyStateCtaViolationsForContent = collectViolationsForContent;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: [...sourceExtensions],
  });
  return files.flatMap(({ filePath, content }) => collectViolationsForContent(filePath, content));
};

if (import.meta.main) {
  await reportViolations(
    "Empty-state CTA SSOT",
    await collectViolations(),
    "Wire cta-label-key (+ cta-to or @cta) on every catalog EmptyState.",
  );
}
