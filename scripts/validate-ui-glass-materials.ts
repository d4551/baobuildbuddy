import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Glass material system enforcement (design.md §3, §5).
 *
 * The .bao SSOT defines canonical glass surfaces in main.css:
 *   .glass / .card.card-glass       — standard material
 *   .glass-subtle                   — subtle (sidebar, navbar)
 *   .glass-strong / .card.card-glass-strong — elevated (popovers)
 *   .glass-modal / .card.card-glass-modal   — transient layers
 *   .glass-clear                     — decorative media controls
 *   .glass-solid                     — opaque fallback
 *   .glass-interactive               — interactive state mixin
 *   .glass-selected / .glass-disabled / .glass-error — state mixins
 *
 * This gate catches surfaces that look like elevated panels (card-like
 * containers with shadows + borders) but bypass the glass system by
 * composing raw `bg-base-*` + `shadow-*` + `border-*` utilities.
 *
 * It also enforces that `.card.card-glass` literals reference the SSOT
 * constants (SURFACE_GLASS_CARD_CLASS etc.) when used in pages/composites,
 * and that interactive cards use the `glass-interactive` mixin.
 */

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
  "packages/client/assets/css/main.css",
  "packages/client/constants/layout.ts",
]);

const isSsotSourceFile = (filePath: string): boolean => SSOT_ALLOWLIST_PATHS.has(filePath);

// A surface that uses card + shadow + bg-base-* but no glass class is bespoke.
const cardSurfaceWithoutGlassPattern =
  /\bclass\s*=\s*["'][^"']*\bcard\b[^"']*(?:shadow-(?:sm|md|lg|xl|2xl))[^"']*(?:(?!glass).)*["']/gu;

// A surface that composes bg-base-100 + shadow-* + border but isn't a card.
// This is the bespoke-panel smell: three surface utilities that the glass
// system already covers via .glass / .glass-subtle / .glass-strong.
const bespokePanelSurfacePattern =
  /\bclass\s*=\s*["'][^"']*\bbg-base-\d+[^"']*\bshadow-(?:sm|md|lg|xl|2xl)\b[^"']*\bborder-(?:base-\d+|1|2)\b[^"']*["']/gu;

// Interactive card (has @click or role="button" or btn) without glass-interactive.
const interactiveCardWithoutMixinPattern =
  /<(?:div|button|article|li)[^>]*\bclass\s*=\s*["'][^"']*\bcard\b[^"']*(?:glass|card-glass)[^"']*["'][^>]*(?:@click|role\s*=\s*["']button["'])[^>]*>/gu;

const extractTemplateBlocks = (content: string): string => {
  const templateStart = content.indexOf("<template>");
  if (templateStart < 0) return "";
  const templateEnd = content.lastIndexOf("</template>");
  if (templateEnd <= templateStart) return content.slice(templateStart);
  return content.slice(templateStart, templateEnd + "</template>".length);
};

export const collectGlassMaterialViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isSsotSourceFile(filePath)) return [];
  const template = extractTemplateBlocks(content);
  if (template.length === 0) return [];
  const violations: ValidationViolation[] = [];

  cardSurfaceWithoutGlassPattern.lastIndex = 0;
  for (const match of template.matchAll(cardSurfaceWithoutGlassPattern)) {
    if (/glass(?:\s|$|-)/u.test(match[0])) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Card surface with shadow but no glass material class. Add card-glass (or card-glass-strong/modal) or consume SURFACE_GLASS_CARD_CLASS from constants/layout.ts.`,
    });
  }

  bespokePanelSurfacePattern.lastIndex = 0;
  for (const match of template.matchAll(bespokePanelSurfacePattern)) {
    if (/glass(?:\s|$|-)/u.test(match[0])) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Bespoke panel surface (bg-base-* + shadow-* + border-*) bypasses the glass material system. Use glass / glass-subtle / glass-strong or a SURFACE_GLASS_*_CLASS constant.`,
    });
  }

  interactiveCardWithoutMixinPattern.lastIndex = 0;
  for (const match of template.matchAll(interactiveCardWithoutMixinPattern)) {
    if (/\bglass-interactive\b/u.test(match[0])) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Interactive card (has @click or role="button") missing glass-interactive mixin. Add glass-interactive or SURFACE_GLASS_CARD_CLASS (which includes it).`,
    });
  }

  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectGlassMaterialViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "UI glass material validation failed:",
    await collectViolations(),
    "UI glass material validation passed.",
  );
}
