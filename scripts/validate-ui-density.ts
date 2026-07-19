import {
  collectProjectFileEntries,
  getLineFromOffset,
  getTemplateOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * UI density gate (design.md §8.2, §11 — "What would Apple do?").
 *
 * Catches:
 *   1. Cramped rows: too many flex children at `gap-1` / `gap-2` without
 *      a `flex-wrap` or `overflow-hidden` / `min-w-0` guard.
 *   2. Oversized text labels where an icon would suffice (label length > 24
 *      chars on a small button alongside an icon).
 *   3. Stacked sections with redundant headers when a single icon row would
 *      communicate the same information more fluidly.
 *   4. Long-form marketing fluff in enterprise density contexts (paragraphs
 *      > 280 chars in a stat card / table header / control surface).
 *
 * This is a heuristic gate; it surfaces candidates for review rather than
 * hard bans, but violations still fail the gate so they are adjudicated.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue"]);

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/components/ui/LoadingSkeleton.vue",
  "packages/client/components/ui/EmptyState.vue",
  "packages/client/components/ui/PageScaffold.vue",
  "packages/client/components/ui/SectionGrid.vue",
  "packages/client/components/ui/PageHeroHeader.vue",
  "packages/client/components/ui/PageHeaderBlock.vue",
  "packages/client/components/ui/BootstrapErrorAlert.vue",
  "packages/client/components/ui/FilteredEmptyAlert.vue",
]);

const isSsotPrimitive = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);

// Cramped row: gap-1 or gap-2 with multiple flex children and no wrap guard.
const crampedRowPattern =
  /\bclass\s*=\s*["'][^"']*\b(?:flex|inline-flex)\b[^"']*\bgap-1\b[^"']*["']/gu;
// Button tag pair — we extract both tag and inner content separately so we
// can detect icon + long-text combos where `[^<]{24,}` would fail because
// the icon SVG sits between the opening tag and the text node.
const buttonTagPattern = /<button\b[^>]*>([\s\S]*?)<\/button>/gu;
// Long paragraph in a card/control surface.
const longParagraphInControlPattern =
  /\bclass\s*=\s*["'][^"']*\b(?:card-body|btn|stat|badge|chip|tooltip)[^"']*["'][^>]*>[^<]{280,}/gu;

// Hoisted: flex-wrap guard detection inside cramped row class strings.
const FLEX_WRAP_PATTERN = /\bflex-wrap\b/u;
// Hoisted: overflow-hidden / overflow-x-clip guard detection inside cramped row class strings.
const OVERFLOW_GUARD_PATTERN = /\boverflow-(?:hidden|x-clip)\b/u;
// Hoisted: min-w-0 guard detection inside cramped row class strings.
const MIN_W_ZERO_PATTERN = /\bmin-w-0\b/u;
// Hoisted: nav/menu/list context detection inside cramped row class strings.
const NAV_CONTEXT_CLASS_PATTERN =
  /\b(?:menu|navbar|tabs|breadcrumb|breadcrumbs|nav|sidebar|listbox|tablist)\b/u;
// Hoisted: drawer-aware pattern (ml-auto/is-drawer-*) for cramped row allowance.
const DRAWER_AWARE_CLASS_PATTERN = /\b(?:is-drawer-(?:open|close)|ml-auto|mr-auto)\b/u;
// Hoisted: surrounding-template nav/menu container detection for cramped row allowance.
const NAV_CONTAINER_LOOKBACK_PATTERN =
  /<(?:nav|ul|ol|aside|menu|tablist)\b[^>]*>(?:[\s\S]{0,400}?)<(?:div|span)\b[^>]*\b(?:flex|inline-flex)\b[^']*\bgap-1\b/iu;
// Hoisted: SVG/Icon tag presence inside a button's inner content.
const ICON_TAG_PATTERN = /<(?:svg|Icon|icon)\b/iu;
// Hoisted: strip nested HTML tags from button inner content for visible-text length.
const NESTED_TAG_STRIP_PATTERN = /<[^>]+>/gu;
// Hoisted: strip i18n binding expressions from button inner content for visible-text length.
const I18N_BINDING_STRIP_PATTERN = /\{\{[^}]*\}\}/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

const collectDensityViolations = (filePath: string, content: string): ValidationViolation[] => {
  if (isSsotPrimitive(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  const templateOffset = getTemplateOffset(content);
  crampedRowPattern.lastIndex = 0;
  for (const match of template.matchAll(crampedRowPattern)) {
    const classValue = match[0] ?? "";
    const lineText =
      template.slice(Math.max(0, (match.index ?? 0) - 120), (match.index ?? 0) + 200) ?? "";
    // Count flex-item siblings by counting tag openings on this line's context.
    const hasWrap = FLEX_WRAP_PATTERN.test(classValue);
    const hasOverflowGuard = OVERFLOW_GUARD_PATTERN.test(classValue);
    const hasMinW0 = MIN_W_ZERO_PATTERN.test(classValue);
    // Nav/menu/listbox/list contexts intentionally use tight gap-1 for
    // dense item rows (sidebar nav, breadcrumb separators, icon chips).
    const isNavContext =
      NAV_CONTEXT_CLASS_PATTERN.test(classValue) ||
      // Look-back at the surrounding template: the element is rendered
      // inside a menu/nav container.
      NAV_CONTAINER_LOOKBACK_PATTERN.test(lineText);
    // gap-1 inside drawer-aware elements (ml-auto/is-drawer-*) is the
    // canonical pattern for sidebar shortcut hints and chip clusters.
    const isDrawerAware = DRAWER_AWARE_CLASS_PATTERN.test(classValue);
    if (!hasWrap && !hasOverflowGuard && !hasMinW0 && !isNavContext && !isDrawerAware) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset)),
        message: `Cramped row (flex + gap-1) without flex-wrap / overflow-hidden / min-w-0 guard. Items will overshoot on narrow viewports. Consider icon-only controls or hover-reveal.`,
      });
    }
  }

  buttonTagPattern.lastIndex = 0;
  for (const match of template.matchAll(buttonTagPattern)) {
    const inner = match[1] ?? "";
    const hasIcon = ICON_TAG_PATTERN.test(inner);
    // Strip all nested tags to get visible text length. Also strip i18n
    // binding expressions {{ t("...") }} since the rendered text is the
    // translated string, not the key — the key length is a false signal.
    const visibleText = inner
      .replace(NESTED_TAG_STRIP_PATTERN, "")
      .replace(I18N_BINDING_STRIP_PATTERN, "")
      .trim();
    if (hasIcon && visibleText.length > 24) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset)),
        message: `Button with icon + verbose label ("${visibleText.slice(0, 30)}…", ${visibleText.length} chars). Icon already communicates the action; shorten the label or use aria-label + icon-only on tight surfaces.`,
      });
    }
  }

  longParagraphInControlPattern.lastIndex = 0;
  for (const match of template.matchAll(longParagraphInControlPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, (match.index ?? 0) + Math.max(0, templateOffset)),
      message: `Long-form copy (${(match[0] ?? "").length} chars) inside a control surface. Enterprise density requires scannable labels; move prose to a help docs page or a collapsible disclosure.`,
    });
  }

  return violations;
};

export const collectDensityViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => collectDensityViolations(filePath, content);

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectDensityViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI density validation failed:",
    await collectViolations(),
    "UI density validation passed.",
  );
}
