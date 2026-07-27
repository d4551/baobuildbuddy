import {
  collectProjectFileEntries,
  getLineFromOffset,
  getTemplateOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Canonical card-surface gate.
 *
 * `components/ui/UiGlassCard.vue` is the single source for card surfaces: glass
 * material, hover lift, staggered entrance, and the selected/disabled/error
 * states. Its own docblock says bespoke card surfaces are forbidden — but nothing
 * enforced it, so surfaces drifted. `ResumeLibraryPanel.vue` had grown
 * `card card-border bg-base-100 hover:bg-base-200`: a flat opaque card sitting in
 * a product whose every other card is glass, with no interaction states and no
 * entrance animation. It looked wrong on screen and no gate could say so.
 *
 * This flags a literal `card` class composed with its own background or border in
 * a Vue template. Such an element is a card surface built by hand instead of
 * through the primitive.
 */

const SCAN_ROOTS = ["packages/client"] as const;
const ALLOWED_EXTENSIONS = new Set([".vue"]);

/**
 * Files permitted to compose a card surface directly.
 *
 * Only the primitive itself. Every other consumer goes through it.
 */
const EXEMPT_FILES = new Set(["packages/client/components/ui/UiGlassCard.vue"]);

/** Static `class="..."` attribute values in a template. */
const STATIC_CLASS_ATTRIBUTE_PATTERN = /\bclass="([^"]*)"/gu;

/** Utility families that turn a bare `card` into a self-styled surface. */
const SURFACE_UTILITY_PATTERN = /\b(?:bg-base-\d+|card-border|card-dash|bg-base-100\/\d+)\b/u;

/** Splits a class attribute value into individual class tokens. */
const CLASS_TOKEN_SEPARATOR_PATTERN = /\s+/u;

/**
 * Reports whether a class list contains the standalone `card` token.
 *
 * `card-body`, `card-title`, and `card-actions` are layout children of a card and
 * must not count — only the surface token itself does.
 */
const hasStandaloneCardToken = (classList: string): boolean =>
  classList.split(CLASS_TOKEN_SEPARATOR_PATTERN).includes("card");

/**
 * Flags hand-composed card surfaces in one Vue file.
 */
export const collectBespokeCardSurfaces = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (EXEMPT_FILES.has(filePath)) {
    return [];
  }

  const templateOffset = getTemplateOffset(content);
  if (templateOffset === -1) {
    return [];
  }

  const template = content.slice(templateOffset);
  const violations: ValidationViolation[] = [];
  STATIC_CLASS_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const match of template.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    const classList = match[1] ?? "";
    if (!hasStandaloneCardToken(classList) || !SURFACE_UTILITY_PATTERN.test(classList)) {
      continue;
    }
    violations.push({
      filePath,
      line: getLineFromOffset(content, templateOffset + (match.index ?? 0)),
      message: `Hand-composed card surface ("${classList.trim()}"). Use <UiGlassCard> — it owns the glass material, hover lift, entrance stagger, and selected/disabled/error states.`,
    });
  }

  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: SCAN_ROOTS,
    allowedExtensions: ALLOWED_EXTENSIONS,
  });

  return files.flatMap(({ filePath, content }) => collectBespokeCardSurfaces(filePath, content));
};

if (import.meta.main) {
  await reportViolations(
    "Canonical card surface validation failed:",
    await collectViolations(),
    "Canonical card surface validation passed: every card surface goes through UiGlassCard.",
  );
}
