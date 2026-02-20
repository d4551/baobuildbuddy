import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

type Violation = {
  filePath: string;
  line: number;
};

const projectRoot = process.cwd();
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
const tryPattern = /\btry\s*\{/g;

const getFilesRecursively = (directoryPath: string): string[] => {
  const children = readdirSync(directoryPath);
  const files: string[] = [];

  for (const child of children) {
    const childPath = join(directoryPath, child);
    const childStat = statSync(childPath);

    if (childStat.isDirectory()) {
      if (ignoredDirectoryNames.has(child)) {
        continue;
      }
      files.push(...getFilesRecursively(childPath));
      continue;
    }

    if (allowedExtensions.has(extname(childPath))) {
      files.push(childPath);
    }
  }

  return files;
};

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

const collectViolations = (): Violation[] => {
  const scanRoots = [join(projectRoot, "packages"), join(projectRoot, "scripts")];
  const files = scanRoots.flatMap((scanRoot) => getFilesRecursively(scanRoot));
  const violations: Violation[] = [];

  for (const filePath of files) {
    const fileContent = readFileSync(filePath, "utf8");
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

const main = (): void => {
  const violations = collectViolations();

  if (violations.length === 0) {
    console.log("No try/catch blocks found.");
    return;
  }

  console.error("try/catch blocks are disallowed. Found:");
  for (const violation of violations) {
    console.error(`- ${relative(projectRoot, violation.filePath)}:${violation.line}`);
  }

  process.exit(1);
};

main();
