import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const pageStateReferencePattern = /\b(?:uiState|[a-z][A-Za-z0-9]*UiState)\b/u;
const pageStateComponentSignalPatterns = [
  /<LoadingSkeleton\b/u,
  /<BootstrapErrorAlert\b/u,
  /<EmptyState\b/u,
] as const;
/** Evidence = mounted empty primitive only — string `'empty'` alone is softening. */
const emptyStateEvidencePatterns = [
  /<EmptyState\b/u,
  /<DashboardOnboardingCard\b/u,
] as const;
const emptyStateRequirementPatterns = [/['"]empty['"]/u, /\bisEmpty\b/u] as const;
const requiredStatePatterns = {
  loading: [/['"](?:loading|idle)['"]/u, /<LoadingSkeleton\b/u],
  error: [/['"](?:error[^'"]*|unauthorized)['"]/u, /<BootstrapErrorAlert\b/u],
} as const;
const successStatePattern = /['"]success['"]/u;
const successFallbackPattern = /\bv-else(?:\s|>)/u;

const matchesAnyPattern = (content: string, patterns: readonly RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(content));

const exposesPageStateContract = (content: string): boolean =>
  pageStateReferencePattern.test(content) ||
  pageStateComponentSignalPatterns.filter((pattern) => pattern.test(content)).length >= 2;

const requiresEmptyState = (content: string): boolean =>
  matchesAnyPattern(content, emptyStateRequirementPatterns);

const hasExplicitEmptyState = (content: string): boolean =>
  matchesAnyPattern(content, emptyStateEvidencePatterns);

export const collectPageStateViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!exposesPageStateContract(content)) {
    return [];
  }

  const missingStates = Object.entries(requiredStatePatterns).flatMap(
    ([stateName, statePatterns]) =>
      statePatterns.some((statePattern) => statePattern.test(content)) ? [] : [stateName],
  );
  if (requiresEmptyState(content) && !hasExplicitEmptyState(content)) {
    missingStates.push("empty");
  }
  if (!(successStatePattern.test(content) || successFallbackPattern.test(content))) {
    missingStates.push("success");
  }

  if (missingStates.length === 0) {
    return [];
  }

  return [
    {
      filePath,
      line: 1,
      message: `Page exposes a UI state contract but is missing explicit states: ${missingStates.join(", ")}.`,
    },
  ] satisfies ValidationViolation[];
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client/pages"],
    allowedExtensions: new Set([".vue"]),
  });

  return files.flatMap(({ filePath, content }) =>
    collectPageStateViolationsForContent(filePath, content),
  );
};

if (import.meta.main) {
  await reportViolations(
    "Page state contract validation failed:",
    await collectViolations(),
    "Page state contract validation passed.",
  );
}
