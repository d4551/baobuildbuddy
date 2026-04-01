import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const schemaPattern = /\b(?:Type|z)\.(?:Object|object)\(\{[\s\S]*?\}\)/gu;

const normalizeSchema = (value: string): string =>
  value.replace(/\s+/gu, " ").replace(/['"`]/gu, '"').trim();

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots: ["packages/server/src", "packages/shared/src"],
    allowedExtensions: new Set([".ts"]),
  });

  const seenSchemas = new Map<string, { filePath: string; line: number }>();
  const violations: ValidationViolation[] = [];

  for (const { filePath, content } of files) {
    schemaPattern.lastIndex = 0;
    for (const match of content.matchAll(schemaPattern)) {
      const rawValue = match[0] ?? "";
      if (rawValue.length < 120) {
        continue;
      }
      const normalizedSchema = normalizeSchema(rawValue);
      const line = getLineFromOffset(content, match.index ?? 0);
      const previous = seenSchemas.get(normalizedSchema);
      if (previous) {
        violations.push({
          filePath,
          line,
          message: `Schema block duplicates ${previous.filePath}:${previous.line}. Extract the shared schema instead of copying it.`,
        });
        continue;
      }
      seenSchemas.set(normalizedSchema, { filePath, line });
    }
  }

  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Schema duplication validation failed:",
    await collectViolations(),
    "Schema duplication validation passed.",
  );
}
