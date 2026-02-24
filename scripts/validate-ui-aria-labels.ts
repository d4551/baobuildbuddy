import { writeError, writeOutput } from "./utils/cli-output";

type Violation = {
  filePath: string;
  line: number;
  tagName: "button" | "input" | "select" | "textarea";
};

const projectRoot = process.cwd();
const clientRoot = "packages/client";
const ignoredDirectoryNames = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
]);
const interactiveTagNames = ["button", "input", "select", "textarea"] as const;
const accessibleNameAttributePattern =
  /(?:\s|:|v-bind:)aria-label\s*=|(?:\s|:|v-bind:)aria-labelledby\s*=/u;
const hiddenInputPattern = /type\s*=\s*["']hidden["']/u;
const ariaHiddenElementPattern = /aria-hidden\s*=\s*["']true["']/u;

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

const hasAccessibleNameAttribute = (tagMarkup: string): boolean =>
  accessibleNameAttributePattern.test(tagMarkup);

const isHiddenInput = (tagMarkup: string): boolean => hiddenInputPattern.test(tagMarkup);

const isAriaHiddenElement = (tagMarkup: string): boolean =>
  ariaHiddenElementPattern.test(tagMarkup);

const collectVueFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/**/*.vue`);

  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (shouldIgnorePath(normalizedPath)) {
      continue;
    }
    files.push(normalizedPath);
  }

  return files;
};

const collectTagViolations = (
  filePath: string,
  fileContent: string,
  tagName: "button" | "input" | "select" | "textarea",
): Violation[] => {
  const violations: Violation[] = [];
  const tagPattern = new RegExp(`<${tagName}\\b[\\s\\S]*?>`, "gu");

  for (const match of fileContent.matchAll(tagPattern)) {
    const tagMarkup = match[0];
    if (hasAccessibleNameAttribute(tagMarkup) || isAriaHiddenElement(tagMarkup)) {
      continue;
    }

    if (tagName === "input" && isHiddenInput(tagMarkup)) {
      continue;
    }

    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      tagName,
    });
  }

  return violations;
};

const collectFileViolations = async (filePath: string): Promise<Violation[]> => {
  const fileContent = await Bun.file(filePath).text();
  return interactiveTagNames.flatMap((tagName) => collectTagViolations(filePath, fileContent, tagName));
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectVueFiles();
  const perFileViolations = await Promise.all(files.map((filePath) => collectFileViolations(filePath)));
  return perFileViolations.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput("ARIA label validation passed for interactive controls.");
    return;
  }

  await writeError(
    "ARIA label validation failed. Interactive controls must include aria-label/aria-labelledby:",
  );
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} <${violation.tagName}>`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }

  process.exit(1);
};

await main();
