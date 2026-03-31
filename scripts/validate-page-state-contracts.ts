import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const pageStateReferencePattern = /\b(?:uiState|[a-z][A-Za-z0-9]*UiState)\b/u;
const requiredStatePatterns = {
  loading: /['"](?:loading|idle)['"]/u,
  error: /['"](?:error[^'"]*|unauthorized)['"]/u,
  empty: /['"]empty['"]/u,
} as const;
const successStatePattern = /['"]success['"]/u;
const successFallbackPattern = /\bv-else(?:\s|>)/u;

export const collectPageStateViolationsForContent = (
  filePath: string,
  content: string,
): ValidationViolation[] => {
  if (!pageStateReferencePattern.test(content)) {
    return [];
  }

  const missingStates = Object.entries(requiredStatePatterns).flatMap(([stateName, statePattern]) =>
    statePattern.test(content) ? [] : [stateName],
  );
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
