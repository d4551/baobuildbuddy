import { getLineFromOffset } from "./utils/validation-helpers";

export type DaisyUiViolation = {
  filePath: string;
  line: number;
  message: string;
};

const SINGLE_CLASS_ATTRIBUTE_PATTERN = /\bclass\s*=\s*["']([^"']+)["']/u;
const TABLE_TAG_PATTERN = /<table\b[^>]*>/gu;
const PROGRESS_TAG_PATTERN = /<progress\b[^>]*>/gu;
const RADIAL_PROGRESS_TAG_PATTERN =
  /<[^>]*class\s*=\s*["'][^"']*\bradial-progress\b[^"']*["'][^>]*>/gu;
const WHITESPACE_PATTERN = /\s+/u;
const RADIAL_ROLE_PATTERN = /\brole\s*=\s*["']progressbar["']/u;
const RADIAL_VALUE_NOW_PATTERN = /\baria-valuenow\s*=\s*/u;
const STYLE_ATTRIBUTE_PATTERN = /\b:style\s*=\s*["'][^"']+["']|\bstyle\s*=\s*["'][^"']+["']/u;

export const BRAND_PREVIEW_STYLES_FILE_PATH =
  "packages/client/composables/useBrandPreviewStyles.ts";

const BRAND_PREVIEW_REQUIRED_THEME_VARIABLES = [
  "--color-base-100",
  "--color-base-200",
  "--color-base-300",
  "--color-base-content",
  "--color-primary",
  "--color-primary-content",
  "--color-secondary",
  "--color-secondary-content",
  "--color-accent",
  "--color-accent-content",
  "--color-neutral",
  "--color-neutral-content",
  "--color-info",
  "--color-info-content",
  "--color-success",
  "--color-success-content",
  "--color-warning",
  "--color-warning-content",
  "--color-error",
  "--color-error-content",
  "--radius-selector",
  "--radius-field",
  "--radius-box",
  "--size-selector",
  "--size-field",
  "--border",
  "--depth",
  "--noise",
] as const;

const extractClassTokens = (value: string): string[] =>
  value.split(WHITESPACE_PATTERN).filter((token) => token.length > 0);

export const collectTableMarkupViolations = (
  filePath: string,
  fileContent: string,
): DaisyUiViolation[] => {
  const violations: DaisyUiViolation[] = [];
  for (const tableTag of fileContent.matchAll(TABLE_TAG_PATTERN)) {
    const classMatch = tableTag[0].match(SINGLE_CLASS_ATTRIBUTE_PATTERN);
    if (!classMatch) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, tableTag.index ?? 0),
        message: "Raw HTML table must opt into the daisyUI `table` primitive.",
      });
      continue;
    }

    const tokens = extractClassTokens(classMatch[1]);
    if (!tokens.includes("table")) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, tableTag.index ?? 0),
        message: "daisyUI table usage requires the base `table` class.",
      });
    }
  }
  return violations;
};

export const collectProgressMarkupViolations = (
  filePath: string,
  fileContent: string,
): DaisyUiViolation[] => {
  const violations: DaisyUiViolation[] = [];
  for (const progressTag of fileContent.matchAll(PROGRESS_TAG_PATTERN)) {
    const classMatch = progressTag[0].match(SINGLE_CLASS_ATTRIBUTE_PATTERN);
    if (!classMatch) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, progressTag.index ?? 0),
        message: "Progress elements must opt into the daisyUI `progress` primitive.",
      });
      continue;
    }

    const tokens = extractClassTokens(classMatch[1]);
    if (!tokens.includes("progress")) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, progressTag.index ?? 0),
        message: "daisyUI progress usage requires the base `progress` class.",
      });
    }
  }
  return violations;
};

export const collectRadialProgressViolations = (
  filePath: string,
  fileContent: string,
): DaisyUiViolation[] => {
  const violations: DaisyUiViolation[] = [];
  for (const radialTag of fileContent.matchAll(RADIAL_PROGRESS_TAG_PATTERN)) {
    const tag = radialTag[0];
    const line = getLineFromOffset(fileContent, radialTag.index ?? 0);
    if (!RADIAL_ROLE_PATTERN.test(tag)) {
      violations.push({
        filePath,
        line,
        message: 'daisyUI radial-progress requires `role="progressbar"`.',
      });
    }
    if (!RADIAL_VALUE_NOW_PATTERN.test(tag)) {
      violations.push({
        filePath,
        line,
        message: "daisyUI radial-progress requires `aria-valuenow`.",
      });
    }
    if (!STYLE_ATTRIBUTE_PATTERN.test(tag)) {
      violations.push({
        filePath,
        line,
        message:
          "daisyUI radial-progress requires a style or `:style` binding for the `--value` contract.",
      });
    }
  }
  return violations;
};

const STATIC_CLASS_ATTRIBUTE_PATTERN = /\bclass\s*=\s*["']([^"']+)["']/gu;
const WHITESPACE_SPLIT_PATTERN = /\s+/u;

const extractStaticClassTokens = (value: string): string[] =>
  value.split(WHITESPACE_SPLIT_PATTERN).filter((token) => token.length > 0);

/**
 * Stats shell SSOT: no static `class="stats ..."` in Vue files.
 * All stats rows must use STATS_SHELL_VARIANT_CLASS or STATS_ROW_SHELL_CLASS
 * from constants/layout.ts via `:class` binding.
 */
export const collectRawStatsClassViolations = (
  filePath: string,
  fileContent: string,
): DaisyUiViolation[] => {
  const violations: DaisyUiViolation[] = [];
  STATIC_CLASS_ATTRIBUTE_PATTERN.lastIndex = 0;
  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    const tokens = extractStaticClassTokens(classMatch[1] ?? "");
    if (tokens.includes("stats")) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, classMatch.index ?? 0),
        message:
          "Raw `stats` class in a static class attribute is forbidden. Use STATS_SHELL_VARIANT_CLASS or STATS_ROW_SHELL_CLASS from ~/constants/layout via a :class binding.",
      });
    }
  }
  return violations;
};

const DYNAMIC_CLASS_BINDING_PATTERN = /:class\s*=\s*"([^"]+)"/gu;
const DYNAMIC_STRING_LITERAL_PATTERN = /["']([^"']+)["']/gu;

/**
 * daisyUI semantic color-variant SSOT: no raw `btn-*` / `badge-*` /
 * `progress-*` / `alert-*` color literals inside `:class` bindings.
 * Use BTN_VARIANT_CLASS / BADGE_VARIANT_CLASS / PROGRESS_BAR_VARIANT_CLASS /
 * ALERT_VARIANT_CLASS from ~/constants/layout via a :class binding.
 */
const DYNAMIC_VARIANT_LITERAL_PATTERN =
  /^(?:btn|badge|progress|alert)-(?:primary|secondary|accent|neutral|info|success|warning|error|ghost)$/u;

export const collectDynamicVariantLiteralViolations = (
  filePath: string,
  fileContent: string,
): DaisyUiViolation[] => {
  const violations: DaisyUiViolation[] = [];
  DYNAMIC_CLASS_BINDING_PATTERN.lastIndex = 0;
  for (const bindingMatch of fileContent.matchAll(DYNAMIC_CLASS_BINDING_PATTERN)) {
    const bindingValue = bindingMatch[1] ?? "";
    const baseLine = getLineFromOffset(fileContent, bindingMatch.index ?? 0);
    DYNAMIC_STRING_LITERAL_PATTERN.lastIndex = 0;
    for (const literalMatch of bindingValue.matchAll(DYNAMIC_STRING_LITERAL_PATTERN)) {
      const literal = literalMatch[1] ?? "";
      if (DYNAMIC_VARIANT_LITERAL_PATTERN.test(literal)) {
        violations.push({
          filePath,
          line: baseLine,
          message: `Raw daisyUI color-variant literal "${literal}" in a :class binding is forbidden. Use BTN_VARIANT_CLASS / BADGE_VARIANT_CLASS / PROGRESS_BAR_VARIANT_CLASS / ALERT_VARIANT_CLASS from ~/constants/layout.`,
        });
      }
    }
  }
  return violations;
};

export const collectBrandPreviewThemeViolations = (
  filePath: string,
  fileContent: string,
): DaisyUiViolation[] => {
  if (filePath !== BRAND_PREVIEW_STYLES_FILE_PATH) {
    return [];
  }

  const previewSurfaceOffset = fileContent.indexOf("function paletteRules");
  const previewSurfaceLine =
    previewSurfaceOffset >= 0 ? getLineFromOffset(fileContent, previewSurfaceOffset) : 1;

  const missingOwner =
    fileContent.includes("function paletteRules") && fileContent.includes("useBrandPreviewStyles")
      ? []
      : [
          {
            filePath,
            line: previewSurfaceLine,
            message:
              "Brand preview CSS variable owner must export `paletteRules` via `useBrandPreviewStyles` (no Vue `:style` bindings).",
          },
        ];

  const missingVariables = BRAND_PREVIEW_REQUIRED_THEME_VARIABLES.filter(
    (variableName) => !fileContent.includes(variableName),
  ).map((variableName) => ({
    filePath,
    line: previewSurfaceLine,
    message: `Brand preview surfaces must scope \`${variableName}\` inside \`paletteRules\` / \`useBrandPreviewStyles\` so daisyUI semantic classes render the preview palette instead of the outer app theme.`,
  }));

  return [...missingOwner, ...missingVariables];
};
