import { join } from "node:path";

/**
 * Filesystem dependencies for the deterministic Chromium probe (injectable
 * so tests can run without touching a real browser cache).
 */
export type ChromiumExecutableProbeDeps = {
  pathExists: (candidatePath: string) => boolean;
  readDir: (directoryPath: string) => string[];
};

const CHROMIUM_BUILD_DIR_PATTERN = /^chromium(?:_headless_shell)?-\d+$/;
const REVISION_NUMBER_PATTERN = /\d+$/;

const EXECUTABLE_RELATIVE_PATHS: Readonly<Record<string, readonly string[]>> = {
  darwin: [
    "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
    "chrome-mac/headless_shell",
    "chrome-mac-arm64/Chromium.app/Contents/MacOS/Chromium",
    "chrome-mac-arm64/headless_shell",
  ],
  linux: ["chrome-linux/chrome", "chrome-linux/headless_shell"],
  win32: ["chrome-win/chrome.exe"],
};

const FALLBACK_EXECUTABLE_RELATIVE_PATHS: readonly string[] = [
  "chrome-linux/chrome",
  "chrome-linux/headless_shell",
];

const revisionOf = (directoryName: string): number => {
  const match = REVISION_NUMBER_PATTERN.exec(directoryName);
  return match ? Number.parseInt(match[0], 10) : 0;
};

const executableRelativePaths = (platform: NodeJS.Platform): readonly string[] =>
  EXECUTABLE_RELATIVE_PATHS[platform] ?? FALLBACK_EXECUTABLE_RELATIVE_PATHS;

/**
 * Resolves the Playwright-managed Chromium executable inside a browsers
 * directory without launching a browser. Returns null when no Chromium
 * build is installed.
 */
export const resolvePlaywrightChromiumExecutable = (
  browsersPath: string,
  platform: NodeJS.Platform,
  deps: ChromiumExecutableProbeDeps,
): string | null => {
  if (!deps.pathExists(browsersPath)) {
    return null;
  }

  const buildDirs = deps
    .readDir(browsersPath)
    .filter((entry) => CHROMIUM_BUILD_DIR_PATTERN.test(entry))
    .sort((left, right) => revisionOf(right) - revisionOf(left));

  for (const buildDir of buildDirs) {
    for (const relativePath of executableRelativePaths(platform)) {
      const candidate = join(browsersPath, buildDir, relativePath);
      if (deps.pathExists(candidate)) {
        return candidate;
      }
    }
  }

  return null;
};
