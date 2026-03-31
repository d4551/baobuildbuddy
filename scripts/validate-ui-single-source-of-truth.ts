import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

const projectRoot = process.cwd();
const scanRoots = [
  "packages/client/pages",
  "packages/client/components",
  "packages/client/layouts",
] as const;
const vueFileLimit = 300;
const styleBlockPattern = /<style\b/gu;
const lineBreakPattern = /\r?\n/u;
const settingsPanelPathPattern =
  /^packages\/client\/components\/settings\/Settings[A-Za-z0-9]+Panel\.vue$/u;
const settingsPanelHeaderUsagePattern = /<SettingsPanelHeader\b/u;
const brittleSettingsHeaderPattern =
  /\bclass\s*=\s*["']flex items-center justify-between gap-3["']/gu;

const collectVueFiles = async (): Promise<string[]> => {
  const fileGroups = await Promise.all(
    scanRoots.map(async (root) => {
      const glob = new Bun.Glob(`${root}/**/*.vue`);
      return Array.fromAsync(glob.scan({ cwd: projectRoot, onlyFiles: true }));
    }),
  );

  return fileGroups
    .flat()
    .map((filePath) => filePath.replace(/\\/gu, "/"))
    .filter((filePath) => !shouldIgnorePath(filePath));
};

export const collectUiSingleSourceViolationsForContent = (
  filePath: string,
  fileContent: string,
): Violation[] => {
  const violations: Violation[] = [];

  styleBlockPattern.lastIndex = 0;
  for (const match of fileContent.matchAll(styleBlockPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(fileContent, match.index ?? 0),
      message:
        "Vue SFC <style> blocks are forbidden. Use shared daisyUI/Tailwind tokens or centralized CSS.",
    });
  }

  const lineCount = fileContent.split(lineBreakPattern).length;
  if (lineCount > vueFileLimit) {
    violations.push({
      filePath,
      line: 1,
      message: `Vue UI file exceeds ${vueFileLimit} lines. Break the monolith into focused components/composables.`,
    });
  }

  if (
    settingsPanelPathPattern.test(filePath) &&
    !settingsPanelHeaderUsagePattern.test(fileContent)
  ) {
    violations.push({
      filePath,
      line: 1,
      message:
        "Settings panels must use the shared `SettingsPanelHeader` component so title, subtitle, and trailing status content stay DRY and responsive.",
    });
  }

  if (settingsPanelPathPattern.test(filePath)) {
    brittleSettingsHeaderPattern.lastIndex = 0;
    for (const match of fileContent.matchAll(brittleSettingsHeaderPattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(fileContent, match.index ?? 0),
        message:
          "Bespoke `flex items-center justify-between gap-3` settings headers are forbidden. Use `SettingsPanelHeader` for wrapped copy and trailing badges.",
      });
    }
  }

  return violations;
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectVueFiles();
  const violationGroups = await Promise.all(
    files.map(async (filePath) =>
      collectUiSingleSourceViolationsForContent(filePath, await Bun.file(filePath).text()),
    ),
  );

  return violationGroups.flat();
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();
  if (violations.length === 0) {
    await writeOutput("UI single-source-of-truth validation passed.");
    return;
  }

  await writeError(
    "UI single-source-of-truth validation failed. Break monoliths and move custom styles into shared tokens:",
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
