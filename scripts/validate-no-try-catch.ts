import { writeError, writeOutput } from "./utils/cli-output";

type Violation = {
  filePath: string;
  line: number;
};

const projectRoot = process.cwd();
const scanRoots = ["packages", "scripts"] as const;
const allowedExtensions = new Set([".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs", ".ps1"]);
const ignoredDirectoryNames = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
]);
const tryPattern = /\btry\s*\{/gu;

const hasAllowedExtension = (pathValue: string): boolean => {
  const normalized = pathValue.toLowerCase();
  for (const extension of allowedExtensions) {
    if (normalized.endsWith(extension)) {
      return true;
    }
  }
  return false;
};

const shouldIgnorePath = (pathValue: string): boolean =>
  pathValue.split("/").some((segment) => ignoredDirectoryNames.has(segment));

const getLineFromOffset = (text: string, offset: number): number => {
  if (offset <= 0) {
    return 1;
  }

  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
    }
  }

  return line;
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
        .filter((normalizedPath) => hasAllowedExtension(normalizedPath) && !shouldIgnorePath(normalizedPath));
    }),
  );

  return fileGroups.flat();
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectSourceFiles();
  const violationGroups = await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await Bun.file(filePath).text();
      tryPattern.lastIndex = 0;
      return Array.from(fileContent.matchAll(tryPattern), (match) => ({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
      }));
    }),
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
  const lines = violations.map((violation) => `- ${violation.filePath}:${violation.line}`);
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }

  process.exit(1);
};

await main();
