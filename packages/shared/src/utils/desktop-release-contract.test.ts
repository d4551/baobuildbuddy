import { describe, expect, test } from "bun:test";
import {
  buildDesktopReleaseArtifactFileNames,
  buildDesktopReleaseArtifactSpecs,
} from "./desktop-release-contract";

const DESKTOP_RELEASE_METADATA = {
  productName: "BaoBuildBuddy",
  version: "0.1.0",
} as const;

describe("desktop release contract", () => {
  test("builds canonical macOS artifact names", () => {
    expect(buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "macos")).toEqual([
      "BaoBuildBuddy_0.1.0_aarch64.dmg",
    ]);
  });

  test("builds canonical Linux x64 artifact names", () => {
    expect(buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "linux-x64")).toEqual([
      "BaoBuildBuddy_0.1.0_amd64.deb",
      "BaoBuildBuddy-0.1.0-1.x86_64.rpm",
    ]);
  });

  test("builds canonical Linux ARM64 artifact names", () => {
    expect(buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "linux-arm64")).toEqual([
      "BaoBuildBuddy_0.1.0_arm64.deb",
      "BaoBuildBuddy-0.1.0-1.aarch64.rpm",
    ]);
  });

  test("builds canonical Windows artifact names", () => {
    expect(buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "windows")).toEqual([
      "BaoBuildBuddy_0.1.0_x64-setup.exe",
      "BaoBuildBuddy_0.1.0_x64-portable.zip",
    ]);
  });

  test("keeps assembled paths scoped to the canonical target bucket", () => {
    expect(buildDesktopReleaseArtifactSpecs(DESKTOP_RELEASE_METADATA, "windows")).toEqual([
      {
        fileName: "BaoBuildBuddy_0.1.0_x64-setup.exe",
        kind: "setup",
        relativePath: "windows/BaoBuildBuddy_0.1.0_x64-setup.exe",
        target: "windows",
      },
      {
        fileName: "BaoBuildBuddy_0.1.0_x64-portable.zip",
        kind: "portable",
        relativePath: "windows/BaoBuildBuddy_0.1.0_x64-portable.zip",
        target: "windows",
      },
    ]);
  });
});
