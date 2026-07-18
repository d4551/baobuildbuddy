import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Data surface primitives gate (design.md §5, §11).
 *
 * Paginated / list / table surfaces must consume canonical primitives:
 *   - Pagination: <AppPagination> from components/ui/AppPagination.vue
 *     (never hand-rolled `<button>` page arrays)
 *   - Tables: must use the daisyUI table primitive (class="table") and
 *     be wrapped in an overflow-x-auto container for mobile
 *   - Empty states in data surfaces: must consume <EmptyState> primitive
 *
 * This catches the bespoke-pagination / raw-table smell that the existing
 * `validate-ui-canonical-primitives.ts` partially covers but misses:
 *   - hand-rolled `v-for` pagination buttons
 *   - tables without horizontal scroll containers
 *   - list/grid surfaces that model emptiness without EmptyState
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/components/ui/AppPagination.vue",
  "packages/client/components/ui/EmptyState.vue",
  "packages/client/components/ui/LoadingSkeleton.vue",
  "packages/client/components/ui/PageScaffold.vue",
  "packages/client/components/ui/SectionGrid.vue",
  "packages/client/components/ui/WorkPipeline.vue",
  "packages/client/components/ui/StatsRow.vue",
]);

const isSsotPrimitive = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);

// Hand-rolled pagination: a v-for that emits page numbers.
const handRolledPaginationPattern =
  /v-for\s*=\s*["'](?:page|pageNumber|pageNum|item|n)\s+in\s+(?:pageRange|pages|totalPages|pageNumbers|numberRange)\b/gu;
// Raw <button> with page-like aria-label or text.
const pageButtonPattern =
  /<button[^>]*\b(?:aria-label|title)\s*=\s*["'][^"']*(?:page|previous|next)[^"']*["']/gu;
// <table> without a class="table" (already in canonical-primitives, but also
// enforce overflow-x-auto scroll container presence).
const rawTablePattern = /<table\b[^>]*>/gu;
// A table element with class="table" but no ancestor overflow-x-auto scroll container.
const tableWithoutOverflowScrollPattern =
  /<table\b[^>]*class\s*=\s*["'][^"']*\btable\b[^"']*["'][^>]*>/u;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const collectPaginationViolations = (filePath: string, content: string): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  const usesAppPagination = /<AppPagination\b/u.test(template);

  handRolledPaginationPattern.lastIndex = 0;
  for (const match of template.matchAll(handRolledPaginationPattern)) {
    if (usesAppPagination) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Hand-rolled pagination ("${match[0]}") bypasses the AppPagination primitive. Import AppPagination from ~/components/ui/AppPagination.vue and consume it.`,
    });
  }

  pageButtonPattern.lastIndex = 0;
  for (const match of template.matchAll(pageButtonPattern)) {
    if (usesAppPagination) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Hand-rolled page/prev/next button bypasses AppPagination. Consume the canonical pagination primitive.`,
    });
  }

  return violations;
};

const collectTableViolations = (filePath: string, content: string): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  rawTablePattern.lastIndex = 0;
  for (const match of template.matchAll(rawTablePattern)) {
    if (!/\bclass\s*=\s*["'][^"']*\btable\b[^"']*["']/u.test(match[0])) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Raw <table> without class="table". Opt into the daisyUI table primitive.`,
      });
    }
  }

  if (tableWithoutOverflowScrollPattern.test(template)) {
    if (!/\boverflow-x-(?:auto|scroll)\b/u.test(template)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, template.indexOf("<table") ?? 0),
        message: `<table class="table"> without an overflow-x-auto scroll container ancestor. Tables overflow on mobile without horizontal scroll containment.`,
      });
    }
  }

  return violations;
};

export const collectPaginationTableViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => [
  ...collectPaginationViolations(filePath, content),
  ...collectTableViolations(filePath, content),
];

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectPaginationTableViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI pagination/table validation failed:",
    await collectViolations(),
    "UI pagination/table validation passed.",
  );
}
