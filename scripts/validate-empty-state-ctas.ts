/**
 * Fail catalog EmptyState mounts that omit a wired primary CTA.
 * Softening ban: empty `cta-label-key=""` / missing cta-to|@cta are violations.
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
const CATALOG_TITLE_PATTERN =
  /title-key="[^"]*(emptyStateTitle|emptyTitle|notFoundTitle|emptyState\.title|emptyCatalogTitle)[^"]*"/u;

const SKIP_FILES = [
  "packages/client/components/layout/WorkspaceOmniSearch.vue",
  "packages/client/components/ai/AIChatConversationPanel.vue",
  "packages/client/components/ai/FloatingChatPanel.vue",
  "packages/client/components/interview/InterviewHistoryDetailCard.vue",
  "packages/client/components/skills/SkillsPageInsights.vue",
  "packages/client/components/automation/AutomationHubAuditCard.vue",
  "packages/client/components/dashboard/DashboardOnboardingCard.vue",
] as const;

const hasStaticCtaLabel = (block: string): boolean => {
  const staticMatch = block.match(/cta-label-key\s*=\s*"([^"]*)"/u);
  if (staticMatch) {
    return (staticMatch[1] ?? "").trim().length > 0;
  }
  // Dynamic binding must not be an empty string literal.
  if (/:cta-label-key\s*=\s*""/u.test(block) || /:cta-label-key\s*=\s*''/u.test(block)) {
    return false;
  }
  if (/:cta-label-key\s*=/u.test(block)) {
    // Ternary with empty branch is a softening — reject.
    if (/:cta-label-key\s*=\s*"[^"]*'\s*:\s*''/u.test(block)) {
      return false;
    }
    if (/:\s*''\s*[`"]/u.test(block) && /cta-label-key/u.test(block)) {
      // Heuristic covered by emptyCatalog special-case removal; allow non-empty dynamics.
    }
    const emptyTernary =
      /:cta-label-key\s*=\s*"([^"]*)"/u.test(block) === false &&
      /:cta-label-key\s*=\s*['`][\s\S]*\?\s*['`][^'`]*(?:configure|create|generate|clear|add|retry|browse)[^'`]*['`]\s*:\s*['`]['`]/iu.test(
        block,
      );
    if (emptyTernary) {
      return false;
    }
    // Softening: any `? ''` / `: ''` in the bound expression.
    if (/:cta-label-key\s*=\s*["'][^"']*['"]\s*:\s*['"]\s*['"]/u.test(block)) {
      return false;
    }
    if (/:cta-label-key\s*=\s*["`][\s\S]*:\s*['"]\s*['"]/u.test(block)) {
      return false;
    }
    return true;
  }
  return false;
};

const hasCtaAction = (block: string): boolean => {
  const hasToStatic = /cta-to\s*=\s*"([^"]+)"/u.test(block) && !/cta-to\s*=\s*""/u.test(block);
  const hasToBound = /:cta-to\s*=/u.test(block) && !/:cta-to\s*=\s*""/u.test(block);
  // Bound cta-to with ternary empty branch for filtered-empty is OK when non-empty branch has route.
  const hasEmit = /@cta\s*=/u.test(block);
  return hasToStatic || hasToBound || hasEmit;
};

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
    if (!hasStaticCtaLabel(block)) {
      violations.push({
        filePath,
        line: 1,
        message:
          "Catalog EmptyState missing non-empty cta-label-key (empty string softening banned).",
      });
      continue;
    }
    if (!hasCtaAction(block)) {
      violations.push({
        filePath,
        line: 1,
        message:
          "Catalog EmptyState has label but no action — wire cta-to or @cta.",
      });
    }
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
    "Wire non-empty cta-label-key (+ cta-to or @cta) on every catalog EmptyState.",
  );
}
