import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const requiredLandmarkChecks = [
  {
    filePath: "packages/client/layouts/default.vue",
    includes: "<main",
    message: "Default layout must expose a main landmark.",
  },
  {
    filePath: "packages/client/layouts/auth-shell.vue",
    includes: "<main",
    message: "Auth shell must expose a main landmark.",
  },
] as const;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const entries = await collectProjectFileEntries({
    scanRoots: ["packages/client/layouts"],
    allowedExtensions: new Set([".vue"]),
  });
  const contentByPath = new Map(
    entries.map(({ filePath, content }) => [filePath, content] as const),
  );

  return requiredLandmarkChecks.flatMap(({ filePath, includes, message }) => {
    const content = contentByPath.get(filePath);
    if (content?.includes(includes)) {
      return [];
    }
    return [{ filePath, line: 1, message }] satisfies ValidationViolation[];
  });
};

if (import.meta.main) {
  await reportViolations(
    "Accessibility landmark validation failed:",
    await collectViolations(),
    "Accessibility landmark validation passed.",
  );
}
