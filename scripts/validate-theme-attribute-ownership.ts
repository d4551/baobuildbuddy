import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * `data-theme` has exactly one owner: `app.vue`'s `useHead`, which renders it onto `<html>`.
 *
 * Re-declaring it on any descendant is not merely redundant — it silently reverts the whole
 * subtree to daisyUI's stock palette. `plugins/brand-css.client.ts` applies the configured
 * brand palette as custom properties on `documentElement`; those only reach descendants by
 * *inheritance*, and a matching `[data-theme="corporate"]` rule (daisyUI's own theme block
 * plus the WCAG overrides in `assets/css/main.css`) beats an inherited value on the element
 * it matches. A nested `data-theme` therefore wipes brand primary/neutral/accent for
 * everything under it, which is how the app shell rendered stock daisyUI colours — including
 * a pure-black `menu-active` rail item, because stock corporate's `--color-neutral` is
 * `oklch(0% 0 0)` while the brand palette's is not.
 *
 * Theme *switching* goes through `useTheme().setTheme`, which drives the shared state the
 * single `useHead` owner reads.
 */

const scanRoots = ["packages/client"] as const;
const sourceExtensions = new Set([".vue", ".ts"]);

/** The one file allowed to emit the attribute, and the composable that documents the rule. */
const OWNER_FILES = new Set([
  "packages/client/app.vue",
  "packages/client/composables/useTheme.ts",
  "packages/client/composables/useBrand.ts",
]);

/** Template attribute (`data-theme="x"`) or Vue binding (`:data-theme`, `v-bind:data-theme`). */
const TEMPLATE_ATTRIBUTE_PATTERN = /(?::|v-bind:)?data-theme\s*=/u;
/** Imperative DOM writes: `setAttribute("data-theme", …)` / `dataset.theme = …`. */
const IMPERATIVE_WRITE_PATTERN = /setAttribute\(\s*["']data-theme["']|\.dataset\.theme\s*=/u;

export const collectThemeAttributeViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (OWNER_FILES.has(filePath)) {
    return [];
  }

  const violations: ValidationViolation[] = [];
  const lines = content.split("\n");

  for (const [index, line] of lines.entries()) {
    if (TEMPLATE_ATTRIBUTE_PATTERN.test(line)) {
      violations.push({
        filePath,
        line: index + 1,
        message:
          "Nested `data-theme` re-matches daisyUI's `[data-theme=…]` palette block and discards the brand palette inherited from <html>. Remove it; `app.vue` owns the attribute and `useTheme().setTheme` owns switching.",
      });
    }
    if (IMPERATIVE_WRITE_PATTERN.test(line)) {
      violations.push({
        filePath,
        line: index + 1,
        message:
          "Imperative `data-theme` write bypasses the `useHead` owner in app.vue and desynchronises SSR markup from the client. Call `useTheme().setTheme` instead.",
      });
    }
  }

  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: [...scanRoots],
    allowedExtensions: sourceExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectThemeAttributeViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Theme attribute ownership validation failed:",
    await collectViolations(),
    "Theme attribute ownership validation passed.",
  );
}
