import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { join, posix, resolve } from "node:path";
import {
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  DESKTOP_RELEASE_STAGING_ROOT,
  DESKTOP_RELEASE_TARGETS,
} from "../packages/shared/src/constants/scripts";
import { captureResult, toErrorMessage } from "./utils/async-control";
import { writeFormattedJsonFile } from "./utils/biome-format";
import { writeError, writeOutput } from "./utils/cli-output";

type DesktopReleaseTarget = (typeof DESKTOP_RELEASE_TARGETS)[number];

type ReleaseProvenance = {
  readonly schemaVersion: 1;
  readonly target: DesktopReleaseTarget;
  readonly strategy: "matching-host-native";
  readonly tauriCli: "repo-local-bun";
  readonly hostPlatform: NodeJS.Platform;
  readonly hostArch: string;
  readonly tauriTarget: string;
  readonly artifactNames: readonly string[];
  readonly buildCommands: readonly string[];
  readonly builtAt: string;
  readonly ci: {
    readonly workflow: string | null;
    readonly runId: string | null;
    readonly runAttempt: string | null;
  };
};

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_RELEASE_ROOT = join(REPO_ROOT, "packages", "desktop", "releases");
const DESKTOP_RELEASE_METADATA_ROOT = join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_METADATA_DIR);
const DESKTOP_RELEASE_CHECKSUM_PATH = join(DESKTOP_RELEASE_ROOT, "sha256.txt");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseTargets = (argv: readonly string[]): readonly DesktopReleaseTarget[] => {
  const targetsIndex = argv.indexOf("--targets");
  if (targetsIndex === -1) {
    return DESKTOP_RELEASE_TARGETS;
  }

  const rawTargets = argv[targetsIndex + 1] ?? "";
  const selectedTargets = rawTargets
    .split(",")
    .map((target) => target.trim())
    .filter((target): target is DesktopReleaseTarget =>
      DESKTOP_RELEASE_TARGETS.includes(target as DesktopReleaseTarget),
    );

  if (selectedTargets.length === 0) {
    throw new Error(`No supported desktop targets were supplied via --targets (${rawTargets}).`);
  }

  return selectedTargets;
};

const resolveSourceRoot = (argv: readonly string[]): string => {
  const rootIndex = argv.indexOf("--source-root");
  const sourceRoot =
    rootIndex === -1
      ? DESKTOP_RELEASE_STAGING_ROOT
      : (argv[rootIndex + 1] ?? DESKTOP_RELEASE_STAGING_ROOT);
  return resolve(REPO_ROOT, sourceRoot);
};

const pathExists = async (absolutePath: string): Promise<boolean> =>
  stat(absolutePath).then(
    () => true,
    () => false,
  );

const computeSha256 = async (absolutePath: string): Promise<string> => {
  const hasher = createHash("sha256");
  const file = Bun.file(absolutePath);
  hasher.update(Buffer.from(await file.arrayBuffer()));
  return hasher.digest("hex");
};

const readProvenance = async (
  sourceRoot: string,
  target: DesktopReleaseTarget,
): Promise<ReleaseProvenance> => {
  const provenancePath = join(
    sourceRoot,
    target,
    DESKTOP_RELEASE_METADATA_DIR,
    DESKTOP_RELEASE_PROVENANCE_FILENAME,
  );
  if (!(await pathExists(provenancePath))) {
    throw new Error(`Missing provenance manifest for ${target}: ${provenancePath}`);
  }

  const parsed: unknown = JSON.parse(await Bun.file(provenancePath).text());
  if (!isRecord(parsed)) {
    throw new Error(`Invalid provenance manifest for ${target}.`);
  }

  return parsed as ReleaseProvenance;
};

const readExistingAssembledTargets = async (): Promise<Record<string, unknown>> => {
  const provenancePath = join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_PROVENANCE_FILENAME);
  if (!(await pathExists(provenancePath))) {
    return {};
  }

  const parsed: unknown = JSON.parse(await Bun.file(provenancePath).text());
  if (!(isRecord(parsed) && isRecord(parsed.targets))) {
    return {};
  }

  return parsed.targets;
};

const collectTargetArtifacts = async (
  sourceRoot: string,
  target: DesktopReleaseTarget,
): Promise<readonly string[]> => {
  const targetRoot = join(sourceRoot, target);
  if (!(await pathExists(targetRoot))) {
    throw new Error(`Missing staged source root for ${target}: ${targetRoot}`);
  }

  const entries = await readdir(targetRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
};

const stageTargetArtifacts = async (
  sourceRoot: string,
  target: DesktopReleaseTarget,
  artifactNames: readonly string[],
): Promise<void> => {
  const sourceTargetRoot = join(sourceRoot, target);
  const releaseTargetRoot = join(DESKTOP_RELEASE_ROOT, target);
  const sourceMetadataRoot = join(sourceTargetRoot, DESKTOP_RELEASE_METADATA_DIR);
  const releaseMetadataRoot = join(DESKTOP_RELEASE_METADATA_ROOT, target);

  await rm(releaseTargetRoot, { force: true, recursive: true });
  await rm(releaseMetadataRoot, { force: true, recursive: true });
  await mkdir(releaseTargetRoot, { recursive: true });
  await mkdir(releaseMetadataRoot, { recursive: true });

  await Promise.all(
    artifactNames.map((artifactName) =>
      cp(join(sourceTargetRoot, artifactName), join(releaseTargetRoot, artifactName)),
    ),
  );

  if (await pathExists(sourceMetadataRoot)) {
    await cp(sourceMetadataRoot, releaseMetadataRoot, { recursive: true });
  }
};

const writeChecksumManifest = async (): Promise<void> => {
  const checksumEntries = (
    await Promise.all(
      DESKTOP_RELEASE_TARGETS.map(async (target) => {
        const targetRoot = join(DESKTOP_RELEASE_ROOT, target);
        if (!(await pathExists(targetRoot))) {
          return [];
        }

        const entries = await readdir(targetRoot, { withFileTypes: true });
        const fileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
        return Promise.all(
          fileNames.map(async (fileName) => {
            const relativePath = posix.join(target, fileName);
            return `${await computeSha256(join(DESKTOP_RELEASE_ROOT, relativePath))}  ${relativePath}`;
          }),
        );
      }),
    )
  ).flat();

  const sortedEntries = checksumEntries.sort((left, right) => left.localeCompare(right));
  await writeFile(DESKTOP_RELEASE_CHECKSUM_PATH, `${sortedEntries.join("\n")}\n`);
};

const runVerifier = async (targets: readonly DesktopReleaseTarget[]): Promise<void> => {
  const verifierExitCode = await Bun.spawn(
    [
      process.execPath,
      "run",
      "scripts/verify-desktop-release-artifacts.ts",
      "--targets",
      targets.join(","),
    ],
    {
      cwd: REPO_ROOT,
      stdout: "inherit",
      stderr: "inherit",
      env: process.env,
    },
  ).exited;

  if (verifierExitCode !== 0) {
    process.exit(verifierExitCode);
  }
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const targets = parseTargets(argv);
  const sourceRoot = resolveSourceRoot(argv);
  const provenanceEntries = await Promise.all(
    targets.map(async (target) => {
      const provenance = await readProvenance(sourceRoot, target);
      const artifactNames = await collectTargetArtifacts(sourceRoot, target);
      const missingArtifacts = provenance.artifactNames.filter(
        (artifactName) => !artifactNames.includes(artifactName),
      );
      if (missingArtifacts.length > 0) {
        throw new Error(
          `Target ${target} is missing staged artifacts declared in provenance: ${missingArtifacts.join(", ")}`,
        );
      }

      await stageTargetArtifacts(sourceRoot, target, provenance.artifactNames);
      return [target, provenance] as const;
    }),
  );

  await mkdir(DESKTOP_RELEASE_METADATA_ROOT, { recursive: true });
  const existingTargets = await readExistingAssembledTargets();
  const nextTargets = {
    ...existingTargets,
    ...Object.fromEntries(provenanceEntries),
  };
  await writeFormattedJsonFile(join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_PROVENANCE_FILENAME), {
    schemaVersion: 1,
    assembledAt: new Date().toISOString(),
    sourceRoot,
    targets: nextTargets,
  });
  await writeChecksumManifest();
  await writeOutput(
    `desktop-release:refreshed ${targets.join(", ")} from ${sourceRoot} into ${DESKTOP_RELEASE_ROOT}`,
  );
  await runVerifier(targets);
  await writeOutput("desktop-release:refresh complete");
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(toErrorMessage(result.error, "Unexpected desktop release refresh failure."));
  process.exit(1);
}
