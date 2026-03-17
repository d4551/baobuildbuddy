import type { DESKTOP_RELEASE_TARGETS } from "../constants/scripts";
import {
  DESKTOP_RELEASE_LINUX_ARM64_DEB_ARCH,
  DESKTOP_RELEASE_LINUX_ARM64_RPM_ARCH,
  DESKTOP_RELEASE_LINUX_X64_DEB_ARCH,
  DESKTOP_RELEASE_LINUX_X64_RPM_ARCH,
  DESKTOP_RELEASE_MACOS_ARCH,
  DESKTOP_RELEASE_WINDOWS_ARCH,
} from "../constants/scripts";
import { resolveDesktopRuntimeTargetInfo } from "./desktop-runtime-contract";

/**
 * Canonical desktop release staging targets.
 */
export type DesktopReleaseTarget = (typeof DESKTOP_RELEASE_TARGETS)[number];

/**
 * Minimum metadata required to build canonical desktop release artifact names.
 */
export type DesktopReleaseArtifactNaming = {
  readonly productName: string;
  readonly version: string;
};

/**
 * Canonical desktop release artifact kinds produced by matching-host native builds.
 */
export type DesktopReleaseArtifactKind = "deb" | "dmg" | "portable" | "rpm" | "setup";

/**
 * Canonical artifact entry within the assembled desktop release directory.
 */
export type DesktopReleaseArtifactSpec = {
  readonly fileName: string;
  readonly kind: DesktopReleaseArtifactKind;
  readonly relativePath: string;
  readonly target: DesktopReleaseTarget;
};

const createDesktopReleaseArtifactSpec = (
  target: DesktopReleaseTarget,
  fileName: string,
  kind: DesktopReleaseArtifactKind,
): DesktopReleaseArtifactSpec => ({
  fileName,
  kind,
  relativePath: `${target}/${fileName}`,
  target,
});

/**
 * Builds canonical assembled release artifact specs for a target.
 */
export const buildDesktopReleaseArtifactSpecs = (
  metadata: DesktopReleaseArtifactNaming,
  target: DesktopReleaseTarget,
): readonly DesktopReleaseArtifactSpec[] => {
  if (target === "macos") {
    return [
      createDesktopReleaseArtifactSpec(
        target,
        `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_MACOS_ARCH}.dmg`,
        "dmg",
      ),
    ] as const;
  }

  if (target === "linux-x64") {
    return [
      createDesktopReleaseArtifactSpec(
        target,
        `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_LINUX_X64_DEB_ARCH}.deb`,
        "deb",
      ),
      createDesktopReleaseArtifactSpec(
        target,
        `${metadata.productName}-${metadata.version}-1.${DESKTOP_RELEASE_LINUX_X64_RPM_ARCH}.rpm`,
        "rpm",
      ),
    ] as const;
  }

  if (target === "linux-arm64") {
    return [
      createDesktopReleaseArtifactSpec(
        target,
        `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_LINUX_ARM64_DEB_ARCH}.deb`,
        "deb",
      ),
      createDesktopReleaseArtifactSpec(
        target,
        `${metadata.productName}-${metadata.version}-1.${DESKTOP_RELEASE_LINUX_ARM64_RPM_ARCH}.rpm`,
        "rpm",
      ),
    ] as const;
  }

  return [
    createDesktopReleaseArtifactSpec(
      target,
      `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-setup.exe`,
      "setup",
    ),
    createDesktopReleaseArtifactSpec(
      target,
      `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-portable.zip`,
      "portable",
    ),
  ] as const;
};

/**
 * Builds the canonical artifact file names for a target.
 */
export const buildDesktopReleaseArtifactFileNames = (
  metadata: DesktopReleaseArtifactNaming,
  target: DesktopReleaseTarget,
): readonly string[] =>
  buildDesktopReleaseArtifactSpecs(metadata, target).map((artifact) => artifact.fileName);

/**
 * Builds the candidate Cargo release directories used by native Tauri builds for a target.
 */
export const buildDesktopReleaseDirectoryCandidates = (
  target: DesktopReleaseTarget,
): readonly string[] => {
  const targetInfo = resolveDesktopRuntimeTargetInfo(target);
  return ["target/release", `target/${targetInfo.tauriTarget}/release`] as const;
};

/**
 * Builds the candidate Tauri bundle directories used by native Tauri builds for a target.
 */
export const buildDesktopBundleDirectoryCandidates = (
  target: DesktopReleaseTarget,
): readonly string[] =>
  buildDesktopReleaseDirectoryCandidates(target).map(
    (releaseDirectory) => `${releaseDirectory}/bundle`,
  );
