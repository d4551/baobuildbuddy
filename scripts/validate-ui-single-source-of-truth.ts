import { writeError, writeOutput } from "./utils/cli-output";
import { getLineFromOffset, shouldIgnorePath } from "./utils/validation-helpers";
const NUM_120 = 120;
const NUM_160 = 160;

type Violation = {
  filePath: string;
  line: number;
  message: string;
};

const projectRoot = process.cwd();
const vueScanRoots = [
  "packages/client/pages",
  "packages/client/components",
  "packages/client/layouts",
] as const;
const bootstrapScanRoots = ["packages/client/composables"] as const;
const vueFileLimit = 310;
const styleBlockPattern = /<style\b/gu;
const lineBreakPattern = /\r?\n/u;
const settingsPanelPathPattern =
  /^packages\/client\/components\/settings\/Settings[A-Za-z0-9]+Panel\.vue$/u;
const settingsPanelHeaderUsagePattern = /<SettingsPanelHeader\b/u;
const brittleSettingsHeaderPattern =
  /\bclass\s*=\s*["']flex items-center justify-between gap-3["']/gu;
const settingsBootstrapFilePattern =
  /^packages\/client\/composables\/(?:.*bootstrap.*|settings-page\/runtime\.ts)$/u;
const settingsFetchCallPattern = /\b(?:[A-Za-z0-9_$]+\.)?fetchSettings\(\)/gu;
const settingsFetchGuardPatterns = [
  /if\s*\(\s*!\s*[A-Za-z0-9_$.]+\.value\s*\)/u,
  /[A-Za-z0-9_$.]+\.value\s*\?\s*Promise\.resolve\(\)\s*:\s*(?:[A-Za-z0-9_$]+\.)?fetchSettings\(\)/u,
] as const;

const collectFiles = async (roots: readonly string[], pattern: string): Promise<string[]> => {
  const fileGroups = await Promise.all(
    roots.map(async (root) => {
      const glob = new Bun.Glob(`${root}/**/${pattern}`);
      return Array.fromAsync(glob.scan({ cwd: projectRoot, onlyFiles: true }));
    }),
  );

  return fileGroups
    .flat()
    .map((filePath) => filePath.replace(/\\/gu, "/"))
    .filter((filePath) => !shouldIgnorePath(filePath));
};

const createViolation = (filePath: string, line: number, message: string): Violation => ({
  filePath,
  line,
  message,
});

const collectStyleBlockViolations = (filePath: string, fileContent: string): Violation[] => {
  const violations: Violation[] = [];
  styleBlockPattern.lastIndex = 0;
  for (const match of fileContent.matchAll(styleBlockPattern)) {
    violations.push(
      createViolation(
        filePath,
        getLineFromOffset(fileContent, match.index ?? 0),
        "Vue SFC <style> blocks are forbidden. Use shared daisyUI/Tailwind tokens or centralized CSS.",
      ),
    );
  }
  return violations;
};

const collectVueLineCountViolations = (filePath: string, fileContent: string): Violation[] => {
  const lineCount = fileContent.split(lineBreakPattern).length;
  if (lineCount <= vueFileLimit) {
    return [];
  }

  return [
    createViolation(
      filePath,
      1,
      `Vue UI file exceeds ${vueFileLimit} lines. Break the monolith into focused components/composables.`,
    ),
  ];
};

const collectSettingsPanelViolations = (filePath: string, fileContent: string): Violation[] => {
  if (!settingsPanelPathPattern.test(filePath)) {
    return [];
  }

  const violations: Violation[] = [];
  if (!settingsPanelHeaderUsagePattern.test(fileContent)) {
    violations.push(
      createViolation(
        filePath,
        1,
        "Settings panels must use the shared `SettingsPanelHeader` component so title, subtitle, and trailing status content stay DRY and responsive.",
      ),
    );
  }

  brittleSettingsHeaderPattern.lastIndex = 0;
  for (const match of fileContent.matchAll(brittleSettingsHeaderPattern)) {
    violations.push(
      createViolation(
        filePath,
        getLineFromOffset(fileContent, match.index ?? 0),
        "Bespoke `flex items-center justify-between gap-3` settings headers are forbidden. Use `SettingsPanelHeader` for wrapped copy and trailing badges.",
      ),
    );
  }

  return violations;
};

const hasSettingsFetchGuard = (fileContent: string, matchIndex: number): boolean => {
  const contextWindow = fileContent.slice(
    Math.max(0, matchIndex - NUM_160),
    Math.min(fileContent.length, matchIndex + NUM_120),
  );
  return settingsFetchGuardPatterns.some((pattern) => pattern.test(contextWindow));
};

const collectSettingsBootstrapViolations = (filePath: string, fileContent: string): Violation[] => {
  if (!settingsBootstrapFilePattern.test(filePath)) {
    return [];
  }

  const violations: Violation[] = [];
  settingsFetchCallPattern.lastIndex = 0;
  for (const match of fileContent.matchAll(settingsFetchCallPattern)) {
    const matchIndex = match.index ?? 0;
    if (hasSettingsFetchGuard(fileContent, matchIndex)) {
      continue;
    }

    violations.push(
      createViolation(
        filePath,
        getLineFromOffset(fileContent, matchIndex),
        "App settings bootstrap must stay single-source. Guard page/composable `fetchSettings()` calls behind a missing-state check instead of refetching during every bootstrap.",
      ),
    );
  }

  return violations;
};

const collectVueFileViolations = (filePath: string, fileContent: string): Violation[] => {
  if (!filePath.endsWith(".vue")) {
    return [];
  }

  return [
    ...collectStyleBlockViolations(filePath, fileContent),
    ...collectVueLineCountViolations(filePath, fileContent),
    ...collectSettingsPanelViolations(filePath, fileContent),
  ];
};

export const collectUiSingleSourceViolationsForContent = (
  filePath: string,
  fileContent: string,
): Violation[] => [
  ...collectVueFileViolations(filePath, fileContent),
  ...collectSettingsBootstrapViolations(filePath, fileContent),
];

const collectViolations = async (): Promise<Violation[]> => {
  const [vueFiles, bootstrapFiles] = await Promise.all([
    collectFiles(vueScanRoots, "*.vue"),
    collectFiles(bootstrapScanRoots, "*.ts"),
  ]);
  const files = [...vueFiles, ...bootstrapFiles];
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
