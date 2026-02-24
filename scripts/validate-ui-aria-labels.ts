import { writeError, writeOutput } from "./utils/cli-output";

type Violation = {
  filePath: string;
  line: number;
  tagName: "button" | "input" | "select" | "textarea" | "dialog";
  message: string;
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
const dialogAccessibleNamePattern =
  /(?:\s|:|v-bind:)aria-label\s*=|(?:\s|:|v-bind:)aria-labelledby\s*=/u;
const dialogModalPattern = /(?:\s|:|v-bind:)aria-modal\s*=\s*["']true["']/u;
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
      message: "Interactive controls must include aria-label or aria-labelledby.",
    });
  }

  return violations;
};

const collectDialogViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
  const dialogTagPattern = /<dialog\b[\s\S]*?>/gu;

  for (const match of fileContent.matchAll(dialogTagPattern)) {
    const tagMarkup = match[0];
    if (!dialogAccessibleNamePattern.test(tagMarkup)) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
        tagName: "dialog",
        message: "Dialogs must include aria-label or aria-labelledby.",
      });
    }
    if (!dialogModalPattern.test(tagMarkup)) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
        tagName: "dialog",
        message: 'Dialogs must include aria-modal="true".',
      });
    }
  }

  return violations;
};

const collectFileViolations = async (filePath: string): Promise<Violation[]> => {
  const fileContent = await Bun.file(filePath).text();
  return [
    ...interactiveTagNames.flatMap((tagName) => collectTagViolations(filePath, fileContent, tagName)),
    ...collectDialogViolations(filePath, fileContent),
  ];
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectVueFiles();
  const perFileViolations = await Promise.all(files.map((filePath) => collectFileViolations(filePath)));
  return perFileViolations.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    await writeOutput(
      "ARIA validation passed for interactive controls and modal dialog semantics.",
    );
    return;
  }

  await writeError(
    "ARIA validation failed. Interactive controls and dialogs must include required accessible labels and modal semantics:",
  );
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} <${violation.tagName}> ${violation.message}`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }

  process.exit(1);
};

await main();
