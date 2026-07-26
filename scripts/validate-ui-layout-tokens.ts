import { isUiSsotAuthority } from "./ui-ssot-authority";
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

const SSOT_ALLOWLIST_PATHS = new Set<string>([
  "packages/client/constants/layout.ts",
  "packages/client/constants/layout-chrome.ts",
  "packages/client/constants/ui-layout.ts",
  "packages/client/assets/css/main.css",
  "packages/client/components/ui/LoadingSkeleton.vue",
  "packages/client/components/ui/AppModalFrame.vue",
  "packages/client/components/ui/EmptyState.vue",
  "packages/client/components/ui/PageScaffold.vue",
  "packages/client/components/ui/SectionGrid.vue",
  "packages/client/components/ui/PageHeroHeader.vue",
  "packages/client/components/ui/PageHeaderBlock.vue",
]);

const isSsotSource = (filePath: string): boolean =>
  SSOT_ALLOWLIST_PATHS.has(filePath) || isUiSsotAuthority(filePath);

const modalSizeLiteralPattern =
  /modal-box[^\n"']*\b(?:w-11\/12|max-w-(?:sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|screen-[a-z0-9-]+))\b/gu;
const pageWidthLiteralPattern = /\b(?:max-w-(?:2xl|3xl|4xl|5xl|6xl|7xl)|w-11\/12)\b/gu;
const adHocGridBreakpointPattern = /class\s*=\s*["'][^"']*\bgrid\b[^"']*\bgrid-cols-[^"']*["']/gu;
const sectionGridExtraClassPattern =
  /<SectionGrid[^>]*\bextra-class\s*=\s*["'][^"']*\bgrid-cols-[^"']*["'][^>]*>/gu;

const inlineShadowTokenPattern = /\bshadow-(?:xs|sm|md|lg|xl|2xl|inner|none)\b/gu;
const inlineRadiusTokenPattern = /\brounded-(?:sm|md|lg|xl|2xl|3xl|full)\b/gu;
const staticClassAttributePattern = /\bclass\s*=\s*["']([^"']+)["']/gu;

const collectVueFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/**/*.vue`);
  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (shouldIgnorePath(normalizedPath)) continue;
    files.push(normalizedPath);
  }
  return files;
};

const collectPageFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/pages/**/*.vue`);
  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (shouldIgnorePath(normalizedPath)) continue;
    files.push(normalizedPath);
  }
  return files;
};

const collectModalSizeViolations = (filePath: string, fileContent: string): Violation[] => {
  if (filePath === appModalFramePath || isSsotSource(filePath)) return [];
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
  if (!filePath.startsWith(`${clientRoot}/pages/`) || isSsotSource(filePath)) return [];
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
  if (!isPage && !isComponent) return [];
  if (isSsotSource(filePath)) return [];
  const surface = isPage ? "Pages" : "Components";
  const violations: Violation[] = [];
  for (const match of fileContent.matchAll(adHocGridBreakpointPattern)) {
    const classMarkup = match[0];
    if (!classMarkup.includes("grid-cols-")) continue;
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

const collectInlineShadowAndRadiusViolations = (
  filePath: string,
  fileContent: string,
): Violation[] => {
  if (isSsotSource(filePath)) return [];
  const violations: Violation[] = [];
  staticClassAttributePattern.lastIndex = 0;
  for (const classMatch of fileContent.matchAll(staticClassAttributePattern)) {
    const classValue = classMatch[1] ?? "";
    const line = getLineFromOffset(fileContent, classMatch.index ?? 0);
    inlineShadowTokenPattern.lastIndex = 0;
    for (const tokenMatch of classValue.matchAll(inlineShadowTokenPattern)) {
      violations.push({
        filePath,
        line,
        message: `Inline shadow token "${tokenMatch[0]}" is forbidden. Use .glass-* surfaces or a shared layout constant from constants/layout.ts.`,
      });
    }
    inlineRadiusTokenPattern.lastIndex = 0;
    for (const tokenMatch of classValue.matchAll(inlineRadiusTokenPattern)) {
      violations.push({
        filePath,
        line,
        message: `Inline radius token "${tokenMatch[0]}" is forbidden. Use --radius-* CSS variables from main.css or a shared layout constant.`,
      });
    }
  }
  return violations;
};

export const collectUiLayoutTokenViolationsForContent = (
  filePath: string,
  fileContent: string,
): Violation[] => [
  ...collectModalSizeViolations(filePath, fileContent),
  ...collectPageWidthViolations(filePath, fileContent),
  ...collectPageGridViolations(filePath, fileContent),
  ...collectInlineShadowAndRadiusViolations(filePath, fileContent),
];

const collectViolations = async (): Promise<Violation[]> => {
  const [files] = await Promise.all([collectVueFiles(), collectPageFiles()]);
  // `collectPageFiles()` runs alongside `collectVueFiles()` so that the page
  // glob stays warm in Bun's filesystem cache. The full file set is `files`.
  const violationGroups = await Promise.all(
    files.map(async (filePath) => {
      const fileContent = await Bun.file(filePath).text();
      return collectUiLayoutTokenViolationsForContent(filePath, fileContent);
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

if (import.meta.main) {
  await main();
}
