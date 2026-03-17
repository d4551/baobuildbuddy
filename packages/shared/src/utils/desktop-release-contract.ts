import type { DESKTOP_RELEASE_TARGETS } from "../constants/scripts";
import {
  DESKTOP_RELEASE_LINUX_ARM64_DEB_ARCH,
  DESKTOP_RELEASE_LINUX_ARM64_RPM_ARCH,
  DESKTOP_RELEASE_LINUX_ARM64_TARGET,
  DESKTOP_RELEASE_LINUX_X64_DEB_ARCH,
  DESKTOP_RELEASE_LINUX_X64_RPM_ARCH,
  DESKTOP_RELEASE_LINUX_X64_TARGET,
  DESKTOP_RELEASE_MACOS_AARCH64_ARCH,
  DESKTOP_RELEASE_MACOS_AARCH64_TARGET,
  DESKTOP_RELEASE_MACOS_UNIVERSAL_ARCH,
  DESKTOP_RELEASE_MACOS_UNIVERSAL_TARGET,
  DESKTOP_RELEASE_MACOS_X64_ARCH,
  DESKTOP_RELEASE_MACOS_X64_TARGET,
  DESKTOP_RELEASE_WINDOWS_ARCH,
  DESKTOP_RELEASE_WINDOWS_MSI_LANGUAGE,
  DESKTOP_RELEASE_WINDOWS_TARGET,
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
 * Supported macOS architecture labels for release artifact naming.
 */
export type DesktopReleaseMacosArchitecture =
  | typeof DESKTOP_RELEASE_MACOS_AARCH64_ARCH
  | typeof DESKTOP_RELEASE_MACOS_X64_ARCH
  | typeof DESKTOP_RELEASE_MACOS_UNIVERSAL_ARCH;

/**
 * Canonical desktop release artifact kinds produced by matching-host native builds.
 */
export type DesktopReleaseArtifactKind =
  | "appimage"
  | "deb"
  | "dmg"
  | "msi"
  | "portable"
  | "rpm"
  | "sig"
  | "setup";

/**
 * Optional profile-driven release variant toggles.
 */
export type DesktopReleaseArtifactProfile = {
  readonly includeLinuxAppImage: boolean;
  readonly includeLinuxSignatures: boolean;
  readonly includeWindowsMsi: boolean;
  readonly macosArchitectures: readonly DesktopReleaseMacosArchitecture[];
};

/**
 * Default profile for canonical release outputs.
 */
export const DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE: DesktopReleaseArtifactProfile = {
  includeLinuxAppImage: false,
  includeLinuxSignatures: false,
  includeWindowsMsi: false,
  macosArchitectures: [DESKTOP_RELEASE_MACOS_AARCH64_ARCH],
};

const DESKTOP_RELEASE_MACOS_ARCHITECTURE_ORDER: readonly DesktopReleaseMacosArchitecture[] = [
  DESKTOP_RELEASE_MACOS_AARCH64_ARCH,
  DESKTOP_RELEASE_MACOS_X64_ARCH,
  DESKTOP_RELEASE_MACOS_UNIVERSAL_ARCH,
];

/**
 * Canonical artifact entry within the assembled desktop release directory.
 */
export type DesktopReleaseArtifactSpec = {
  readonly fileName: string;
  readonly kind: DesktopReleaseArtifactKind;
  readonly relativePath: string;
  readonly target: DesktopReleaseTarget;
};

const dedupeMacosArchitectures = (
  architectures: readonly DesktopReleaseMacosArchitecture[],
): readonly DesktopReleaseMacosArchitecture[] => {
  const selectedArchitectures = new Set(architectures);
  return DESKTOP_RELEASE_MACOS_ARCHITECTURE_ORDER.filter((architecture) =>
    selectedArchitectures.has(architecture),
  );
};

/**
 * Resolves a partial release profile into the canonical artifact profile.
 */
export const normalizeDesktopReleaseArtifactProfile = (
  profile: Partial<DesktopReleaseArtifactProfile> = {},
): DesktopReleaseArtifactProfile => ({
  includeLinuxAppImage: profile.includeLinuxAppImage ?? false,
  includeLinuxSignatures: profile.includeLinuxSignatures ?? false,
  includeWindowsMsi: profile.includeWindowsMsi ?? false,
  macosArchitectures:
    profile.macosArchitectures === undefined || profile.macosArchitectures.length === 0
      ? DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.macosArchitectures
      : dedupeMacosArchitectures(profile.macosArchitectures),
});

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

const isLinuxTarget = (target: DesktopReleaseTarget): target is "linux-x64" | "linux-arm64" =>
  target === "linux-x64" || target === "linux-arm64";

const buildLinuxAppImageSpecs = (
  metadata: DesktopReleaseArtifactNaming,
  target: "linux-x64" | "linux-arm64",
): readonly DesktopReleaseArtifactSpec[] => [
  createDesktopReleaseArtifactSpec(
    target,
    `${metadata.productName}_${metadata.version}_${
      target === "linux-x64"
        ? DESKTOP_RELEASE_LINUX_X64_RPM_ARCH
        : DESKTOP_RELEASE_LINUX_ARM64_RPM_ARCH
    }.AppImage`,
    "appimage",
  ),
];

const buildLinuxCoreSpecs = (
  metadata: DesktopReleaseArtifactNaming,
  target: DesktopReleaseTarget,
) =>
  target === "linux-x64"
    ? [
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
      ]
    : [
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
      ];

const appendLinuxSignatures = (
  artifacts: readonly DesktopReleaseArtifactSpec[],
): readonly DesktopReleaseArtifactSpec[] =>
  artifacts.concat(
    artifacts.map((artifact) =>
      createDesktopReleaseArtifactSpec(artifact.target, `${artifact.fileName}.sig`, "sig"),
    ),
  );

const resolveMacosTargetForArchitecture = (
  architecture: DesktopReleaseMacosArchitecture,
): string => {
  if (architecture === DESKTOP_RELEASE_MACOS_X64_ARCH) {
    return DESKTOP_RELEASE_MACOS_X64_TARGET;
  }
  if (architecture === DESKTOP_RELEASE_MACOS_UNIVERSAL_ARCH) {
    return DESKTOP_RELEASE_MACOS_UNIVERSAL_TARGET;
  }
  return DESKTOP_RELEASE_MACOS_AARCH64_TARGET;
};

/**
 * Builds the target release config profile for a requested release target.
 */
export const resolveDesktopReleaseTauriTargetsFromProfile = (
  profile: DesktopReleaseArtifactProfile,
): readonly string[] => {
  const normalizedProfile = normalizeDesktopReleaseArtifactProfile(profile);
  const explicitTargets = [
    ...normalizedProfile.macosArchitectures.map(resolveMacosTargetForArchitecture),
    DESKTOP_RELEASE_WINDOWS_TARGET,
    DESKTOP_RELEASE_LINUX_X64_TARGET,
    DESKTOP_RELEASE_LINUX_ARM64_TARGET,
  ];
  return explicitTargets.filter(
    (target, index, targetCandidates) => targetCandidates.indexOf(target) === index,
  );
};

/**
 * Builds canonical assembled release artifact specs for a target.
 */
export const buildDesktopReleaseArtifactSpecs = (
  metadata: DesktopReleaseArtifactNaming,
  target: DesktopReleaseTarget,
  profile: Partial<DesktopReleaseArtifactProfile> = {},
): readonly DesktopReleaseArtifactSpec[] => {
  const normalizedProfile = normalizeDesktopReleaseArtifactProfile(profile);

  if (target === "macos") {
    return normalizedProfile.macosArchitectures.map((architecture) =>
      createDesktopReleaseArtifactSpec(
        target,
        `${metadata.productName}_${metadata.version}_${architecture}.dmg`,
        "dmg",
      ),
    );
  }

  if (isLinuxTarget(target)) {
    const linuxArtifacts = [...buildLinuxCoreSpecs(metadata, target)];
    if (normalizedProfile.includeLinuxAppImage && target === "linux-x64") {
      linuxArtifacts.push(...buildLinuxAppImageSpecs(metadata, target));
    }
    return normalizedProfile.includeLinuxSignatures
      ? appendLinuxSignatures(linuxArtifacts)
      : linuxArtifacts;
  }

  const windowsArtifacts = [
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
  ];

  if (normalizedProfile.includeWindowsMsi) {
    windowsArtifacts.push(
      createDesktopReleaseArtifactSpec(
        target,
        `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-${DESKTOP_RELEASE_WINDOWS_MSI_LANGUAGE}.msi`,
        "msi",
      ),
    );
  }

  return windowsArtifacts;
};

/**
 * Builds the canonical artifact file names for a target.
 */
export const buildDesktopReleaseArtifactFileNames = (
  metadata: DesktopReleaseArtifactNaming,
  target: DesktopReleaseTarget,
  profile: Partial<DesktopReleaseArtifactProfile> = {},
): readonly string[] =>
  buildDesktopReleaseArtifactSpecs(metadata, target, profile).map((artifact) => artifact.fileName);

/**
 * Builds the candidate Cargo release directories used by native Tauri builds for a target.
 */
export const buildDesktopReleaseDirectoryCandidates = (
  target: DesktopReleaseTarget,
  tauriTarget?: string,
): readonly string[] => {
  const targetInfo = resolveDesktopRuntimeTargetInfo(target);
  return ["target/release", `target/${tauriTarget ?? targetInfo.tauriTarget}/release`] as const;
};

/**
 * Builds the candidate Tauri bundle directories used by native Tauri builds for a target.
 */
export const buildDesktopBundleDirectoryCandidates = (
  target: DesktopReleaseTarget,
  tauriTarget?: string,
): readonly string[] =>
  buildDesktopReleaseDirectoryCandidates(target, tauriTarget).map(
    (releaseDirectory) => `${releaseDirectory}/bundle`,
  );

/**
 * Maps a profile-defined macOS architecture to a Tauri bundle build target.
 */
export const resolveMacosTargetFromProfileArchitecture = (
  architecture: DesktopReleaseMacosArchitecture,
): string => resolveMacosTargetForArchitecture(architecture);
