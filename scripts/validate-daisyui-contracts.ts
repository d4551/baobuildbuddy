import {
  BRAND_PREVIEW_STYLES_FILE_PATH,
  collectBrandPreviewThemeViolations,
  collectProgressMarkupViolations,
  collectRadialProgressViolations,
  collectTableMarkupViolations,
  type DaisyUiViolation,
} from "./validate-daisyui-contracts-markup";
import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";

type Violation = DaisyUiViolation;

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
const UI_GLASS_CARD_TAG_PATTERN = /<UiGlassCard\b/u;
const WHITESPACE_PATTERN = /\s+/u;

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

/**
 * Layout SSOT surface class constants that carry the `card` base class.
 * When a Vue file uses a `:class` binding to one of these constants, the
 * validator recognizes that the file satisfies the card → card-body/title/actions
 * contract even though the raw string `card` does not appear in a static
 * `class="..."` attribute.
 */
const SSOT_SURFACE_CONSTANTS_WITH_CARD = [
  "SURFACE_GLASS_CARD_CLASS",
  "SURFACE_GLASS_CARD_STRONG_CLASS",
  "SURFACE_GLASS_CARD_MODAL_CLASS",
  "AUTH_CARD_SHELL_CLASS",
  // Canonical glass card primitive wraps SURFACE_GLASS_CARD_CLASS internally.
  "UiGlassCard",
] as const;

const SSOT_SURFACE_CONSTANT_USAGE_PATTERN = new RegExp(
  `:class=["'](?:\\[.*?)?(${SSOT_SURFACE_CONSTANTS_WITH_CARD.join("|")})\\b`,
  "u",
);

// Also create a global variant for matchAll-style scanning
const SSOT_SURFACE_CONSTANT_USAGE_PATTERN_GLOBAL = new RegExp(
  SSOT_SURFACE_CONSTANT_USAGE_PATTERN.source,
  "gu",
);

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
  // Scan static class="..." attributes
  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    for (const token of extractClassTokens(classMatch[1])) {
      classTokens.add(token);
    }
  }
  // Recognize SSOT surface constants that carry `card` implicitly
  if (SSOT_SURFACE_CONSTANT_USAGE_PATTERN.test(fileContent)) {
    classTokens.add("card");
  }
  // UiGlassCard component usage implicitly carries the `card` class
  if (UI_GLASS_CARD_TAG_PATTERN.test(fileContent)) {
    classTokens.add("card");
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

  // Scan static class="..." attributes
  for (const classMatch of fileContent.matchAll(STATIC_CLASS_ATTRIBUTE_PATTERN)) {
    const line = getLineFromOffset(fileContent, classMatch.index ?? 0);
    for (const token of extractClassTokens(classMatch[1])) {
      classTokens.add(token);
      if (!firstLineByClass.has(token)) {
        firstLineByClass.set(token, line);
      }
    }
  }
  // Scan SSOT surface constant bindings that carry `card` implicitly
  if (SSOT_SURFACE_CONSTANT_USAGE_PATTERN.test(fileContent)) {
    classTokens.add("card");
    // Find the first SURFACE_GLASS_CARD_CLASS occurrence for line reporting
    // Reset the global variant since .test() advanced lastIndex on the non-global won't matter
    SSOT_SURFACE_CONSTANT_USAGE_PATTERN_GLOBAL.lastIndex = 0;
    const firstSurfaceMatch = SSOT_SURFACE_CONSTANT_USAGE_PATTERN_GLOBAL.exec(fileContent);
    if (firstSurfaceMatch && !firstLineByClass.has("card")) {
      firstLineByClass.set("card", getLineFromOffset(fileContent, firstSurfaceMatch.index));
    }
  }
  // UiGlassCard component usage implicitly carries the `card` class
  if (UI_GLASS_CARD_TAG_PATTERN.test(fileContent)) {
    classTokens.add("card");
    if (!firstLineByClass.has("card")) {
      const match = UI_GLASS_CARD_TAG_PATTERN.exec(fileContent);
      if (match) {
        firstLineByClass.set("card", getLineFromOffset(fileContent, match.index));
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
  const brandPreviewStylesPath = BRAND_PREVIEW_STYLES_FILE_PATH;
  const scopedFiles = files.includes(brandPreviewStylesPath)
    ? files
    : [...files, brandPreviewStylesPath];
  const fileViolationGroups = await Promise.all(
    scopedFiles.map(async (filePath) => {
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
