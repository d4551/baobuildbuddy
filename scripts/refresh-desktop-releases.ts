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
const LINUX_APPIMAGE_FLAG = "--include-linux-appimage";
const LINUX_SIGNING_FLAG = "--include-linux-signatures";
const WINDOWS_MSI_FLAG = "--include-windows-msi";
const MACOS_ARCH_FLAG = "--macos-architectures";
const RELEASE_FLAG = "--release";

/**
 * Profile flags accepted by `build-desktop-release.ts` and `verify-desktop-release-artifacts.ts`.
 * The refresh step copies staged artifacts verbatim, so it does not interpret these flags itself,
 * but it must forward them to the verifier so the verifier's expected artifact set matches what
 * was staged (e.g. an AppImage on linux-x64, or a Windows MSI).
 */
const PROFILE_VALUE_FLAGS = new Set([MACOS_ARCH_FLAG]);
const PROFILE_BOOLEAN_FLAGS = new Set([
  LINUX_APPIMAGE_FLAG,
  LINUX_SIGNING_FLAG,
  WINDOWS_MSI_FLAG,
  RELEASE_FLAG,
]);

const collectVerifierProfileArgs = (argv: readonly string[]): readonly string[] => {
  const forwarded: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (PROFILE_BOOLEAN_FLAGS.has(argument)) {
      forwarded.push(argument);
      continue;
    }
    if (PROFILE_VALUE_FLAGS.has(argument)) {
      const value = argv[index + 1];
      if (typeof value === "string" && value.length > 0) {
        forwarded.push(argument, value);
        index += 1;
      }
    }
  }
  return forwarded;
};

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
  // Committed SSOT: byte-size fallback for the docs-site manifest builder when
  // the on-disk artifact is a Git LFS pointer (CI checkouts have no real
  // bytes). It is hand-synced (no writer script), so pruning it here would
  // silently destroy it on every local refresh+commit. Preserve it instead.
  "sizes.json",
]);
const DESKTOP_RELEASE_ROOT_ALLOWED_DIRECTORIES = new Set<string>([
  DESKTOP_RELEASE_METADATA_DIR,
  ...DESKTOP_RELEASE_TARGETS,
]);
const LEADING_PATH_SEPARATOR_PATTERN = /^\//u;
const MACOS_HOME_DIRECTORY_PATTERN = /\/Users\/[^/]+\//g;
const LINUX_HOME_DIRECTORY_PATTERN = /\/home\/[^/]+\//g;
const WINDOWS_HOME_DIRECTORY_PATTERN = /C:\\Users\\[^\\]+\\/g;

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

/** Returns a path safe for committing (no username or host-specific dirs). */
const sanitizeSourceRootForProvenance = (sourceRoot: string): string => {
  if (sourceRoot.startsWith(RELEASE_WORKSPACE_ROOT)) {
    const suffix = sourceRoot
      .slice(RELEASE_WORKSPACE_ROOT.length)
      .replace(LEADING_PATH_SEPARATOR_PATTERN, "");
    return suffix ? suffix : ".desktop-release-artifacts";
  }
  return DESKTOP_RELEASE_STAGING_ROOT;
};

/** Sanitizes build command strings to remove PII before committing. */
const sanitizeBuildCommandsForProvenance = (
  commands: readonly string[],
  repoRoot: string,
): readonly string[] =>
  commands.map((cmd) => {
    let s = cmd;
    s = s.split(repoRoot).join(".");
    s = s.replace(MACOS_HOME_DIRECTORY_PATTERN, "~/");
    s = s.replace(LINUX_HOME_DIRECTORY_PATTERN, "~/");
    s = s.replace(WINDOWS_HOME_DIRECTORY_PATTERN, "<home>\\");
    return s;
  });

const sanitizeProvenanceForCommit = (p: ReleaseProvenance): ReleaseProvenance => ({
  ...p,
  buildCommands: sanitizeBuildCommandsForProvenance(p.buildCommands, MONOREPO_ROOT),
});

const pathExists = async (absolutePath: string): Promise<boolean> =>
  stat(absolutePath).then(
    () => true,
    () => false,
  );

const GIT_LFS_POINTER_PREFIX = "version https://git-lfs.github.com/spec/v1";
const GIT_LFS_OID_PATTERN = /^oid sha256:([a-f0-9]{64})$/mu;
/** LFS pointer files are always a few hundred bytes; only probe small files to avoid reading gigabyte binaries into memory. */
const GIT_LFS_POINTER_PROBE_MAX_BYTES = 1024;

/**
 * Computes the SHA-256 of a release artifact's real content. When the working-tree file is a
 * Git LFS pointer (e.g. other canonical targets whose binaries were not `git lfs pull`-ed on this
 * host), returns the pointer's `oid sha256:<hash>` value, which is the hash of the actual binary
 * content users download. This keeps `sha256.txt` correct for every canonical target whether or
 * not LFS objects are present locally, matching the canonical CI assemble flow where all binaries
 * are real on disk.
 */
const computeSha256 = async (absolutePath: string): Promise<string> => {
  const file = Bun.file(absolutePath);
  const fileSize = file.size;
  if (fileSize > 0 && fileSize < GIT_LFS_POINTER_PROBE_MAX_BYTES) {
    const text = await file.text();
    if (text.trimStart().startsWith(GIT_LFS_POINTER_PREFIX)) {
      const oidMatch = text.match(GIT_LFS_OID_PATTERN);
      if (oidMatch?.[1]) {
        return oidMatch[1];
      }
    }
  }
  const hasher = createHash("sha256");
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

const runVerifier = async (
  targets: readonly DesktopReleaseTarget[],
  profileArgs: readonly string[],
): Promise<void> => {
  const verifierExitCode = await Bun.spawn(
    [
      process.execPath,
      "run",
      "scripts/verify-desktop-release-artifacts.ts",
      "--targets",
      targets.join(","),
      ...profileArgs,
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

type RefreshDesktopReleaseConfig = {
  argv: readonly string[];
  replaceReleaseTree: boolean;
  skipVerify: boolean;
  preserveOtherTargets: boolean;
  sourceRoot: string;
};

const createRefreshDesktopReleaseConfig = (
  argv: readonly string[],
): RefreshDesktopReleaseConfig => {
  const replaceReleaseTree = parseReplaceReleaseTreeFlag(argv);
  return {
    argv,
    replaceReleaseTree,
    skipVerify: parseSkipVerifyFlag(argv),
    preserveOtherTargets: !replaceReleaseTree,
    sourceRoot: resolveSourceRoot(argv),
  };
};

const resolveRefreshTargets = async (
  argv: readonly string[],
  sourceRoot: string,
): Promise<readonly DesktopReleaseTarget[]> => {
  const explicitTargets = parseDesktopReleaseRefreshTargets(argv);
  const targets =
    explicitTargets ?? (await discoverStagedDesktopReleaseTargets(sourceRoot, pathExists));
  if (targets.length === 0) {
    throw new Error(`No staged desktop release targets were found in ${sourceRoot}.`);
  }
  return targets;
};

const stageReleaseProvenanceEntries = async (
  sourceRoot: string,
  targets: readonly DesktopReleaseTarget[],
): Promise<readonly (readonly [DesktopReleaseTarget, ReleaseProvenance])[]> =>
  Promise.all(
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

      const sanitized = sanitizeProvenanceForCommit(provenance);
      await stageTargetArtifacts(sourceRoot, target, provenance.artifactNames);
      await writeFormattedJsonFile(
        join(DESKTOP_RELEASE_METADATA_ROOT, target, DESKTOP_RELEASE_PROVENANCE_FILENAME),
        sanitized,
      );
      return [target, sanitized] as const;
    }),
  );

const mergeAssembledTargetMap = (
  preMergeTargets: Map<DesktopReleaseTarget, ReleaseProvenance>,
  provenanceEntries: readonly (readonly [DesktopReleaseTarget, ReleaseProvenance])[],
): Map<DesktopReleaseTarget, ReleaseProvenance> => {
  const mergedTargetMap = new Map<DesktopReleaseTarget, ReleaseProvenance>();
  const existingEntries: ReadonlyArray<[DesktopReleaseTarget, ReleaseProvenance]> = Array.from(
    preMergeTargets.entries(),
  );
  for (const [existingTarget, existingProvenance] of existingEntries) {
    mergedTargetMap.set(existingTarget, sanitizeProvenanceForCommit(existingProvenance));
  }
  for (const [target, provenance] of provenanceEntries) {
    mergedTargetMap.set(target, provenance);
  }
  return mergedTargetMap;
};

const writeAssembledReleaseManifests = async (
  sourceRoot: string,
  mergedTargetMap: Map<DesktopReleaseTarget, ReleaseProvenance>,
): Promise<void> => {
  await mkdir(DESKTOP_RELEASE_METADATA_ROOT, { recursive: true });
  await writeFormattedJsonFile(DESKTOP_RELEASE_ASSEMBLED_PROVENANCE_PATH, {
    schemaVersion: 1,
    assembledAt: new Date().toISOString(),
    sourceRoot: sanitizeSourceRootForProvenance(sourceRoot),
    targets: buildOrderedAssembledTargets(mergedTargetMap),
  });
  await writeChecksumManifest();
};

const main = async (): Promise<void> => {
  const config = createRefreshDesktopReleaseConfig(process.argv.slice(2));
  const targets = await resolveRefreshTargets(config.argv, config.sourceRoot);
  const preMergeTargets = config.preserveOtherTargets
    ? await readExistingAssembledTargets()
    : new Map<DesktopReleaseTarget, ReleaseProvenance>();
  await pruneLegacyReleaseEntries();
  if (config.replaceReleaseTree) {
    await pruneUnselectedReleaseTargets(targets);
  }
  const provenanceEntries = await stageReleaseProvenanceEntries(config.sourceRoot, targets);
  const mergedTargetMap = mergeAssembledTargetMap(preMergeTargets, provenanceEntries);
  await writeAssembledReleaseManifests(config.sourceRoot, mergedTargetMap);
  await writeOutput(
    config.replaceReleaseTree
      ? `desktop-release:refreshed ${targets.join(", ")} from ${config.sourceRoot} into ${DESKTOP_RELEASE_ROOT} (replace-release-tree: pruned unstaged canonical targets)`
      : `desktop-release:refreshed ${targets.join(", ")} from ${config.sourceRoot} into ${DESKTOP_RELEASE_ROOT} (other canonical targets preserved; pass ${REPLACE_RELEASE_TREE_FLAG} to prune them)`,
  );
  if (!config.skipVerify) {
    await runVerifier(targets, collectVerifierProfileArgs(config.argv));
  }
  await writeOutput("desktop-release:refresh complete");
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(toErrorMessage(result.error, "Unexpected desktop release refresh failure."));
  process.exit(1);
}
