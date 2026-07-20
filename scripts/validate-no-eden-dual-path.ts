/**
 * Ban requestApi + API_ENDPOINTS.automation* once Eden AutomationApi owns the branch.
 * Softening ban: typed Eden fabric must be the sole HTTP path for automation mutations/queries.
 */
import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const scanRoots = ["packages/client"] as const;
const allowedExtensions = new Set([".vue", ".ts"]);

const REQUEST_API_AUTOMATION_PATTERN =
  /requestApi\s*(?:<[^>]*>)?\s*\([^)]*API_ENDPOINTS\.automation/gu;
const BUILD_AUTOMATION_RUN_PATTERN = /buildAutomationRunEndpoint\s*\(/gu;

const isAllowedFile = (filePath: string): boolean =>
  filePath.endsWith(".test.ts") ||
  filePath.endsWith(".spec.ts") ||
  filePath.includes("/locales/");

export const collectEdenDualPathViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (isAllowedFile(filePath)) {
    return [];
  }
  const violations: ValidationViolation[] = [];
  for (const match of content.matchAll(REQUEST_API_AUTOMATION_PATTERN)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      message:
        "Automation HTTP must use Eden useApi().automation.* — requestApi(API_ENDPOINTS.automation*) dual path banned.",
    });
  }
  for (const match of content.matchAll(BUILD_AUTOMATION_RUN_PATTERN)) {
    if (filePath.includes("/composables/useAutomation.ts")) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message:
          "useAutomation must resolve runs via Eden api.automation.runs({ id }) — buildAutomationRunEndpoint dual path banned.",
      });
    }
  }
  return violations;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions,
  });
  return files.flatMap(({ filePath, content }) =>
    collectEdenDualPathViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Eden dual-path validation failed:",
    await collectViolations(),
    "Eden dual-path validation passed.",
  );
}
