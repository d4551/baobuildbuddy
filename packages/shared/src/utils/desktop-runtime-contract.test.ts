import { describe, expect, test } from "bun:test";
import {
  buildDesktopRuntimeManifest,
  getDesktopRuntimeManifestMismatches,
  listDesktopRuntimeContractPaths,
  parseDesktopRuntimeManifest,
  resolveDesktopRuntimeTargetInfo,
  resolveDesktopRuntimeTargetInfoFromHost,
  resolveDesktopRuntimeTargetInfoFromTauriTarget,
} from "./desktop-runtime-contract";

describe("desktop runtime contract: target resolution", () => {
  test("resolves the canonical Windows runtime layout", () => {
    const runtimeTargetInfo = resolveDesktopRuntimeTargetInfo("windows");

    expect(runtimeTargetInfo.hostPlatform).toBe("win32");
    expect(runtimeTargetInfo.hostArch).toBe("x64");
    expect(runtimeTargetInfo.serverExecutable).toBe("server/bao-desktop-server.exe");
    expect(runtimeTargetInfo.scriptRunnerExecutable).toBe("bin/bao-bun-runner.exe");
    expect(runtimeTargetInfo.defaultWebviewBootstrapperExecutable).toBe(
      "bin/MicrosoftEdgeWebview2Setup.exe",
    );
  });

  test("resolves Linux runtime layout from the Tauri target triple", () => {
    const runtimeTargetInfo = resolveDesktopRuntimeTargetInfoFromTauriTarget(
      "x86_64-unknown-linux-gnu",
    );

    expect(runtimeTargetInfo.target).toBe("linux-x64");
    expect(runtimeTargetInfo.scriptRunnerExecutable).toBe("bin/bao-bun");
    expect(runtimeTargetInfo.defaultWebviewBootstrapperExecutable).toBeNull();
  });

  test("builds and normalizes the canonical runtime manifest", () => {
    const windowsManifest = buildDesktopRuntimeManifest("windows");
    const normalizedManifest = parseDesktopRuntimeManifest(
      {
        ...windowsManifest,
        webviewBootstrapperExecutable: undefined,
      },
      "test-manifest",
    );

    expect(windowsManifest.webviewBootstrapperExecutable).toBe(
      "bin/MicrosoftEdgeWebview2Setup.exe",
    );
    expect(normalizedManifest.webviewBootstrapperExecutable).toBeNull();
    expect(
      getDesktopRuntimeManifestMismatches(windowsManifest, buildDesktopRuntimeManifest("windows")),
    ).toHaveLength(0);
  });

  test("falls back to canonical host target resolution", () => {
    expect(resolveDesktopRuntimeTargetInfoFromHost("darwin", "x64").target).toBe("macos");
    expect(resolveDesktopRuntimeTargetInfoFromHost("linux", "arm64").target).toBe("linux-arm64");
    expect(resolveDesktopRuntimeTargetInfoFromHost("win32", "x64").target).toBe("windows");
  });
});

describe("desktop runtime contract: packaged payload entries", () => {
  test("lists all runtime contract paths for packaged verification", () => {
    const manifest = buildDesktopRuntimeManifest("linux-arm64");
    const contractPaths = listDesktopRuntimeContractPaths(manifest, ["playwright", "zod"]);

    expect(contractPaths).toEqual([
      "manifest.json",
      "server/bao-desktop-server",
      "bin/bao-bun",
      "bin/bao-bun-entrypoint-runner.mjs",
      "scraper/package.json",
      "scraper/node_modules/playwright/package.json",
      "scraper/node_modules/zod/package.json",
    ]);
  });
});
