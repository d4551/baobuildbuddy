import { createHash } from "node:crypto";
import { cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import {
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  DESKTOP_RELEASE_STAGING_ROOT,
  DESKTOP_RELEASE_TARGETS,
} from "../packages/shared/src/constants/scripts";
import { captureResult, toErrorMessage } from "./utils/async-control";
import { writeFormattedJsonFile } from "./utils/biome-format";
import { writeError, writeOutput } from "./utils/cli-output";
import {
  discoverStagedDesktopReleaseTargets,
  isDesktopReleaseProvenance,
  parseDesktopReleaseRefreshTargets,
} from "./utils/desktop-release-refresh";

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

/** Monorepo root (directory that contains `scripts/`). Used to spawn the verifier regardless of release layout root. */
const MONOREPO_ROOT = resolve(import.meta.dir, "..");
/**
 * Root that contains `packages/desktop/releases`. Override for tests via `BAO_DESKTOP_RELEASE_WORKSPACE_ROOT` (absolute path).
 */
const RELEASE_WORKSPACE_ROOT = (() => {
  const raw = process.env.BAO_DESKTOP_RELEASE_WORKSPACE_ROOT?.trim();
  if (!raw) {
    return MONOREPO_ROOT;
  }
  return isAbsolute(raw) ? resolve(raw) : resolve(process.cwd(), raw);
})();

const REPLACE_RELEASE_TREE_FLAG = "--replace-release-tree";
const SKIP_VERIFY_FLAG = "--skip-verify";

const DESKTOP_RELEASE_ROOT = join(RELEASE_WORKSPACE_ROOT, "packages", "desktop", "releases");
const DESKTOP_RELEASE_ASSEMBLED_PROVENANCE_PATH = join(
  DESKTOP_RELEASE_ROOT,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
);
const DESKTOP_RELEASE_METADATA_ROOT = join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_METADATA_DIR);
const DESKTOP_RELEASE_CHECKSUM_PATH = join(DESKTOP_RELEASE_ROOT, "sha256.txt");
const DESKTOP_RELEASE_ROOT_ALLOWED_FILES = new Set<string>([
  "README.md",
  "provenance.json",
  "sha256.txt",
]);
const DESKTOP_RELEASE_ROOT_ALLOWED_DIRECTORIES = new Set<string>([
  DESKTOP_RELEASE_METADATA_DIR,
  ...DESKTOP_RELEASE_TARGETS,
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const resolveSourceRoot = (argv: readonly string[]): string => {
  const rootIndex = argv.indexOf("--source-root");
  const sourceRoot =
    rootIndex === -1
      ? DESKTOP_RELEASE_STAGING_ROOT
      : (argv[rootIndex + 1] ?? DESKTOP_RELEASE_STAGING_ROOT);
  return resolve(RELEASE_WORKSPACE_ROOT, sourceRoot);
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

const parseReplaceReleaseTreeFlag = (argv: readonly string[]): boolean =>
  argv.includes(REPLACE_RELEASE_TREE_FLAG);

const parseSkipVerifyFlag = (argv: readonly string[]): boolean => argv.includes(SKIP_VERIFY_FLAG);

const readExistingAssembledTargets = async (): Promise<
  Map<DesktopReleaseTarget, ReleaseProvenance>
> => {
  const result = new Map<DesktopReleaseTarget, ReleaseProvenance>();
  if (!(await pathExists(DESKTOP_RELEASE_ASSEMBLED_PROVENANCE_PATH))) {
    return result;
  }

  const parsed: unknown = JSON.parse(
    await Bun.file(DESKTOP_RELEASE_ASSEMBLED_PROVENANCE_PATH).text(),
  );
  if (!(isRecord(parsed) && isRecord(parsed.targets))) {
    return result;
  }

  for (const target of DESKTOP_RELEASE_TARGETS) {
    const entry = parsed.targets[target];
    if (!isRecord(entry)) {
      continue;
    }
    if (!isDesktopReleaseProvenance(entry) || entry.target !== target) {
      continue;
    }
    result.set(target, entry as ReleaseProvenance);
  }

  return result;
};

const buildOrderedAssembledTargets = (
  targetMap: Map<DesktopReleaseTarget, ReleaseProvenance>,
): Record<string, ReleaseProvenance> => {
  const ordered: Record<string, ReleaseProvenance> = {};
  for (const target of DESKTOP_RELEASE_TARGETS) {
    const provenance = targetMap.get(target);
    if (provenance) {
      ordered[target] = provenance;
    }
  }
  return ordered;
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

  if (!isDesktopReleaseProvenance(parsed)) {
    throw new Error(
      `Canonical release refresh requires valid release provenance for ${target}: ${provenancePath}`,
    );
  }

  return parsed as ReleaseProvenance;
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

const pruneLegacyReleaseEntries = async (): Promise<void> => {
  if (!(await pathExists(DESKTOP_RELEASE_ROOT))) {
    return;
  }

  const releaseEntries = await readdir(DESKTOP_RELEASE_ROOT, { withFileTypes: true });
  await Promise.all(
    releaseEntries.map(async (entry) => {
      const entryPath = join(DESKTOP_RELEASE_ROOT, entry.name);
      if (entry.isDirectory()) {
        if (DESKTOP_RELEASE_ROOT_ALLOWED_DIRECTORIES.has(entry.name)) {
          return;
        }

        await rm(entryPath, { recursive: true, force: true });
        return;
      }

      if (DESKTOP_RELEASE_ROOT_ALLOWED_FILES.has(entry.name)) {
        return;
      }

      await rm(entryPath, { force: true });
    }),
  );

  if (!(await pathExists(DESKTOP_RELEASE_METADATA_ROOT))) {
    return;
  }

  const metadataEntries = await readdir(DESKTOP_RELEASE_METADATA_ROOT, { withFileTypes: true });
  await Promise.all(
    metadataEntries.map(async (entry) => {
      if (
        entry.isDirectory() &&
        DESKTOP_RELEASE_TARGETS.includes(entry.name as DesktopReleaseTarget)
      ) {
        return;
      }

      await rm(join(DESKTOP_RELEASE_METADATA_ROOT, entry.name), {
        recursive: true,
        force: true,
      });
    }),
  );
};

const pruneUnselectedReleaseTargets = async (
  selectedTargets: readonly DesktopReleaseTarget[],
): Promise<void> => {
  const selectedTargetSet = new Set(selectedTargets);

  await Promise.all(
    DESKTOP_RELEASE_TARGETS.filter((target) => !selectedTargetSet.has(target)).map(
      async (target) => {
        await rm(join(DESKTOP_RELEASE_ROOT, target), { recursive: true, force: true });
        await rm(join(DESKTOP_RELEASE_METADATA_ROOT, target), {
          recursive: true,
          force: true,
        });
      },
    ),
  );
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
            const relativePath = join(target, fileName);
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
      cwd: MONOREPO_ROOT,
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
  const replaceReleaseTree = parseReplaceReleaseTreeFlag(argv);
  const skipVerify = parseSkipVerifyFlag(argv);
  /** When false (default), other canonical targets under `packages/desktop/releases` are kept and merged into assembled provenance. */
  const preserveOtherTargets = !replaceReleaseTree;
  const sourceRoot = resolveSourceRoot(argv);
  const explicitTargets = parseDesktopReleaseRefreshTargets(argv);
  const targets =
    explicitTargets ?? (await discoverStagedDesktopReleaseTargets(sourceRoot, pathExists));
  if (targets.length === 0) {
    throw new Error(`No staged desktop release targets were found in ${sourceRoot}.`);
  }
  const preMergeTargets = preserveOtherTargets ? await readExistingAssembledTargets() : new Map();
  await pruneLegacyReleaseEntries();
  if (replaceReleaseTree) {
    await pruneUnselectedReleaseTargets(targets);
  }
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

  const mergedTargetMap = new Map<DesktopReleaseTarget, ReleaseProvenance>(preMergeTargets);
  for (const [target, provenance] of provenanceEntries) {
    mergedTargetMap.set(target, provenance);
  }

  await mkdir(DESKTOP_RELEASE_METADATA_ROOT, { recursive: true });
  await writeFormattedJsonFile(DESKTOP_RELEASE_ASSEMBLED_PROVENANCE_PATH, {
    schemaVersion: 1,
    assembledAt: new Date().toISOString(),
    sourceRoot,
    targets: buildOrderedAssembledTargets(mergedTargetMap),
  });
  await writeChecksumManifest();
  await writeOutput(
    replaceReleaseTree
      ? `desktop-release:refreshed ${targets.join(", ")} from ${sourceRoot} into ${DESKTOP_RELEASE_ROOT} (replace-release-tree: pruned unstaged canonical targets)`
      : `desktop-release:refreshed ${targets.join(", ")} from ${sourceRoot} into ${DESKTOP_RELEASE_ROOT} (other canonical targets preserved; pass ${REPLACE_RELEASE_TREE_FLAG} to prune them)`,
  );
  if (!skipVerify) {
    await runVerifier(targets);
  }
  await writeOutput("desktop-release:refresh complete");
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(toErrorMessage(result.error, "Unexpected desktop release refresh failure."));
  process.exit(1);
}
