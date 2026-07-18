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

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/assets/css/main.css",
  "packages/client/constants/layout.ts",
  "packages/client/constants/ui-layout.ts",
]);

const isSsotSourceFile = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);

// Fixed width like w-64, w-96, w-[320px] (but not w-full, w-auto, w-fit, w-screen).
const fixedWidthPattern = /\bw-(?:\d{2,4}|\[[^\]]+\])(?!\s*\/)/gu;
// Fixed height like h-64, h-96 (but not h-full, h-auto, h-fit, h-screen).
const fixedHeightPattern = /\bh-(?:\d{2,4}|\[[^\]]+\])(?!\s*\/)/gu;
// overflow-x-auto / overflow-scroll with no min-w-0 child nearby.
const horizontalOverflowPattern = /\boverflow-x-(?:auto|scroll)\b/gu;
// Grid with fixed columns and no responsive guard on the same class string.
const fixedGridColsPattern = /\bgrid-cols-(?:[2-9]|1\d)(?![\d-])/gu;

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
  const classAttrPattern = /\bclass\s*=\s*["']([^"']+)["']/gu;
  classAttrPattern.lastIndex = 0;
  for (const classMatch of template.matchAll(classAttrPattern)) {
    const classValue = classMatch[1] ?? "";
    const baseLine = getLineFromOffset(content, classMatch.index ?? 0);

    fixedWidthPattern.lastIndex = 0;
    const hasFixedWidth = fixedWidthPattern.test(classValue);
    if (hasFixedWidth) {
      const hasGuard = /\bmin-w-0\b|\bmax-w-/u.test(classValue);
      const isFluidCap = /\bmax-w-/u.test(classValue);
      if (!hasGuard && !isFluidCap) {
        const token = classValue.match(fixedWidthPattern)?.[0] ?? "w-<n>";
        violations.push({
          filePath,
          line: baseLine,
          message: `Fixed width "${token}" risks horizontal overflow without min-w-0 or max-w-* guard. Use the SSOT SHELL_MAIN_INNER_CLASS / PAGE_HERO_ASIDE_CLASS pattern or wrap in min-w-0.`,
        });
      }
    }

    fixedHeightPattern.lastIndex = 0;
    const fixedHeightMatch = classValue.match(fixedHeightPattern);
    if (fixedHeightMatch) {
      violations.push({
        filePath,
        line: baseLine,
        message: `Fixed height "${fixedHeightMatch[0]}" clips content on short viewports. Prefer min-h-* or use the glass-card container query for adaptive density.`,
      });
    }

    fixedGridColsPattern.lastIndex = 0;
    const fixedGridMatch = classValue.match(fixedGridColsPattern);
    if (fixedGridMatch) {
      const hasResponsiveGuard = /\b(?:sm|md|lg|xl):grid-cols-/u.test(classValue);
      if (!hasResponsiveGuard) {
        violations.push({
          filePath,
          line: baseLine,
          message: `Fixed grid columns "${fixedGridMatch[0]}" without responsive sm:/md: guard cramps mobile. Use grid-cols-1 sm:grid-cols-2 md:grid-cols-N or the SectionGrid primitive.`,
        });
      }
    }
  }

  horizontalOverflowPattern.lastIndex = 0;
  for (const match of template.matchAll(horizontalOverflowPattern)) {
    const classValue =
      /\bclass\s*=\s*["']([^"']+)["']/u.exec(
        template.slice(Math.max(0, (match.index ?? 0) - 200)),
      )?.[1] ?? "";
    if (!/\bmin-w-0\b/u.test(classValue)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Horizontal overflow container ("${match[0]}") without min-w-0 on the scrollable child. Add min-w-0 (TRUNCATE_FLEX_CHILD_CLASS) to enable flexbox truncation.`,
      });
    }
  }

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
