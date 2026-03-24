import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  DESKTOP_RELEASE_TARGETS,
} from "../../packages/shared/src/constants/scripts";

type DesktopReleaseTarget = (typeof DESKTOP_RELEASE_TARGETS)[number];

const DESKTOP_RELEASE_TARGET_SET = new Set<string>(DESKTOP_RELEASE_TARGETS);
const STAGE_ONLY_BUILD_COMMAND_PREFIX = "stage-only ";

type NativeDesktopReleaseProvenance = {
  readonly schemaVersion?: unknown;
  readonly target?: unknown;
  readonly strategy?: unknown;
  readonly tauriCli?: unknown;
  readonly hostPlatform?: unknown;
  readonly hostArch?: unknown;
  readonly tauriTarget?: unknown;
  readonly artifactNames?: unknown;
  readonly buildCommands?: unknown;
};

const isArtifactNameList = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((entry) => typeof entry === "string" && entry.length > 0);

const isBuildCommandList = (value: unknown): value is readonly string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((entry) => typeof entry === "string" && entry.length > 0);

const isNativeBuildCommandList = (value: unknown): value is readonly string[] =>
  isBuildCommandList(value) &&
  value.every((entry) => !entry.startsWith(STAGE_ONLY_BUILD_COMMAND_PREFIX));

/**
 * Returns true when a string matches a canonical desktop release target bucket.
 */
export const isDesktopReleaseTarget = (value: string): value is DesktopReleaseTarget =>
  DESKTOP_RELEASE_TARGET_SET.has(value);

/**
 * Returns true when a provenance payload is structurally valid for release assembly.
 */
export const isDesktopReleaseProvenance = (value: NativeDesktopReleaseProvenance): boolean =>
  value.schemaVersion === 1 &&
  typeof value.target === "string" &&
  isDesktopReleaseTarget(value.target) &&
  value.strategy === "matching-host-native" &&
  value.tauriCli === "repo-local-bun" &&
  typeof value.hostPlatform === "string" &&
  value.hostPlatform.length > 0 &&
  typeof value.hostArch === "string" &&
  value.hostArch.length > 0 &&
  typeof value.tauriTarget === "string" &&
  value.tauriTarget.length > 0 &&
  isArtifactNameList(value.artifactNames) &&
  isBuildCommandList(value.buildCommands);

/**
 * Returns true when a provenance payload represents a fresh native build instead of staged carry-forward artifacts.
 */
export const hasNativeDesktopReleaseProvenance = (value: NativeDesktopReleaseProvenance): boolean =>
  isDesktopReleaseProvenance(value) && isNativeBuildCommandList(value.buildCommands);

/**
 * Parses an explicit `--targets` CLI argument into canonical release targets.
 */
export const parseDesktopReleaseRefreshTargets = (
  argv: readonly string[],
): readonly DesktopReleaseTarget[] | null => {
  const targetsIndex = argv.indexOf("--targets");
  if (targetsIndex === -1) {
    return null;
  }

  const rawTargets = argv[targetsIndex + 1] ?? "";
  const selectedTargets = rawTargets
    .split(",")
    .map((target) => target.trim())
    .filter(isDesktopReleaseTarget);

  if (selectedTargets.length === 0) {
    throw new Error(`No supported desktop targets were supplied via --targets (${rawTargets}).`);
  }

  return selectedTargets;
};

/**
 * Discovers staged release targets that contain both a target root and an assembly-safe provenance manifest.
 */
export const discoverStagedDesktopReleaseTargets = async (
  sourceRoot: string,
  pathExists: (absolutePath: string) => Promise<boolean>,
): Promise<readonly DesktopReleaseTarget[]> => {
  const stagedTargets = await Promise.all(
    DESKTOP_RELEASE_TARGETS.map(async (target) => {
      const targetRoot = join(sourceRoot, target);
      const provenancePath = join(
        targetRoot,
        DESKTOP_RELEASE_METADATA_DIR,
        DESKTOP_RELEASE_PROVENANCE_FILENAME,
      );
      if (!((await pathExists(targetRoot)) && (await pathExists(provenancePath)))) {
        return null;
      }

      const provenance = JSON.parse(
        await Bun.file(provenancePath).text(),
      ) as NativeDesktopReleaseProvenance;
      return isDesktopReleaseProvenance(provenance) ? target : null;
    }),
  );

  return stagedTargets.filter((target): target is DesktopReleaseTarget => target !== null);
};

/**
 * Writes a minimal staged provenance manifest for a target in a fixture directory.
 */
export const stageDesktopReleaseProvenanceFixture = async (
  sourceRoot: string,
  target: DesktopReleaseTarget,
  buildCommands: readonly string[] = ["bun tauri build --bundles default"],
): Promise<void> => {
  const metadataRoot = join(sourceRoot, target, DESKTOP_RELEASE_METADATA_DIR);
  await mkdir(metadataRoot, { recursive: true });
  await writeFile(
    join(metadataRoot, DESKTOP_RELEASE_PROVENANCE_FILENAME),
    JSON.stringify({
      schemaVersion: 1,
      target,
      strategy: "matching-host-native",
      tauriCli: "repo-local-bun",
      hostPlatform: "darwin",
      hostArch: "arm64",
      tauriTarget: "fixture-target",
      artifactNames: ["fixture.bin"],
      buildCommands,
    }),
  );
};
