import { describe, expect, test } from "bun:test";
import {
  buildDesktopBundleDirectoryCandidates,
  buildDesktopReleaseArtifactFileNames,
  buildDesktopReleaseArtifactSpecs,
  buildDesktopReleaseDirectoryCandidates,
  DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE,
  resolveDesktopReleaseTauriTargetsFromProfile,
} from "./desktop-release-contract";

const DESKTOP_RELEASE_METADATA = {
  productName: "BaoBuildBuddy",
  version: "0.1.0",
} as const;

describe("desktop release contract artifact names", () => {
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

  test("builds canonical macOS artifact variants for profile order and defaults", () => {
    expect(
      buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "macos", {
        ...DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE,
        macosArchitectures: ["x86_64", "aarch64", "universal"],
      }),
    ).toEqual([
      "BaoBuildBuddy_0.1.0_aarch64.dmg",
      "BaoBuildBuddy_0.1.0_x86_64.dmg",
      "BaoBuildBuddy_0.1.0_universal.dmg",
    ]);
  });

  test("builds canonical Windows artifact names", () => {
    expect(buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "windows")).toEqual([
      "BaoBuildBuddy_0.1.0_x64-setup.exe",
      "BaoBuildBuddy_0.1.0_x64-portable.zip",
    ]);
  });
});

describe("desktop release contract staging and matrix", () => {
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

  test("builds Cargo release directory candidates for target-aware staging", () => {
    expect(buildDesktopReleaseDirectoryCandidates("windows")).toEqual([
      "target/release",
      "target/x86_64-pc-windows-msvc/release",
    ]);
    expect(buildDesktopReleaseDirectoryCandidates("linux-arm64")).toEqual([
      "target/release",
      "target/aarch64-unknown-linux-gnu/release",
    ]);
  });

  test("builds bundle directory candidates for target-aware staging", () => {
    expect(buildDesktopBundleDirectoryCandidates("macos")).toEqual([
      "target/release/bundle",
      "target/aarch64-apple-darwin/release/bundle",
    ]);
    expect(buildDesktopBundleDirectoryCandidates("windows")).toEqual([
      "target/release/bundle",
      "target/x86_64-pc-windows-msvc/release/bundle",
    ]);
  });

  test("resolves Tauri target matrix deterministically from profile", () => {
    expect(
      resolveDesktopReleaseTauriTargetsFromProfile({
        ...DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE,
        macosArchitectures: ["universal", "aarch64", "x86_64"],
      }),
    ).toEqual([
      "aarch64-apple-darwin",
      "x86_64-apple-darwin",
      "universal-apple-darwin",
      "x86_64-pc-windows-msvc",
      "x86_64-unknown-linux-gnu",
      "aarch64-unknown-linux-gnu",
    ]);
  });
});

describe("desktop release contract optional variants", () => {
  test("includes Linux AppImage and signatures when profile enables them", () => {
    expect(
      buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "linux-x64", {
        ...DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE,
        includeLinuxAppImage: true,
        includeLinuxSignatures: true,
      }),
    ).toEqual([
      "BaoBuildBuddy_0.1.0_amd64.deb",
      "BaoBuildBuddy-0.1.0-1.x86_64.rpm",
      "BaoBuildBuddy_0.1.0_amd64.AppImage",
      "BaoBuildBuddy_0.1.0_amd64.deb.sig",
      "BaoBuildBuddy-0.1.0-1.x86_64.rpm.sig",
      "BaoBuildBuddy_0.1.0_amd64.AppImage.sig",
    ]);
  });

  test("includes MSI when profile enables it", () => {
    expect(
      buildDesktopReleaseArtifactFileNames(DESKTOP_RELEASE_METADATA, "windows", {
        ...DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE,
        includeWindowsMsi: true,
      }),
    ).toEqual([
      "BaoBuildBuddy_0.1.0_x64-setup.exe",
      "BaoBuildBuddy_0.1.0_x64-portable.zip",
      "BaoBuildBuddy_0.1.0_x64-en-US.msi",
    ]);
  });
});
