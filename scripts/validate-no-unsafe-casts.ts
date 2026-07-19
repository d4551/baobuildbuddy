import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";

type Violation = {
  filePath: string;
  line: number;
  castType: "any" | "unknown";
};

const projectRoot = process.cwd();
const scanRoots = ["packages", "scripts"] as const;
const allowedExtensions = new Set([".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs"]);
const unsafeCastPattern = /\bas\s+(any|unknown)\b/gu;

const hasAllowedExtension = (pathValue: string): boolean => {
  const normalized = pathValue.toLowerCase();
  for (const extension of allowedExtensions) {
    if (normalized.endsWith(extension)) {
      return true;
    }
  }
  return false;
};

const collectSourceFiles = async (): Promise<string[]> => {
  const fileGroups = await Promise.all(
    scanRoots.map(async (root) => {
      const glob = new Bun.Glob(`${root}/**/*`);
      const relativeFilePaths = await Array.fromAsync(
        glob.scan({ cwd: projectRoot, onlyFiles: true }),
      );

      return relativeFilePaths
        .map((relativeFilePath) => relativeFilePath.replace(/\\/gu, "/"))
        .filter(
          (normalizedPath) =>
            hasAllowedExtension(normalizedPath) &&
            !shouldIgnorePath(normalizedPath) &&
            !normalizedPath.includes(".test.") &&
            !normalizedPath.includes(".spec."),
        );
    }),
  );

  return fileGroups.flat();
};

export const collectUnsafeCastViolationsForContent = (
  filePath: string,
  fileContent: string,
): Violation[] => {
  const violations: Violation[] = [];
  unsafeCastPattern.lastIndex = 0;
  for (const match of fileContent.matchAll(unsafeCastPattern)) {
    const castType = match[1];
    if (castType !== "any" && castType !== "unknown") continue;
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      castType,
    });
  }
  return violations;
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectSourceFiles();
  const violationGroups = await Promise.all(
    files.map(async (filePath) =>
      collectUnsafeCastViolationsForContent(filePath, await Bun.file(filePath).text()),
    ),
  );
  return violationGroups.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput("No unsafe type casts (`as-any` / `as-unknown`) found.");
    return;
  }

  await writeError("Unsafe type casts are disallowed. Found:");
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} uses \`as ${violation.castType}\``,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }

  process.exit(1);
};

if (import.meta.main) {
  await main();
}
