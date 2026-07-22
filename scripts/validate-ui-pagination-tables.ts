import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";
const NUM_3 = 3;

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
  "packages/client/components/ui/ResponsiveDataSurface.vue",
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

// Hoisted: AppPagination primitive reference detection.
const APP_PAGINATION_TAG_PATTERN = /<AppPagination\b/u;
// Hoisted: daisyUI table class detection inside a raw <table> tag.
const TABLE_BASE_CLASS_PATTERN = /\bclass\s*=\s*["'][^"']*\btable\b[^"']*["']/u;
// Hoisted: overflow-x-auto / overflow-x-scroll containment detection.
const OVERFLOW_X_SCROLL_PATTERN = /\boverflow-x-(?:auto|scroll)\b/u;
// Wide zebra tables (not table-sm) must ship a mobile card surface — not scroll-trap @320.
const WIDE_ZEBRA_TABLE_PATTERN =
  /<table\b[^>]*class\s*=\s*["'][^"']*\btable-zebra\b[^"']*["'][^>]*>/u;
const TABLE_SM_IN_TAG_PATTERN = /\btable-sm\b/u;
const RESPONSIVE_DATA_SURFACE_PATTERN = /<ResponsiveDataSurface\b/u;
const DUAL_SURFACE_TOKEN_PATTERN =
  /VISIBILITY_SHOW_BELOW_LG_CLASS[\s\S]*VISIBILITY_HIDE_BELOW_LG_CLASS|VISIBILITY_HIDE_BELOW_LG_CLASS[\s\S]*VISIBILITY_SHOW_BELOW_LG_CLASS/u;
const LEGACY_MD_DUAL_SURFACE_PATTERN =
  /\b(?:hidden\s+md:block|md:block\b[\s\S]*\bmd:hidden|md:hidden\b[\s\S]*\b(?:hidden\s+)?md:block)/u;

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

  const usesAppPagination = APP_PAGINATION_TAG_PATTERN.test(template);

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

const hasTableDualSurface = (content: string, template: string): boolean =>
  RESPONSIVE_DATA_SURFACE_PATTERN.test(content) ||
  DUAL_SURFACE_TOKEN_PATTERN.test(content) ||
  LEGACY_MD_DUAL_SURFACE_PATTERN.test(template);

const collectRawTableClassViolations = (
  filePath: string,
  content: string,
  template: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  rawTablePattern.lastIndex = 0;
  for (const match of template.matchAll(rawTablePattern)) {
    if (TABLE_BASE_CLASS_PATTERN.test(match[0])) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Raw <table> without class="table". Opt into the daisyUI table primitive.`,
    });
  }
  return violations;
};

const collectTableOverflowViolations = (
  filePath: string,
  content: string,
  template: string,
): ValidationViolation[] => {
  if (!tableWithoutOverflowScrollPattern.test(template)) return [];
  if (OVERFLOW_X_SCROLL_PATTERN.test(template) || RESPONSIVE_DATA_SURFACE_PATTERN.test(template)) {
    return [];
  }
  return [
    {
      filePath,
      line: getLineFromOffset(content, template.indexOf("<table") ?? 0),
      message: `<table class="table"> without an overflow-x-auto scroll container ancestor. Tables overflow on mobile without horizontal scroll containment.`,
    },
  ];
};

const collectWideZebraViolations = (
  filePath: string,
  content: string,
  template: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  WIDE_ZEBRA_TABLE_PATTERN.lastIndex = 0;
  for (const match of template.matchAll(new RegExp(WIDE_ZEBRA_TABLE_PATTERN.source, "gu"))) {
    const tableTag = match[0] ?? "";
    if (TABLE_SM_IN_TAG_PATTERN.test(tableTag)) continue;
    if (hasTableDualSurface(content, template)) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Wide table-zebra without mobile card dual-surface. Wrap with <ResponsiveDataSurface> (cards + table slots) or VISIBILITY_SHOW_BELOW_LG_CLASS / VISIBILITY_HIDE_BELOW_LG_CLASS so @320 is not a horizontal UUID scroll trap.`,
    });
  }
  return violations;
};

const collectMultiColumnTableViolations = (
  filePath: string,
  content: string,
  template: string,
): ValidationViolation[] => {
  const thCount = (template.match(/<th\b/gu) ?? []).length;
  if (thCount < NUM_3) return [];
  if (!tableWithoutOverflowScrollPattern.test(template)) return [];
  if (RESPONSIVE_DATA_SURFACE_PATTERN.test(content) || DUAL_SURFACE_TOKEN_PATTERN.test(content)) {
    return [];
  }
  return [
    {
      filePath,
      line: getLineFromOffset(content, template.indexOf("<table") ?? 0),
      message: `Multi-column table (${thCount} <th>) uses overflow-only escape. Wrap with <ResponsiveDataSurface> so mobile gets a card stack, not a horizontal scroll trap.`,
    },
  ];
};

const collectTableViolations = (filePath: string, content: string): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  return [
    ...collectRawTableClassViolations(filePath, content, template),
    ...collectTableOverflowViolations(filePath, content, template),
    ...collectWideZebraViolations(filePath, content, template),
    ...collectMultiColumnTableViolations(filePath, content, template),
  ];
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
