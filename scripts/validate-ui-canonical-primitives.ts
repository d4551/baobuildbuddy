import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/components/ui/LoadingSkeleton.vue",
  "packages/client/components/ui/EmptyState.vue",
  "packages/client/components/ui/PageScaffold.vue",
  "packages/client/components/ui/SectionGrid.vue",
  "packages/client/components/ui/AppModalFrame.vue",
  "packages/client/components/ui/PageHeroHeader.vue",
  "packages/client/components/ui/PageHeaderBlock.vue",
  "packages/client/components/ui/BootstrapErrorAlert.vue",
  "packages/client/components/ui/FilteredEmptyAlert.vue",
  "packages/client/components/ui/AppPagination.vue",
  "packages/client/components/ui/ToastContainer.vue",
  "packages/client/components/ui/StatsRow.vue",
  "packages/client/components/ui/WorkPipeline.vue",
  "packages/client/components/ui/WorkspaceSectionNavigator.vue",
  "packages/client/components/ui/AppBreadcrumbs.vue",
  "packages/client/components/ui/LoadingSpinner.vue",
  "packages/client/components/ui/UiRadialMeter.vue",
]);

const isSsotPrimitive = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);

const CARD_GLASS_LITERAL_PATTERN =
  /card\s+card-border\s+card-glass(?:\s+glass-(?:interactive|strong|modal))?/gu;
const SURFACE_GLASS_CONSTANT_REFERENCE_PATTERN =
  /SURFACE_GLASS_CARD_(?:STRONG_)?(?:MODAL_)?CLASS\b/u;
const LOADING_SPINNER_LITERAL_PATTERN = /loading\s+loading-spinner\b/gu;
const LOADING_SPINNER_PRIMITIVE_REFERENCE = /LoadingSpinner\b/u;

const TABLE_LITERAL_PATTERN = /<table\b[^>]*>/gu;
const TABLE_WITHOUT_BASE_CLASS_PATTERN = /<table\b[^>]*class\s*=\s*["'][^"']*\btable\b[^"']*["']/u;
const PROGRESS_LITERAL_PATTERN = /<progress\b[^>]*>/gu;
const PROGRESS_WITHOUT_BASE_CLASS_PATTERN =
  /<progress\b[^>]*class\s*=\s*["'][^"']*\bprogress\b[^"']*["']/u;
const RADIAL_PROGRESS_LITERAL_PATTERN =
  /<[^>]*class\s*=\s*["'][^"']*\bradial-progress\b[^"']*["'][^>]*>/gu;

const EMPTY_STATE_REFERENCE_PATTERN = /<EmptyState\b/u;
const LOADING_SKELETON_REFERENCE_PATTERN = /<LoadingSkeleton\b/u;
const BOOTSTRAP_ERROR_ALERT_REFERENCE_PATTERN = /<BootstrapErrorAlert\b/u;

const collectCardGlassLiteralViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const violations: ValidationViolation[] = [];
  CARD_GLASS_LITERAL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(CARD_GLASS_LITERAL_PATTERN)) {
    if (SURFACE_GLASS_CONSTANT_REFERENCE_PATTERN.test(content)) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Inline card-glass literal "${match[0]}" bypasses SURFACE_GLASS_CARD_CLASS. Import SURFACE_GLASS_CARD_CLASS (or _STRONG_ / _MODAL_) from ~/constants/layout and bind via :class.`,
    });
  }
  return violations;
};

const collectLoadingSpinnerLiteralViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const violations: ValidationViolation[] = [];
  LOADING_SPINNER_LITERAL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(LOADING_SPINNER_LITERAL_PATTERN)) {
    if (LOADING_SPINNER_PRIMITIVE_REFERENCE.test(content)) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Inline spinner "${match[0]}" bypasses the canonical loading primitive. Use LoadingSkeleton (variant="lines") or extract a LoadingSpinner.vue primitive and consume it.`,
    });
  }
  return violations;
};

const collectTablePrimitiveViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const violations: ValidationViolation[] = [];
  TABLE_LITERAL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(TABLE_LITERAL_PATTERN)) {
    if (!TABLE_WITHOUT_BASE_CLASS_PATTERN.test(match[0])) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Raw HTML <table> must opt into the daisyUI table primitive (class="table").`,
      });
    }
  }
  PROGRESS_LITERAL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(PROGRESS_LITERAL_PATTERN)) {
    if (!PROGRESS_WITHOUT_BASE_CLASS_PATTERN.test(match[0])) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Raw <progress> must opt into the daisyUI progress primitive (class="progress").`,
      });
    }
  }
  RADIAL_PROGRESS_LITERAL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(RADIAL_PROGRESS_LITERAL_PATTERN)) {
    if (!/\brole\s*=\s*["']progressbar["']/u.test(match[0])) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `daisyUI radial-progress requires role="progressbar".`,
      });
    }
  }
  return violations;
};

const collectStatePrimitiveGapViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  if (!filePath.startsWith("packages/client/pages/")) return [];
  const hasUiStateContract =
    /\buiState\b/u.test(content) ||
    /<LoadingSkeleton\b/u.test(content) ||
    /<BootstrapErrorAlert\b/u.test(content);
  if (!hasUiStateContract) return [];
  const violations: ValidationViolation[] = [];
  if (!EMPTY_STATE_REFERENCE_PATTERN.test(content) && /\bisEmpty\b/u.test(content)) {
    violations.push({
      filePath,
      line: 1,
      message: `Page models emptiness (isEmpty) but does not consume the EmptyState primitive. Pages must not hand-roll empty states.`,
    });
  }
  if (!LOADING_SKELETON_REFERENCE_PATTERN.test(content) && /['"]loading['"]/u.test(content)) {
    violations.push({
      filePath,
      line: 1,
      message: `Page models a loading state but does not consume the LoadingSkeleton primitive. Pages must not hand-roll loading states.`,
    });
  }
  if (!BOOTSTRAP_ERROR_ALERT_REFERENCE_PATTERN.test(content) && /['"]error['"]/u.test(content)) {
    violations.push({
      filePath,
      line: 1,
      message: `Page models an error state but does not consume the BootstrapErrorAlert primitive. Pages must not hand-roll error states.`,
    });
  }
  return violations;
};

export const collectUiCanonicalPrimitiveViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => [
  ...collectCardGlassLiteralViolations(filePath, content),
  ...collectLoadingSpinnerLiteralViolations(filePath, content),
  ...collectTablePrimitiveViolations(filePath, content),
  ...collectStatePrimitiveGapViolations(filePath, content),
];

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectUiCanonicalPrimitiveViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI canonical primitive validation failed:",
    await collectViolations(),
    "UI canonical primitive validation passed.",
  );
}
