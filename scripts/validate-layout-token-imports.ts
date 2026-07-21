import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Layout token identifiers that must be explicitly imported when referenced in SFCs.
 * Nuxt auto-import is not reliable for constants used only in templates under SSR.
 */
export const REQUIRED_LAYOUT_TOKEN_IMPORTS = [
  "STACK_SPACE_Y_TOKEN_CLASS",
  "TYPOGRAPHY_SCALE_CLASS",
  "FLEX_GAP_TOKEN_CLASS",
  "PADDING_TOKEN_CLASS",
  "MARGIN_TOKEN_CLASS",
  "SURFACE_GLASS_CARD_CLASS",
  "ICON_SIZE_CLASS",
] as const;

const LAYOUT_TOKENS_DIRECT_IMPORT_PATTERN = /from\s+["']~\/constants\/layout-tokens["']/gu;

const isLayoutTokenOwner = (filePath: string): boolean =>
  filePath === "packages/client/constants/layout.ts" ||
  filePath === "packages/client/constants/layout-shell.ts" ||
  filePath === "packages/client/constants/layout-tokens.ts" ||
  filePath.endsWith("/validate-layout-token-imports.ts") ||
  filePath.endsWith("/validate-layout-token-imports.test.ts") ||
  filePath.includes("/tests/");

export const collectDirectLayoutTokensImportViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isLayoutTokenOwner(filePath)) return [];
  if (!filePath.startsWith("packages/client/")) return [];
  if (!LAYOUT_TOKENS_DIRECT_IMPORT_PATTERN.test(content)) return [];
  return [
    {
      filePath,
      line: 1,
      message: `Direct import from ~/constants/layout-tokens bypasses public layout SSOT. Import tokens from ~/constants/layout only.`,
    },
  ];
};

export const collectMissingLayoutTokenImportViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!filePath.endsWith(".vue")) {
    return [];
  }

  const violations: ValidationViolation[] = [
    ...collectDirectLayoutTokensImportViolationsForContent(filePath, content),
  ];
  for (const tokenName of REQUIRED_LAYOUT_TOKEN_IMPORTS) {
    const usagePattern = new RegExp(`\\b${tokenName}\\b`, "u");
    if (!usagePattern.test(content)) {
      continue;
    }
    const importPattern = new RegExp(`import\\s*\\{[^}]*\\b${tokenName}\\b[^}]*\\}`, "u");
    if (importPattern.test(content)) {
      continue;
    }
    violations.push({
      filePath,
      line: 1,
      message: `Template/script references ${tokenName} without importing it from ~/constants/layout (SSR will crash with undefined token).`,
    });
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client"],
    allowedExtensions: new Set([".vue"]),
  });
  return files.flatMap(({ filePath, content }) =>
    collectMissingLayoutTokenImportViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Layout token import validation failed:",
    await collectViolations(),
    "Layout token import validation passed.",
  );
}
