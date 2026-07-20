/**
 * Fail EmptyState mounts that omit a wired primary CTA.
 * Softening ban: empty `cta-label-key=""` / missing cta-to|@cta / title-regex escapes.
 * Chat/prompt informational empties stay in SKIP_FILES only when purely instructional.
 */
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client/pages", "packages/client/components"] as const;
const sourceExtensions = [".vue"] as const;

const EMPTY_STATE_BLOCK_PATTERN = /<EmptyState\b[\s\S]*?(?:\/>|<\/EmptyState>)/gu;
const STATIC_CTA_LABEL_PATTERN = /cta-label-key\s*=\s*"([^"]*)"/u;
const BOUND_CTA_LABEL_PATTERN = /:cta-label-key\s*=/u;
const BOUND_EMPTY_CTA_LABEL_PATTERN = /:cta-label-key\s*=\s*["'][\s\S]*?:\s*['"]\s*['"]/u;
const BOUND_EMPTY_CTA_TERNARY_PATTERN = /:cta-label-key\s*=\s*["'][\s\S]*?\?\s*['"]\s*['"]/u;
const STATIC_CTA_TO_PATTERN = /cta-to\s*=\s*"([^"]+)"/u;
const STATIC_EMPTY_CTA_TO_PATTERN = /cta-to\s*=\s*""/u;
const BOUND_CTA_TO_PATTERN = /:cta-to\s*=/u;
const BOUND_EMPTY_CTA_TO_PATTERN = /:cta-to\s*=\s*""/u;
const CTA_EMIT_PATTERN = /@cta\s*=/u;

/** Instructional-only empties (no catalog next action). Keep minimal. */
const SKIP_FILES = [
  "packages/client/components/ai/AIChatConversationPanel.vue",
  "packages/client/components/ai/FloatingChatPanel.vue",
] as const;

const hasStaticCtaLabel = (block: string): boolean => {
  const staticMatch = block.match(STATIC_CTA_LABEL_PATTERN);
  if (staticMatch) {
    return (staticMatch[1] ?? "").trim().length > 0;
  }
  if (!BOUND_CTA_LABEL_PATTERN.test(block)) {
    return false;
  }
  if (BOUND_EMPTY_CTA_LABEL_PATTERN.test(block) || BOUND_EMPTY_CTA_TERNARY_PATTERN.test(block)) {
    return false;
  }
  return true;
};

const hasCtaAction = (block: string): boolean => {
  const hasToStatic = STATIC_CTA_TO_PATTERN.test(block) && !STATIC_EMPTY_CTA_TO_PATTERN.test(block);
  const hasToBound = BOUND_CTA_TO_PATTERN.test(block) && !BOUND_EMPTY_CTA_TO_PATTERN.test(block);
  const hasEmit = CTA_EMIT_PATTERN.test(block);
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
    if (!hasStaticCtaLabel(block)) {
      violations.push({
        filePath,
        line: 1,
        message:
          "EmptyState missing non-empty cta-label-key (empty string / title-regex softening banned).",
      });
      continue;
    }
    if (!hasCtaAction(block)) {
      violations.push({
        filePath,
        line: 1,
        message: "EmptyState has label but no action — wire cta-to or @cta.",
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
    "Wire non-empty cta-label-key (+ cta-to or @cta) on every EmptyState.",
  );
}
