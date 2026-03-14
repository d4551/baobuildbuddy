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
            hasAllowedExtension(normalizedPath) && !shouldIgnorePath(normalizedPath),
        );
    }),
  );

  return fileGroups.flat();
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectSourceFiles();
  const violationGroups = await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await Bun.file(filePath).text();
      unsafeCastPattern.lastIndex = 0;
      return Array.from(fileContent.matchAll(unsafeCastPattern))
        .map((match) => {
          const castType = match[1];
          if (castType !== "any" && castType !== "unknown") {
            return null;
          }

          return {
            filePath,
            line: getLineFromOffset(fileContent, match.index ?? 0),
            castType,
          };
        })
        .filter((violation): violation is Violation => violation !== null);
    }),
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

await main();
