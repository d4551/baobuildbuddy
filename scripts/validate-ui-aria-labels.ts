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
  /(?:\s|:|v-bind:)aria-label\s*=|(?:\s|:|v-bind:)aria-labelledby\s*=/u.test(tagMarkup);

const isHiddenInput = (tagMarkup: string): boolean =>
  /type\s*=\s*["']hidden["']/u.test(tagMarkup);

const isAriaHiddenElement = (tagMarkup: string): boolean =>
  /aria-hidden\s*=\s*["']true["']/u.test(tagMarkup);

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

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectVueFiles();
  const violations: Violation[] = [];

  for (const filePath of files) {
    const fileContent = await Bun.file(filePath).text();

    for (const tagName of interactiveTagNames) {
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
    }
  }

  return violations;
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();

  if (violations.length === 0) {
    console.log("ARIA label validation passed for interactive controls.");
    return;
  }

  console.error("ARIA label validation failed. Interactive controls must include aria-label/aria-labelledby:");
  for (const violation of violations) {
    console.error(`- ${violation.filePath}:${violation.line} <${violation.tagName}>`);
  }

  process.exit(1);
};

await main();
