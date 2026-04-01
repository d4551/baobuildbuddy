import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

type FileContract = {
  filePath: string;
  requiredClasses: string[];
  description: string;
};

type SameAttributeDisallowedRequirement = {
  baseClass: string;
  disallowedClasses: readonly string[];
  message: string;
};

const REQUIRED_FILE_CONTRACTS: readonly FileContract[] = [
  {
    filePath: "packages/client/layouts/default.vue",
    requiredClasses: ["drawer", "drawer-toggle", "drawer-content", "drawer-side", "drawer-overlay"],
    description: "App shell keeps the blueprint drawer structure intact.",
  },
  {
    filePath: "packages/client/components/layout/AppNavbar.vue",
    requiredClasses: ["navbar", "navbar-start", "navbar-center", "navbar-end"],
    description: "Shared navbar keeps daisyUI navbar semantics for the shell header.",
  },
] as const;

const SCAN_ROOTS = [
  "packages/client/layouts",
  "packages/client/pages",
  "packages/client/components",
] as const;

const STATIC_CLASS_ATTRIBUTE_PATTERN = /\bclass\s*=\s*["']([^"']+)["']/gu;
const SINGLE_CLASS_ATTRIBUTE_PATTERN = /\bclass\s*=\s*["']([^"']+)["']/u;
const TABLE_TAG_PATTERN = /<table\b[^>]*>/gu;
const PROGRESS_TAG_PATTERN = /<progress\b[^>]*>/gu;
const RADIAL_PROGRESS_TAG_PATTERN =
  /<[^>]*class\s*=\s*["'][^"']*\bradial-progress\b[^"']*["'][^>]*>/gu;
const WHITESPACE_PATTERN = /\s+/u;
const RADIAL_ROLE_PATTERN = /\brole\s*=\s*["']progressbar["']/u;
const RADIAL_VALUE_NOW_PATTERN = /\baria-valuenow\s*=\s*/u;
const STYLE_ATTRIBUTE_PATTERN = /\b:style\s*=\s*["'][^"']+["']|\bstyle\s*=\s*["'][^"']+["']/u;

const SAME_ATTRIBUTE_BASE_REQUIREMENTS = [
  { baseClass: "btn", modifierPattern: /^btn-/u },
  { baseClass: "table", modifierPattern: /^table-/u },
  { baseClass: "progress", modifierPattern: /^progress-/u },
] as const;

const FILE_LEVEL_PART_REQUIREMENTS = [
  {
    baseClass: "card",
    partClasses: ["card-body", "card-title", "card-actions"],
  },
  {
    baseClass: "drawer",
    partClasses: ["drawer-toggle", "drawer-content", "drawer-side", "drawer-overlay"],
  },
  {
    baseClass: "navbar",
    partClasses: ["navbar-start", "navbar-center", "navbar-end"],
  },
  {
    baseClass: "list",
    partClasses: ["list-row"],
  },
] as const;

const SAME_ATTRIBUTE_DISALLOWED_REQUIREMENTS: readonly SameAttributeDisallowedRequirement[] = [
  {
    baseClass: "list",
    disallowedClasses: ["list-disc", "list-inside"],
    message:
      "daisyUI `list` already defines the list primitive; do not combine it with Tailwind bullet-list classes.",
  },
] as const;

const BTN_SEMANTIC_MODIFIERS = [
  "btn-primary",
  "btn-secondary",
  "btn-accent",
  "btn-neutral",
  "btn-info",
  "btn-success",
  "btn-warning",
  "btn-error",
  "btn-outline",
  "btn-ghost",
  "btn-soft",
  "btn-dash",
  "btn-link",
  "btn-active",
  "btn-disabled",
] as const;

const BRAND_PREVIEW_FILE_PATH = "packages/client/components/settings/brand/BrandPreviewCard.vue";
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

const collectVueFiles = async (): Promise<string[]> => {
  const fileGroups = await Promise.all(
    SCAN_ROOTS.map(async (root) => {
      const glob = new Bun.Glob(`${root}/**/*.vue`);
      return Array.fromAsync(glob.scan({ cwd: process.cwd(), onlyFiles: true }));
    }),
  );

  return fileGroups
    .flat()
    .map((filePath) => filePath.replace(/\\/gu, "/"))
    .filter((filePath) => !shouldIgnorePath(filePath));
};

const collectRequiredClassViolations = (filePath: string, fileContent: string): Violation[] => {
  const classTokens = new Set<string>();
  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    for (const token of extractClassTokens(classMatch[1])) {
      classTokens.add(token);
    }
  }

  const fileContract = REQUIRED_FILE_CONTRACTS.find((contract) => contract.filePath === filePath);
  if (!fileContract) {
    return [];
  }

  return fileContract.requiredClasses
    .filter((className) => !classTokens.has(className))
    .map((className) => ({
      filePath,
      line: 1,
      message: `${fileContract.description} Missing required class \`${className}\`.`,
    }));
};

const collectSemanticModifierViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    const tokens = extractClassTokens(classMatch[1]);
    for (const requirement of SAME_ATTRIBUTE_BASE_REQUIREMENTS) {
      if (
        tokens.some((token) => requirement.modifierPattern.test(token)) &&
        !tokens.includes(requirement.baseClass)
      ) {
        violations.push({
          filePath,
          line: getLineFromOffset(fileContent, classMatch.index ?? 0),
          message: `Class list uses ${requirement.baseClass} modifiers without the base \`${requirement.baseClass}\` class.`,
        });
      }
    }
  }
  return violations;
};

const collectFileLevelPartViolations = (filePath: string, fileContent: string): Violation[] => {
  const firstLineByClass = new Map<string, number>();
  const classTokens = new Set<string>();

  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    const line = getLineFromOffset(fileContent, classMatch.index ?? 0);
    for (const token of extractClassTokens(classMatch[1])) {
      classTokens.add(token);
      if (!firstLineByClass.has(token)) {
        firstLineByClass.set(token, line);
      }
    }
  }

  return FILE_LEVEL_PART_REQUIREMENTS.flatMap((requirement) =>
    requirement.partClasses
      .filter((partClass) => classTokens.has(partClass) && !classTokens.has(requirement.baseClass))
      .map((partClass) => ({
        filePath,
        line: firstLineByClass.get(partClass) ?? 1,
        message: `File uses \`${partClass}\` without the base \`${requirement.baseClass}\` class.`,
      })),
  );
};

const collectTableMarkupViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
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

const collectProgressMarkupViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
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

const collectRadialProgressViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
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

const collectIncompatibleClassViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    const tokens = extractClassTokens(classMatch[1]);
    for (const requirement of SAME_ATTRIBUTE_DISALLOWED_REQUIREMENTS) {
      if (!tokens.includes(requirement.baseClass)) {
        continue;
      }

      const foundDisallowedClass = requirement.disallowedClasses.find((className) =>
        tokens.includes(className),
      );
      if (!foundDisallowedClass) {
        continue;
      }

      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, classMatch.index ?? 0),
        message: `${requirement.message} Remove \`${foundDisallowedClass}\`.`,
      });
    }
  }
  return violations;
};

const collectBtnModifierViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    const tokens = extractClassTokens(classMatch[1]);
    if (!tokens.includes("btn")) {
      continue;
    }
    const hasModifier = BTN_SEMANTIC_MODIFIERS.some((mod) => tokens.includes(mod));
    if (!hasModifier) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, classMatch.index ?? 0),
        message:
          "daisyUI `btn` requires a semantic modifier (e.g. btn-primary, btn-ghost, btn-outline).",
      });
    }
  }
  return violations;
};

const collectBrandPreviewThemeViolations = (filePath: string, fileContent: string): Violation[] => {
  if (filePath !== BRAND_PREVIEW_FILE_PATH) {
    return [];
  }

  const previewSurfaceOffset = fileContent.indexOf("const createPreviewSurfaceStyle");
  const previewSurfaceLine =
    previewSurfaceOffset >= 0 ? getLineFromOffset(fileContent, previewSurfaceOffset) : 1;

  return BRAND_PREVIEW_REQUIRED_THEME_VARIABLES.filter(
    (variableName) => !fileContent.includes(variableName),
  ).map((variableName) => ({
    filePath,
    line: previewSurfaceLine,
    message: `Brand preview surfaces must scope \`${variableName}\` inside \`createPreviewSurfaceStyle\` so daisyUI semantic classes render the preview palette instead of the outer app theme.`,
  }));
};

/**
 * Collect daisyUI contract violations for a single Vue file payload.
 *
 * This is exported so package tests can lock validator behavior without spawning the full script.
 */
export function collectDaisyUiContractViolationsForContent(
  filePath: string,
  fileContent: string,
): Violation[] {
  return [
    ...collectRequiredClassViolations(filePath, fileContent),
    ...collectSemanticModifierViolations(filePath, fileContent),
    ...collectBtnModifierViolations(filePath, fileContent),
    ...collectFileLevelPartViolations(filePath, fileContent),
    ...collectIncompatibleClassViolations(filePath, fileContent),
    ...collectTableMarkupViolations(filePath, fileContent),
    ...collectProgressMarkupViolations(filePath, fileContent),
    ...collectRadialProgressViolations(filePath, fileContent),
    ...collectBrandPreviewThemeViolations(filePath, fileContent),
  ];
}

const collectScopeViolations = async (): Promise<Violation[]> => {
  const files = await collectVueFiles();
  const fileViolationGroups = await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await Bun.file(filePath).text();
      return collectDaisyUiContractViolationsForContent(filePath, fileContent);
    }),
  );
  return fileViolationGroups.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectScopeViolations();
  if (violations.length === 0) {
    await writeOutput("daisyUI component contract validation passed.");
    return;
  }

  await writeError("daisyUI component contract validation failed:");
  await writeError(
    violations
      .map((violation) => `- ${violation.filePath}:${violation.line} ${violation.message}`)
      .join("\n"),
  );
  process.exit(1);
};

if (import.meta.main) {
  await main();
}
