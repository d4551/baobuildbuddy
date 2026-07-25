import {
  FORBIDDEN_FEATURE_TREE_PREFIXES,
  isForbiddenConsumerExemptionPath,
} from "./ui-control-primitive-owners";
import { isUiSsotAuthority } from "./ui-ssot-authority";
import {
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Meta-gate: UI validators must not carry consumer path allowlists or
 * feature-tree startsWith waivers. Authority + control-primitive owners only.
 */

const VALIDATOR_FILE_PATTERN =
  /^scripts\/(?:validate-ui-[\w-]+\.ts|validate-no-raw-design-tokens\.ts)$/u;

const PATH_LITERAL_PATTERN =
  /["'](packages\/client\/(?:pages|components|layouts|composables)\/[^"']+)["']/gu;

const STARTS_WITH_FEATURE_PATTERN =
  /\.startsWith\(\s*["'](packages\/client\/(?:pages|components)\/[^"']+)["']\s*\)/gu;

const ALLOWLIST_SET_NAME_PATTERN =
  /(?:SSOT_ALLOWLIST_PATHS|ALLOWLIST_PATHS|EXEMPT_PATHS)\s*=\s*new\s+Set/u;

const collectStartsWithViolations = (filePath: string, content: string): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  STARTS_WITH_FEATURE_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(STARTS_WITH_FEATURE_PATTERN)) {
    const prefix = match[1] ?? "";
    const isForbiddenPrefix = FORBIDDEN_FEATURE_TREE_PREFIXES.some(
      (forbidden) => prefix === forbidden || prefix.startsWith(forbidden),
    );
    const isUiOrIcons =
      prefix.startsWith("packages/client/components/ui/") ||
      prefix.startsWith("packages/client/components/icons/");
    if (isForbiddenPrefix || (!isUiOrIcons && prefix.startsWith("packages/client/components/"))) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Forbidden feature-tree startsWith waiver "${prefix}". Use isUiSsotAuthority / isControlPrimitiveOwner only — zero consumer exemptions.`,
      });
    }
    if (prefix.startsWith("packages/client/pages/")) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Forbidden pages/ startsWith waiver "${prefix}". Pages are never SSOT-exempt.`,
      });
    }
  }
  return violations;
};

const collectAllowlistSetViolations = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!ALLOWLIST_SET_NAME_PATTERN.test(content)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  PATH_LITERAL_PATTERN.lastIndex = 0;
  for (const match of content.matchAll(PATH_LITERAL_PATTERN)) {
    const pathLiteral = match[1] ?? "";
    if (isUiSsotAuthority(pathLiteral)) continue;
    if (!isForbiddenConsumerExemptionPath(pathLiteral)) continue;
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message: `Consumer path "${pathLiteral}" in an allowlist Set. Delete the exemption; fix the consumer source (ui-ux). Only AUTHORITY_PATHS + CONTROL_PRIMITIVE_OWNERS may be exempt.`,
    });
  }
  return violations;
};

export const collectSsotAuthorityMetaViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!VALIDATOR_FILE_PATTERN.test(filePath)) return [];
  if (
    filePath === "scripts/validate-ui-ssot-authority.ts" ||
    filePath === "scripts/ui-ssot-authority.ts" ||
    filePath === "scripts/ui-control-primitive-owners.ts"
  ) {
    return [];
  }
  if (filePath.endsWith(".test.ts")) return [];

  return [
    ...collectStartsWithViolations(filePath, content),
    ...collectAllowlistSetViolations(filePath, content),
  ];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const glob = new Bun.Glob("scripts/validate-*.ts");
  const files: string[] = [];
  for await (const relative of glob.scan({ cwd: process.cwd(), onlyFiles: true })) {
    const normalized = relative.replace(/\\/gu, "/");
    if (VALIDATOR_FILE_PATTERN.test(normalized) && !normalized.endsWith(".test.ts")) {
      files.push(normalized);
    }
  }

  const violationGroups = await Promise.all(
    files.map(async (filePath) =>
      collectSsotAuthorityMetaViolationsForContent(filePath, await Bun.file(filePath).text()),
    ),
  );
  return violationGroups.flat();
};

if (import.meta.main) {
  await reportViolations(
    "UI SSOT authority meta-gate failed:",
    await collectViolations(),
    "UI SSOT authority meta-gate passed.",
  );
}
