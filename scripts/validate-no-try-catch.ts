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
  const files: string[] = [];

  for (const root of scanRoots) {
    const glob = new Bun.Glob(`${root}/**/*`);
    for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
      const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
      if (!hasAllowedExtension(normalizedPath) || shouldIgnorePath(normalizedPath)) {
        continue;
      }
      files.push(normalizedPath);
    }
  }

  return files;
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectSourceFiles();
  const violations: Violation[] = [];

  for (const filePath of files) {
    const fileContent = await Bun.file(filePath).text();
    tryPattern.lastIndex = 0;
    for (const match of fileContent.matchAll(tryPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
      });
    }
  }

  return violations;
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput("No try/catch blocks found.");
    return;
  }

  await writeError("try/catch blocks are disallowed. Found:");
  for (const violation of violations) {
    await writeError(`- ${violation.filePath}:${violation.line}`);
  }

  process.exit(1);
};

await main();
