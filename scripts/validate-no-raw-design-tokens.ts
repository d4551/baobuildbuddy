import {
  collectProjectFileEntries,
  getLineFromOffset,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

const sourceExtensions = new Set([".vue", ".ts", ".css"]);
const scanRoots = ["packages/client"] as const;
const rawPalettePattern =
  /\b(?:bg|text|border|from|to|via|ring|stroke|fill)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b/gu;
const arbitraryTokenPattern =
  /\b(?:p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|space-x|space-y|w|h|min-w|min-h|max-w|max-h|rounded|shadow)-\[[^\]]+\]/gu;

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const files = await collectProjectFileEntries({
    scanRoots,
    allowedExtensions: sourceExtensions,
  });

  return files.flatMap(({ filePath, content }) => {
    const violations: ValidationViolation[] = [];

    rawPalettePattern.lastIndex = 0;
    for (const match of content.matchAll(rawPalettePattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Raw Tailwind palette token "${match[0]}" is forbidden. Use semantic daisyUI tokens or shared constants.`,
      });
    }

    arbitraryTokenPattern.lastIndex = 0;
    for (const match of content.matchAll(arbitraryTokenPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        message: `Arbitrary design token "${match[0]}" is forbidden. Use the shared spacing and sizing scale.`,
      });
    }

    return violations;
  });
};

if (import.meta.main) {
  await reportViolations(
    "Raw design token validation failed:",
    await collectViolations(),
    "Raw design token validation passed.",
  );
}
