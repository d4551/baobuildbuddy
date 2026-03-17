import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  discoverStagedDesktopReleaseTargets,
  hasNativeDesktopReleaseProvenance,
  isDesktopReleaseProvenance,
  isDesktopReleaseTarget,
  parseDesktopReleaseRefreshTargets,
  stageDesktopReleaseProvenanceFixture,
} from "./utils/desktop-release-refresh";

const pathExists = async (absolutePath: string): Promise<boolean> =>
  stat(absolutePath).then(
    () => true,
    () => false,
  );

const withTemporaryDirectory = async <T>(
  prefix: string,
  run: (directoryPath: string) => Promise<T>,
): Promise<T> => {
  const directoryPath = await mkdtemp(join(tmpdir(), prefix));
  return Promise.resolve(run(directoryPath)).finally(() =>
    rm(directoryPath, { force: true, recursive: true }),
  );
};

describe("desktop release refresh target parsing", () => {
  test("returns null when no explicit targets are provided", () => {
    expect(parseDesktopReleaseRefreshTargets([])).toBeNull();
  });

  test("parses explicit canonical targets", () => {
    expect(parseDesktopReleaseRefreshTargets(["--targets", "windows,macos"])).toEqual([
      "windows",
      "macos",
    ]);
  });

  test("rejects unsupported explicit targets", () => {
    expect(() => parseDesktopReleaseRefreshTargets(["--targets", "linux-x86"])).toThrow(
      "No supported desktop targets were supplied via --targets (linux-x86).",
    );
  });

  test("narrows canonical target values", () => {
    expect(isDesktopReleaseTarget("windows")).toBe(true);
    expect(isDesktopReleaseTarget("linux-x86")).toBe(false);
  });
});

describe("discoverStagedDesktopReleaseTargets", () => {
  test("returns targets with a root and assembly-safe provenance manifest", async () => {
    await withTemporaryDirectory("bao-release-refresh-", async (sourceRoot) => {
      await stageDesktopReleaseProvenanceFixture(sourceRoot, "windows");
      await stageDesktopReleaseProvenanceFixture(sourceRoot, "macos", [
        "stage-only existing bundled artifacts for aarch64-apple-darwin",
      ]);
      await mkdir(join(sourceRoot, "linux-x64"), { recursive: true });

      expect(await discoverStagedDesktopReleaseTargets(sourceRoot, pathExists)).toEqual([
        "macos",
        "windows",
      ]);
    });
  });
});

describe("isDesktopReleaseProvenance", () => {
  test("accepts stage-only carry-forward provenance for release assembly", () => {
    expect(
      isDesktopReleaseProvenance({
        schemaVersion: 1,
        target: "windows",
        strategy: "matching-host-native",
        tauriCli: "repo-local-bun",
        hostPlatform: "win32",
        hostArch: "x64",
        tauriTarget: "x86_64-pc-windows-msvc",
        artifactNames: ["BaoBuildBuddy_0.1.0_x64-setup.exe"],
        buildCommands: ["stage-only existing bundled artifacts for x86_64-pc-windows-msvc"],
      }),
    ).toBe(true);
  });
});

describe("hasNativeDesktopReleaseProvenance", () => {
  test("accepts provenance generated from a native build", () => {
    expect(
      hasNativeDesktopReleaseProvenance({
        schemaVersion: 1,
        target: "macos",
        strategy: "matching-host-native",
        tauriCli: "repo-local-bun",
        hostPlatform: "darwin",
        hostArch: "arm64",
        tauriTarget: "aarch64-apple-darwin",
        artifactNames: ["BaoBuildBuddy_0.1.0_aarch64.dmg"],
        buildCommands: ["bun tauri build --no-bundle --target aarch64-apple-darwin"],
      }),
    ).toBe(true);
  });

  test("rejects stage-only carry-forward provenance", () => {
    expect(
      hasNativeDesktopReleaseProvenance({
        schemaVersion: 1,
        target: "windows",
        strategy: "matching-host-native",
        tauriCli: "repo-local-bun",
        hostPlatform: "win32",
        hostArch: "x64",
        tauriTarget: "x86_64-pc-windows-msvc",
        artifactNames: ["BaoBuildBuddy_0.1.0_x64-setup.exe"],
        buildCommands: ["stage-only existing bundled artifacts for x86_64-pc-windows-msvc"],
      }),
    ).toBe(false);
  });
});
