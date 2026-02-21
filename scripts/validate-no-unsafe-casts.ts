import { writeError, writeOutput } from "./utils/cli-output";

type Violation = {
  filePath: string;
  line: number;
  castType: "any" | "unknown";
};

const projectRoot = process.cwd();
const scanRoots = ["packages", "scripts"] as const;
const allowedExtensions = new Set([".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs"]);
const ignoredDirectoryNames = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
]);
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
    unsafeCastPattern.lastIndex = 0;
    for (const match of fileContent.matchAll(unsafeCastPattern)) {
      const castType = match[1];
      if (castType !== "any" && castType !== "unknown") {
        continue;
      }

      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
        castType,
      });
    }
  }

  return violations;
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput("No unsafe type casts (`as-any` / `as-unknown`) found.");
    return;
  }

  await writeError("Unsafe type casts are disallowed. Found:");
  for (const violation of violations) {
    await writeError(`- ${violation.filePath}:${violation.line} uses \`as ${violation.castType}\``);
  }

  process.exit(1);
};

await main();
