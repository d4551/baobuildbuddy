import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const requiredStateFragments = ["loading", "error", "empty"] as const;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/client/pages"],
    allowedExtensions: new Set([".vue"]),
  });

  return files.flatMap(({ filePath, content }) => {
    if (!content.includes("uiState")) {
      return [];
    }

    const missingStates = requiredStateFragments.filter(
      (stateFragment) =>
        !(content.includes(`'${stateFragment}'`) || content.includes(`"${stateFragment}"`)),
    );
    if (missingStates.length === 0) {
      return [];
    }

    return [
      {
        filePath,
        line: 1,
        message: `Page exposes uiState but is missing explicit states: ${missingStates.join(", ")}.`,
      },
    ] satisfies ValidationViolation[];
  });
};

if (import.meta.main) {
  await reportViolations(
    "Page state contract validation failed:",
    await collectViolations(),
    "Page state contract validation passed.",
  );
}
