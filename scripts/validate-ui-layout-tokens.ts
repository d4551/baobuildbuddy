import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

const projectRoot = process.cwd();
const clientRoot = "packages/client";
const appModalFramePath = "packages/client/components/ui/AppModalFrame.vue";

const modalSizeLiteralPattern =
  /modal-box[^\n"']*\b(?:w-11\/12|max-w-(?:sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|screen-[a-z0-9-]+))\b/gu;
const pageWidthLiteralPattern = /\b(?:max-w-(?:2xl|3xl|4xl|5xl|6xl|7xl)|w-11\/12)\b/gu;
const adHocGridBreakpointPattern = /class\s*=\s*["'][^"']*\bgrid\b[^"']*\bgrid-cols-[^"']*["']/gu;
const sectionGridExtraClassPattern =
  /<SectionGrid[^>]*\bextra-class\s*=\s*["'][^"']*\bgrid-cols-[^"']*["'][^>]*>/gu;

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

const collectPageFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/pages/**/*.vue`);

  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (shouldIgnorePath(normalizedPath)) {
      continue;
    }
    files.push(normalizedPath);
  }

  return files;
};

const collectModalSizeViolations = (filePath: string, fileContent: string): Violation[] => {
  if (filePath === appModalFramePath) {
    return [];
  }

  const violations: Violation[] = [];
  for (const match of fileContent.matchAll(modalSizeLiteralPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      message:
        "Modal size literals are forbidden outside AppModalFrame. Use AppModalFrame sizeToken.",
    });
  }
  return violations;
};

const collectPageWidthViolations = (filePath: string, fileContent: string): Violation[] => {
  if (!filePath.startsWith(`${clientRoot}/pages/`)) {
    return [];
  }

  // description-class is owned by PAGE_HEADER_* measure tokens; blank before shell scan.
  const contentForWidthScan = fileContent.replace(
    /:?(?:description-class|descriptionClass)\s*=\s*["'][^"']*["']/gu,
    (match) => " ".repeat(match.length),
  );

  const violations: Violation[] = [];
  for (const match of contentForWidthScan.matchAll(pageWidthLiteralPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(contentForWidthScan, match.index ?? 0),
      message:
        "Page width literals are forbidden. Use PageScaffold widthToken and shared layout tokens.",
    });
  }
  return violations;
};

const collectPageGridViolations = (filePath: string, fileContent: string): Violation[] => {
  const isPage = filePath.startsWith(`${clientRoot}/pages/`);
  const isComponent = filePath.startsWith(`${clientRoot}/components/`);
  if (!isPage && !isComponent) {
    return [];
  }

  const surface = isPage ? "Pages" : "Components";
  const violations: Violation[] = [];
  for (const match of fileContent.matchAll(adHocGridBreakpointPattern)) {
    const classMarkup = match[0];
    if (!classMarkup.includes("grid-cols-")) {
      continue;
    }
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      message: `${surface} must use SectionGrid tokens instead of ad-hoc grid breakpoint classes.`,
    });
  }

  for (const match of fileContent.matchAll(sectionGridExtraClassPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      message: `${surface} must not pass grid breakpoint classes via SectionGrid extra-class. Add or use a UiGridToken instead.`,
    });
  }

  return violations;
};

const collectViolations = async (): Promise<Violation[]> => {
  const [files, pageFiles] = await Promise.all([collectVueFiles(), collectPageFiles()]);
  const pageFileSet = new Set(pageFiles);
  const violationGroups = await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await Bun.file(filePath).text();
      const pageWidth = pageFileSet.has(filePath)
        ? collectPageWidthViolations(filePath, fileContent)
        : [];
      return [
        ...collectModalSizeViolations(filePath, fileContent),
        ...pageWidth,
        ...collectPageGridViolations(filePath, fileContent),
      ];
    }),
  );
  return violationGroups.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();
  if (violations.length === 0) {
    await writeOutput("UI layout token validation passed.");
    return;
  }

  await writeError(
    "UI layout token validation failed. Pages must use shared layout primitives and modal tokens:",
  );
  const lines = violations.map(
    (violation) => `- ${violation.filePath}:${violation.line} ${violation.message}`,
  );
  if (lines.length > 0) {
    await writeError(lines.join("\n"));
  }

  process.exit(1);
};

await main();
