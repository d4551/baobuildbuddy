/**
 * The RPA capability audit reports job-apply as configured only when a real
 * Playwright Chromium build is on disk, so this probe decides whether the
 * product claims a browser it does not have.
 */
import { describe, expect, test } from "bun:test";
import {
  type ChromiumExecutableProbeDeps,
  resolvePlaywrightChromiumExecutable,
} from "./playwright-chromium-probe";

const DARWIN_EXECUTABLE = "chrome-mac/Chromium.app/Contents/MacOS/Chromium";
const LINUX_EXECUTABLE = "chrome-linux/chrome";

const depsFor = (
  paths: readonly string[],
  dirs: readonly string[],
): ChromiumExecutableProbeDeps => ({
  pathExists: (candidatePath) => paths.includes(candidatePath),
  readDir: () => [...dirs],
});

describe("resolvePlaywrightChromiumExecutable", () => {
  test("returns null when the browsers cache does not exist", () => {
    expect(resolvePlaywrightChromiumExecutable("/cache", "darwin", depsFor([], []))).toBeNull();
  });

  test("returns null when the cache exists but holds no chromium build", () => {
    expect(
      resolvePlaywrightChromiumExecutable("/cache", "darwin", depsFor(["/cache"], ["firefox-1"])),
    ).toBeNull();
  });

  test("finds a macOS chromium executable inside a versioned build directory", () => {
    const executable = `/cache/chromium-1200/${DARWIN_EXECUTABLE}`;
    expect(
      resolvePlaywrightChromiumExecutable(
        "/cache",
        "darwin",
        depsFor(["/cache", executable], ["chromium-1200"]),
      ),
    ).toBe(executable);
  });

  test("finds a linux chromium executable", () => {
    const executable = `/cache/chromium-1200/${LINUX_EXECUTABLE}`;
    expect(
      resolvePlaywrightChromiumExecutable(
        "/cache",
        "linux",
        depsFor(["/cache", executable], ["chromium-1200"]),
      ),
    ).toBe(executable);
  });

  test("prefers the highest revision when several builds are cached", () => {
    const newest = `/cache/chromium-1300/${LINUX_EXECUTABLE}`;
    const oldest = `/cache/chromium-1200/${LINUX_EXECUTABLE}`;
    expect(
      resolvePlaywrightChromiumExecutable(
        "/cache",
        "linux",
        depsFor(["/cache", newest, oldest], ["chromium-1200", "chromium-1300"]),
      ),
    ).toBe(newest);
  });

  test("returns null when a build directory exists without the executable", () => {
    expect(
      resolvePlaywrightChromiumExecutable(
        "/cache",
        "linux",
        depsFor(["/cache"], ["chromium-1200"]),
      ),
    ).toBeNull();
  });
});
