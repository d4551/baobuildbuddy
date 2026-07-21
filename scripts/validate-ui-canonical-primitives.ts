import { isControlPrimitiveOwner } from "./ui-control-primitive-owners";
import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const isSsotPrimitive = (filePath: string): boolean =>
  isUiSsotAuthority(filePath) || isControlPrimitiveOwner(filePath);

const CARD_GLASS_LITERAL_PATTERN =
  /card\s+card-border\s+card-glass(?:\s+glass-(?:interactive|strong|modal))?/gu;
/** Bare card-glass / card-glass-strong class tokens outside SSOT authority. */
const BARE_CARD_GLASS_CLASS_PATTERN = /\bcard-glass(?:-strong|-modal)?\b/gu;
const HARDCODED_LOADING_LABEL_PATTERN = /\blabel\s*=\s*["']Loading["']/gu;
const RAW_DESCRIPTION_CLASS_PATTERN = /description-class\s*=\s*["']text-(?:muted|secondary)["']/gu;
const SURFACE_GLASS_CONSTANT_REFERENCE_PATTERN =
  /SURFACE_GLASS_CARD_(?:STRONG_)?(?:MODAL_)?CLASS\b/u;
/** Canonical card owner — only this SFC may bind SURFACE_GLASS_CARD_*CLASS. */
const UI_GLASS_CARD_PRIMITIVE_PATH = "packages/client/components/ui/UiGlassCard.vue";
const SURFACE_GLASS_CARD_CLASS_TOKEN_PATTERN = /\bSURFACE_GLASS_CARD_(?:STRONG_|MODAL_)?CLASS\b/gu;
const UI_GLASS_CARD_COMPONENT_REFERENCE = /<UiGlassCard\b/u;
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

// Hoisted: UI state contract detection — used inside collectStatePrimitiveGapViolations.
const UI_STATE_NAME_PATTERN = /\buiState\b/u;
const LOADING_SKELETON_TAG_PATTERN = /<LoadingSkeleton\b/u;
const BOOTSTRAP_ERROR_ALERT_TAG_PATTERN = /<BootstrapErrorAlert\b/u;
// Hoisted: literal emptiness / loading / error signals in pages.
const IS_EMPTY_LITERAL_PATTERN = /\bisEmpty\b/u;
const LOADING_LITERAL_PATTERN = /['"]loading['"]/u;
const ERROR_LITERAL_PATTERN = /['"]error['"]/u;
// Hoisted: ARIA progressbar role detection on radial-progress tags.
const PROGRESSBAR_ROLE_PATTERN = /\brole\s*=\s*["']progressbar["']/u;

const collectCardGlassLiteralViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  if (filePath === UI_GLASS_CARD_PRIMITIVE_PATH) return [];
  const violations: ValidationViolation[] = [];
  CARD_GLASS_LITERAL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(CARD_GLASS_LITERAL_PATTERN)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Inline card-glass literal "${match[0]}" bypasses UiGlassCard. Use <UiGlassCard> (variant prop for material strength).`,
    });
  }
  BARE_CARD_GLASS_CLASS_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(BARE_CARD_GLASS_CLASS_PATTERN)) {
    // Skip tokens that already matched the longer card card-border card-glass pattern above.
    const line = getLineFromOffset(content, match.index ?? 0);
    if (violations.some((v) => v.filePath === filePath && v.line === line)) {
      continue;
    }
    violations.push({
      filePath,
      line,
      message: `Bare "${match[0]}" class bypasses UiGlassCard / SURFACE_GLASS_* SSOT. Use <UiGlassCard>.`,
    });
  }
  return violations;
};

const collectHardcodedLoadingLabelViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const violations: ValidationViolation[] = [];
  HARDCODED_LOADING_LABEL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(HARDCODED_LOADING_LABEL_PATTERN)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Hardcoded LoadingSpinner label "Loading" bypasses i18n. Use :label="t('common.loading')".`,
    });
  }
  return violations;
};

const collectRawDescriptionClassViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!filePath.startsWith("packages/client/pages/")) return [];
  const violations: ValidationViolation[] = [];
  RAW_DESCRIPTION_CLASS_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(RAW_DESCRIPTION_CLASS_PATTERN)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Raw description-class="${match[0].includes("muted") ? "text-muted" : "text-secondary"}" bypasses PAGE_HEADER_DESCRIPTION_* SSOT. Omit description-class or use PAGE_HEADER_DESCRIPTION_MEASURE_CLASS.`,
    });
  }
  return violations;
};

/**
 * Ban raw SURFACE_GLASS_CARD_*CLASS bindings outside the UiGlassCard owner.
 * Bespoke card shells fragment density, hover, stagger, and selected/disabled states.
 */
const collectSurfaceGlassCardConstantViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (filePath === UI_GLASS_CARD_PRIMITIVE_PATH) return [];
  if (isSsotPrimitive(filePath) && !filePath.endsWith(".vue")) return [];
  const violations: ValidationViolation[] = [];
  SURFACE_GLASS_CARD_CLASS_TOKEN_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(SURFACE_GLASS_CARD_CLASS_TOKEN_PATTERN)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Raw ${match[0]} bypasses the UiGlassCard primitive. Replace the surface shell with <UiGlassCard> (variant / selected / disabled / staggerIndex / extraClass).`,
    });
  }
  return violations;
};

/** Pages that render card grids must consume UiGlassCard at least once when they declare card lists. */
const PAGE_CARD_GRID_HINT_PATTERN =
  /\b(paginatedJobs|statCards|recommendations|orderedCards|projects|resumes)\b/u;
const collectPageUiGlassCardGapViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!filePath.startsWith("packages/client/pages/")) return [];
  if (!PAGE_CARD_GRID_HINT_PATTERN.test(content)) return [];
  if (UI_GLASS_CARD_COMPONENT_REFERENCE.test(content)) return [];
  // Child components may own cards — only flag when page itself binds glass surfaces.
  if (
    !SURFACE_GLASS_CONSTANT_REFERENCE_PATTERN.test(content) &&
    !CARD_GLASS_LITERAL_PATTERN.test(content)
  ) {
    return [];
  }
  return [
    {
      filePath,
      line: 1,
      message:
        "Page models a card grid but does not consume <UiGlassCard>. Card surfaces must use the canonical glass card primitive.",
    },
  ];
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
    if (!PROGRESSBAR_ROLE_PATTERN.test(match[0])) {
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
    UI_STATE_NAME_PATTERN.test(content) ||
    LOADING_SKELETON_TAG_PATTERN.test(content) ||
    BOOTSTRAP_ERROR_ALERT_TAG_PATTERN.test(content);
  if (!hasUiStateContract) return [];
  const violations: ValidationViolation[] = [];
  if (!EMPTY_STATE_REFERENCE_PATTERN.test(content) && IS_EMPTY_LITERAL_PATTERN.test(content)) {
    violations.push({
      filePath,
      line: 1,
      message: `Page models emptiness (isEmpty) but does not consume the EmptyState primitive. Pages must not hand-roll empty states.`,
    });
  }
  if (!LOADING_SKELETON_REFERENCE_PATTERN.test(content) && LOADING_LITERAL_PATTERN.test(content)) {
    violations.push({
      filePath,
      line: 1,
      message: `Page models a loading state but does not consume the LoadingSkeleton primitive. Pages must not hand-roll loading states.`,
    });
  }
  if (
    !BOOTSTRAP_ERROR_ALERT_REFERENCE_PATTERN.test(content) &&
    ERROR_LITERAL_PATTERN.test(content)
  ) {
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
  ...collectSurfaceGlassCardConstantViolations(filePath, content),
  ...collectPageUiGlassCardGapViolations(filePath, content),
  ...collectHardcodedLoadingLabelViolations(filePath, content),
  ...collectRawDescriptionClassViolations(filePath, content),
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
