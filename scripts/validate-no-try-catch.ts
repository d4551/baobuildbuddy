import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

const projectRoot = process.cwd();
const scanRoots = ["packages", "scripts"] as const;
const allowedExtensions = new Set([".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs", ".ps1"]);
const tryPattern = /\btry\s*\{/gu;
const promiseCatchPattern = /\.\s*catch\s*\(/gu;

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
            hasAllowedExtension(normalizedPath) && !shouldIgnorePath(normalizedPath),
        );
    }),
  );

  return fileGroups.flat();
};

export const collectNoTryCatchViolationsForContent = (
  filePath: string,
  fileContent: string,
): Violation[] => {
  const violations: Violation[] = [];

  tryPattern.lastIndex = 0;
  for (const match of fileContent.matchAll(tryPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      message: "try/catch blocks are disallowed. Use result unions or explicit error branches.",
    });
  }

  promiseCatchPattern.lastIndex = 0;
  for (const match of fileContent.matchAll(promiseCatchPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      message: "Promise catch handlers are disallowed. Use explicit result handling instead.",
    });
  }

  return violations;
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectSourceFiles();
  const violationGroups = await Promise.all(
    files.map(async (filePath) =>
      collectNoTryCatchViolationsForContent(filePath, await Bun.file(filePath).text()),
    ),
  );

  return violationGroups.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput("No try/catch blocks found.");
    return;
  }

  await writeError("try/catch blocks are disallowed. Found:");
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} ${violation.message}`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }

  process.exit(1);
};

if (import.meta.main) {
  await main();
}
