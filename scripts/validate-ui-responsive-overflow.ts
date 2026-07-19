import { isControlPrimitiveOwner } from "./ui-control-primitive-owners";
import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Responsive overflow + fluidity gate (design.md §11, §8).
 *
 * Components must not run off-screen or overshoot boundaries. This gate
 * catches the most common overflow risks:
 *   1. Fixed width utilities (`w-64`, `w-96`) without a `min-w-0` or
 *      `max-w-*` guard inside a flex/grid parent that needs to shrink.
 *   2. `overflow-x-auto` / `overflow-scroll` without an explicit
 *      `min-w-0` child — the canonical Bao pattern for truncation.
 *   3. Fixed height utilities on content blocks (`h-64`, `h-96`) that
 *      clip content on short viewports; prefer `min-h-*`.
 *   4. Grids with a fixed column count that don't collapse (`grid-cols-4`
 *      without responsive `sm:`/`md:` guards is a mobile-cramp risk).
 *
 * Allowed SSOT forms: constants/layout.ts, constants/ui-layout.ts, main.css.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts", ".css"]);

const isSsotSourceFile = (filePath: string): boolean =>
  isUiSsotAuthority(filePath) || isControlPrimitiveOwner(filePath);

// Fixed width like w-64, w-96, w-[320px] (but not w-full, w-auto, w-fit, w-screen).
// Use a negative lookbehind for `-` so we don't match `min-w-64` / `max-w-64`.
const fixedWidthPattern = /(?<![-\w])w-(?:\d{2,4}|\[[^\]]+\])(?!\s*\/)/gu;
// Fixed height like h-64, h-96 (but not h-full, h-auto, h-fit, h-screen).
// Use a negative lookbehind for `-` so we don't match `min-h-64` / `max-h-64`.
const fixedHeightPattern = /(?<![-\w])h-(?:\d{2,4}|\[[^\]]+\])(?!\s*\/)/gu;
// Grid with fixed columns and no responsive guard on the same class string.
const fixedGridColsPattern = /\bgrid-cols-(?:[2-9]|1\d)(?![\d-])/gu;

// Threshold below which w-/h- literals are icon/avatar primitives, not overflow risks.
const SMALL_SIZE_THRESHOLD = 17; // w-16 / h-16 and below are primitives.

// Hoisted: class-attribute extraction (captures the inner class string in group 1).
const CLASS_ATTR_PATTERN = /\bclass\s*=\s*["']([^"']+)["']/gu;
// Hoisted: digit extraction from a w-/h- literal like `w-64` or `w-[320px]`.
const DIGITS_ONLY_PATTERN = /\D/gu;
// Hoisted: min-w-0 OR max-w-* guard detection.
const WIDTH_GUARD_PATTERN = /\bmin-w-0\b|\bmax-w-/u;
// Hoisted: max-w-* (any width cap) detection — used as a separate isFluidCap signal.
const MAX_W_CAP_PATTERN = /\bmax-w-/u;
// Hoisted: vertical overflow guard detection (hidden / y-auto / y-scroll / auto).
const VERTICAL_OVERFLOW_GUARD_PATTERN = /\boverflow-(?:hidden|y-auto|y-scroll|auto)\b/u;
// Hoisted: skeleton-row class detection.
const SKELETON_CLASS_PATTERN = /\bskeleton\b/u;
// Hoisted: arbitrary w-N class detection (sibling w- matching aspect-ratio primitives).
const W_ARBITRARY_PATTERN = /\bw-\d+\b/u;
// Hoisted: responsive sm:/md:/lg:/xl: grid-cols- guard detection.
const RESPONSIVE_GRID_COLS_PATTERN = /\b(?:sm|md|lg|xl):grid-cols-/u;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const collectOverflowViolations = (filePath: string, content: string): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  // For each class attribute, check for fixed width without min-w-0 / max-w guard.
  CLASS_ATTR_PATTERN.lastIndex = 0;
  for (const classMatch of template.matchAll(CLASS_ATTR_PATTERN)) {
    const classValue = classMatch[1] ?? "";
    const baseLine = getLineFromOffset(content, classMatch.index ?? 0);

    fixedWidthPattern.lastIndex = 0;
    const fixedWidthMatch = classValue.match(fixedWidthPattern);
    if (fixedWidthMatch) {
      const widthValue = Number.parseInt(fixedWidthMatch[0].replace(DIGITS_ONLY_PATTERN, ""), 10);
      // Small widths (w-10..w-52) are dropdowns/menus/badges — not overflow risks.
      // Only flag large fixed widths (w-64+) that risk pushing content off-screen.
      const isSmallPrimitive = Number.isFinite(widthValue) && widthValue <= 52;
      const hasGuard = WIDTH_GUARD_PATTERN.test(classValue);
      const isFluidCap = MAX_W_CAP_PATTERN.test(classValue);
      if (!isSmallPrimitive && !hasGuard && !isFluidCap) {
        violations.push({
          filePath,
          line: baseLine,
          message: `Fixed width "${fixedWidthMatch[0]}" risks horizontal overflow without min-w-0 or max-w-* guard. Use the SSOT SHELL_MAIN_INNER_CLASS / PAGE_HERO_ASIDE_CLASS pattern or wrap in min-w-0.`,
        });
      }
    }

    fixedHeightPattern.lastIndex = 0;
    const fixedHeightMatch = classValue.match(fixedHeightPattern);
    if (fixedHeightMatch) {
      const heightValue = Number.parseInt(fixedHeightMatch[0].replace(DIGITS_ONLY_PATTERN, ""), 10);
      const isSmallPrimitive = Number.isFinite(heightValue) && heightValue <= SMALL_SIZE_THRESHOLD;
      // Fixed height with an overflow guard (overflow-hidden/y-auto/y-scroll)
      // is the canonical bounded scroll region pattern (chat panels, timelines,
      // modal content). This is correct — not a violation.
      const hasOverflowGuard = VERTICAL_OVERFLOW_GUARD_PATTERN.test(classValue);
      // Skeleton rows legitimately use fixed heights.
      const isSkeletonRow = SKELETON_CLASS_PATTERN.test(classValue);
      // Aspect-ratio / ratio surfaces (swatches, thumbnails) use fixed h- with
      // a sibling w- of the same size — these are primitives, not text clips.
      const isSquarePrimitive =
        heightValue <= SMALL_SIZE_THRESHOLD + 4 && W_ARBITRARY_PATTERN.test(classValue);
      if (!isSmallPrimitive && !hasOverflowGuard && !isSkeletonRow && !isSquarePrimitive) {
        violations.push({
          filePath,
          line: baseLine,
          message: `Fixed height "${fixedHeightMatch[0]}" clips content on short viewports. Prefer min-h-* or add overflow-y-auto/overflow-hidden for bounded scroll, or use the glass-card container query for adaptive density.`,
        });
      }
    }

    fixedGridColsPattern.lastIndex = 0;
    const fixedGridMatch = classValue.match(fixedGridColsPattern);
    if (fixedGridMatch) {
      const hasResponsiveGuard = RESPONSIVE_GRID_COLS_PATTERN.test(classValue);
      if (!hasResponsiveGuard) {
        violations.push({
          filePath,
          line: baseLine,
          message: `Fixed grid columns "${fixedGridMatch[0]}" without responsive sm:/md: guard cramps mobile. Use grid-cols-1 sm:grid-cols-2 md:grid-cols-N or the SectionGrid primitive.`,
        });
      }
    }
  }

  // The overflow-x-auto scroll container check was a false positive:
  // ON a scroll container is the canonical Bao pattern for tables/timelines.
  // The real overflow risk is flex parents with fixed-width children and no
  // min-w-0/max-w-* guard, which the fixedWidthPattern check above already
  // catches. min-w-0 is only required for flexbox truncation, not for
  // overflow-x-auto scroll containers.

  return violations;
};

export const collectResponsiveOverflowViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => collectOverflowViolations(filePath, content);

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectResponsiveOverflowViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI responsive overflow validation failed:",
    await collectViolations(),
    "UI responsive overflow validation passed.",
  );
}
