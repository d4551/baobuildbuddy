import { cp, mkdir, mkdtemp, readdir, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import {
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  DESKTOP_RELEASE_STAGING_ROOT,
  DESKTOP_RELEASE_TARGETS,
  DESKTOP_RUNTIME_RESOURCE_DIR,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH,
  DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
  DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH,
} from "../packages/shared/src/constants/scripts";
import {
  buildDesktopBundleDirectoryCandidates,
  buildDesktopReleaseArtifactFileNames,
  buildDesktopReleaseArtifactSpecs,
  buildDesktopReleaseDirectoryCandidates,
  DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE,
  type DesktopReleaseArtifactKind,
  type DesktopReleaseArtifactProfile,
  type DesktopReleaseArtifactSpec,
  type DesktopReleaseMacosArchitecture,
  normalizeDesktopReleaseArtifactProfile,
  resolveMacosTargetFromProfileArchitecture,
} from "../packages/shared/src/utils/desktop-release-contract";
import { resolveDesktopRuntimeTargetInfo } from "../packages/shared/src/utils/desktop-runtime-contract";
import { captureResult, toErrorMessage } from "./utils/async-control";
import { writeFormattedJsonFile } from "./utils/biome-format";
import { writeError, writeOutput } from "./utils/cli-output";

type DesktopReleaseTarget = (typeof DESKTOP_RELEASE_TARGETS)[number];

type DesktopBundleMetadata = {
  readonly binaryName: string;
  readonly productName: string;
  readonly version: string;
};

type HostReleaseTarget = {
  readonly artifactLabel: DesktopReleaseTarget;
  readonly expectedPlatform: NodeJS.Platform;
  readonly tauriTarget: string;
};

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

type StageRequest = {
  readonly profile: DesktopReleaseArtifactProfile;
  readonly releaseMode: boolean;
};

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_ROOT = join(REPO_ROOT, "packages", "desktop");
const DESKTOP_TAURI_ROOT = join(DESKTOP_ROOT, "src-tauri");
const DESKTOP_PORTABLE_RUNTIME_ROOT = join(
  DESKTOP_TAURI_ROOT,
  dirname(DESKTOP_RUNTIME_RESOURCE_DIR),
);
const DESKTOP_CLEANUP_SCRIPT_PATH = join(REPO_ROOT, "scripts", "cleanup-desktop-build.ts");
const DESKTOP_PACKAGE_JSON_PATH = join(DESKTOP_ROOT, "package.json");
const DESKTOP_TAURI_CONFIG_PATH = join(DESKTOP_TAURI_ROOT, "tauri.conf.json");
const DESKTOP_CARGO_TOML_PATH = join(DESKTOP_TAURI_ROOT, "Cargo.toml");
const CARGO_VERSION_PATTERN = /^version = "([^"]+)"/m;
const CARGO_PACKAGE_NAME_PATTERN = /^name = "([^"]+)"/m;
const ZIP_EXTENSION_PATTERN = /\.zip$/u;
const LINUX_APPIMAGE_AMD64_SUFFIX_PATTERN = /_amd64\.AppImage$/u;
const LINUX_APPIMAGE_X86_64_SUFFIX_PATTERN = /_x86_64\.AppImage$/u;
const LINUX_SIGNING_ENV = "DESKTOP_RELEASE_LINUX_SIGNATURES";
const LINUX_APPIMAGE_ENV = "DESKTOP_RELEASE_LINUX_APPIMAGE";
const LINUX_APPIMAGE_FLAG = "--include-linux-appimage";
const LINUX_SIGNING_FLAG = "--include-linux-signatures";
const WINDOWS_MSI_ENV = "DESKTOP_RELEASE_WINDOWS_MSI";
const WINDOWS_MSI_FLAG = "--include-windows-msi";
const MACOS_ARCH_ENV = "DESKTOP_RELEASE_MACOS_ARCHITECTURES";
const MACOS_ARCH_FLAG = "--macos-architectures";
const RELEASE_BUILD_ENV = "DESKTOP_RELEASE_RELEASE_MODE";
const APPLE_SIGNING_IDENTITY_ENV = "APPLE_SIGNING_IDENTITY";
const WINDOWS_CERTIFICATE_THUMBPRINT_ENV = "WINDOWS_CERTIFICATE_THUMBPRINT";
const WINDOWS_DIGEST_ALGORITHM_ENV = "WINDOWS_DIGEST_ALGORITHM";
const WINDOWS_TIMESTAMP_URL_ENV = "WINDOWS_TIMESTAMP_URL";
const LINUX_GPG_KEY_ID_ENV = "DESKTOP_RELEASE_GPG_KEY_ID";
const LINUX_GPG_PASSPHRASE_ENV = "DESKTOP_RELEASE_GPG_PASSPHRASE";
/** Stable directory for NSIS `.nsi` scripts captured during `cargo tauri build`. */
const NSIS_CAPTURE_DIR = join(DESKTOP_TAURI_ROOT, ".nsis-capture");

const PROFILE_FLAG_SET = new Set([
  LINUX_APPIMAGE_FLAG,
  LINUX_SIGNING_FLAG,
  WINDOWS_MSI_FLAG,
  MACOS_ARCH_FLAG,
  "--skip-build",
  "--no-sync-release-dir",
  "--release",
]);

type TauriBundleSigningConfig = {
  readonly bundle: {
    readonly macOS?: {
      readonly signingIdentity: string;
    };
    readonly windows?: {
      readonly certificateThumbprint: string;
      readonly digestAlgorithm: string;
      readonly timestampUrl?: string;
    };
  };
};

type LinuxSignableArtifactKind = Extract<DesktopReleaseArtifactKind, "appimage" | "deb" | "rpm">;

type LinuxSignableArtifactSpec = DesktopReleaseArtifactSpec & {
  readonly kind: LinuxSignableArtifactKind;
};

const isLinuxSignableArtifactSpec = (
  artifact: DesktopReleaseArtifactSpec,
): artifact is LinuxSignableArtifactSpec =>
  artifact.kind === "appimage" || artifact.kind === "deb" || artifact.kind === "rpm";

type TauriBuildFlowOptions = {
  readonly env: Record<string, string | undefined>;
  readonly hostTarget: HostReleaseTarget | undefined;
  readonly releaseMode: boolean;
  readonly releaseProfile: DesktopReleaseArtifactProfile;
  readonly tauriArgs: readonly string[];
};

type MacosTauriBuildFlowOptions = {
  readonly env: Record<string, string | undefined>;
  readonly metadata: DesktopBundleMetadata;
  readonly releaseMode: boolean;
  readonly releaseProfile: DesktopReleaseArtifactProfile;
  readonly tauriArgs: readonly string[];
};

type TauriBuildRequest = {
  readonly metadata: DesktopBundleMetadata;
  readonly hostTarget: HostReleaseTarget | undefined;
  readonly releaseMode: boolean;
  readonly releaseProfile: DesktopReleaseArtifactProfile;
  readonly tauriArgs: readonly string[];
};

type MacosTauriCommandEntry = {
  readonly buildCommand: readonly string[];
  readonly bundleCommand: readonly string[];
};

const readEnvValue = (value: string | undefined): string | undefined =>
  value === undefined ? undefined : value.trim().length > 0 ? value.trim() : undefined;

const buildSigningConfigForHost = (
  hostTarget: HostReleaseTarget | undefined,
): TauriBundleSigningConfig | null => {
  if (!hostTarget) {
    return null;
  }

  if (hostTarget.artifactLabel === "macos") {
    const signingIdentity = readEnvValue(process.env[APPLE_SIGNING_IDENTITY_ENV]);
    if (!signingIdentity) {
      return null;
    }

    return {
      bundle: {
        macOS: { signingIdentity },
      },
    };
  }

  if (hostTarget.artifactLabel === "windows") {
    const certificateThumbprint = readEnvValue(process.env[WINDOWS_CERTIFICATE_THUMBPRINT_ENV]);
    if (!certificateThumbprint) {
      return null;
    }

    const digestAlgorithm = readEnvValue(process.env[WINDOWS_DIGEST_ALGORITHM_ENV]) ?? "SHA256";
    const timestampUrl = readEnvValue(process.env[WINDOWS_TIMESTAMP_URL_ENV]);
    return {
      bundle: {
        windows: timestampUrl
          ? { certificateThumbprint, digestAlgorithm, timestampUrl }
          : { certificateThumbprint, digestAlgorithm },
      },
    };
  }

  return null;
};

const buildSigningConfigArgs = (
  hostTarget: HostReleaseTarget | undefined,
  releaseMode: boolean,
): readonly string[] => {
  if (!releaseMode) {
    return [];
  }

  const signingConfig = buildSigningConfigForHost(hostTarget);
  if (!signingConfig) {
    return [];
  }

  return ["--config", JSON.stringify(signingConfig)] as const;
};

const parseBooleanValue = (value: string | undefined): boolean =>
  value?.trim().toLowerCase() === "1" ||
  value?.trim().toLowerCase() === "true" ||
  value?.trim().toLowerCase() === "yes" ||
  value?.trim().toLowerCase() === "on";

/** When unset or empty, callers should apply `DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE` for that toggle. */
const parseOptionalEnvBoolean = (environmentKey: string): boolean | undefined => {
  const raw = process.env[environmentKey]?.trim();
  if (raw === undefined || raw === "") {
    return;
  }
  return parseBooleanValue(raw);
};

const parseMacosArchitecture = (rawArchitecture: string): DesktopReleaseMacosArchitecture => {
  if (
    rawArchitecture === "aarch64" ||
    rawArchitecture === "x86_64" ||
    rawArchitecture === "universal"
  ) {
    return rawArchitecture;
  }

  throw new Error(`Unsupported macOS architecture profile token: ${rawArchitecture}`);
};

const parseMacosArchitecturesFromInput = (
  rawValue: string,
): readonly DesktopReleaseMacosArchitecture[] => {
  const values = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (values.length === 0) {
    return DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.macosArchitectures;
  }

  return values.map((value) => parseMacosArchitecture(value));
};

const parseReleaseProfile = (argv: readonly string[]): StageRequest => {
  const macosArchitecturesArgIndex = argv.indexOf(MACOS_ARCH_FLAG);
  const macosArchitecturesValue =
    macosArchitecturesArgIndex === -1
      ? process.env[MACOS_ARCH_ENV]
      : argv[macosArchitecturesArgIndex + 1];
  const releaseMode =
    argv.includes("--release") || parseBooleanValue(process.env[RELEASE_BUILD_ENV]);

  return {
    releaseMode,
    profile: normalizeDesktopReleaseArtifactProfile({
      includeLinuxAppImage:
        argv.includes(LINUX_APPIMAGE_FLAG) ||
        (parseOptionalEnvBoolean(LINUX_APPIMAGE_ENV) ??
          DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.includeLinuxAppImage),
      includeLinuxSignatures:
        argv.includes(LINUX_SIGNING_FLAG) ||
        (parseOptionalEnvBoolean(LINUX_SIGNING_ENV) ??
          DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.includeLinuxSignatures),
      includeWindowsMsi:
        argv.includes(WINDOWS_MSI_FLAG) ||
        (parseOptionalEnvBoolean(WINDOWS_MSI_ENV) ??
          DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.includeWindowsMsi),
      macosArchitectures:
        macosArchitecturesValue === undefined
          ? DEFAULT_DESKTOP_RELEASE_ARTIFACT_PROFILE.macosArchitectures
          : parseMacosArchitecturesFromInput(macosArchitecturesValue),
    }),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toText = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const readJsonObject = async (absolutePath: string): Promise<Record<string, unknown>> => {
  const parsed: unknown = JSON.parse(await Bun.file(absolutePath).text());
  if (isRecord(parsed)) {
    return parsed;
  }

  throw new Error(`Expected JSON object in ${absolutePath}.`);
};

const readDesktopMetadata = async (): Promise<DesktopBundleMetadata> => {
  const packageJson = await readJsonObject(DESKTOP_PACKAGE_JSON_PATH);
  const tauriConfig = await readJsonObject(DESKTOP_TAURI_CONFIG_PATH);
  const cargoToml = await Bun.file(DESKTOP_CARGO_TOML_PATH).text();
  const packageVersion = toText(packageJson.version);
  const productName = toText(tauriConfig.productName);
  const binaryName = cargoToml.match(CARGO_PACKAGE_NAME_PATTERN)?.[1]?.trim();
  const cargoVersion = cargoToml.match(CARGO_VERSION_PATTERN)?.[1]?.trim();

  if (!(packageVersion && productName && binaryName && cargoVersion)) {
    throw new Error("Desktop metadata is incomplete.");
  }

  if (packageVersion !== cargoVersion) {
    throw new Error(
      `Desktop version mismatch between package.json (${packageVersion}) and Cargo.toml (${cargoVersion}).`,
    );
  }

  return {
    binaryName,
    productName,
    version: packageVersion,
  };
};

const runCommand = async (
  command: readonly string[],
  options: {
    readonly cwd?: string;
    readonly env?: Record<string, string | undefined>;
  } = {},
): Promise<number> => {
  const proc = Bun.spawn([...command], {
    cwd: options.cwd ?? REPO_ROOT,
    env: options.env ?? process.env,
    stdout: "inherit",
    stderr: "inherit",
  });

  return proc.exited;
};

const runCommandOrExit = async (
  command: readonly string[],
  options: {
    readonly cwd?: string;
    readonly env?: Record<string, string | undefined>;
  } = {},
): Promise<void> => {
  const exitCode = await runCommand(command, options);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
};

const runMacosPrebuildCleanup = async (): Promise<void> => {
  if (process.platform !== "darwin") {
    return;
  }

  await runCommandOrExit([process.execPath, DESKTOP_CLEANUP_SCRIPT_PATH, "prebuild"], {
    cwd: REPO_ROOT,
    env: process.env,
  });
};

const pathExists = async (absolutePath: string): Promise<boolean> =>
  stat(absolutePath).then(
    () => true,
    () => false,
  );

const resolveExistingPath = async (
  label: string,
  candidatePaths: readonly string[],
): Promise<string> => {
  const candidateResults = await Promise.all(
    candidatePaths.map(async (candidatePath) => ({
      candidatePath,
      exists: await pathExists(candidatePath),
    })),
  );
  const existingCandidate = candidateResults.find((candidate) => candidate.exists);
  if (existingCandidate) {
    return existingCandidate.candidatePath;
  }

  throw new Error(`Required ${label} is missing. Checked: ${candidatePaths.join(", ")}`);
};

const buildReleasePathCandidates = (
  target: DesktopReleaseTarget,
  tauriTarget?: string,
  ...relativeSegments: readonly string[]
): readonly string[] =>
  buildDesktopReleaseDirectoryCandidates(target, tauriTarget).map((releaseRoot) =>
    join(DESKTOP_TAURI_ROOT, releaseRoot, ...relativeSegments),
  );

const buildBundlePathCandidates = (
  target: DesktopReleaseTarget,
  tauriTarget?: string,
  ...relativeSegments: readonly string[]
): readonly string[] =>
  buildDesktopBundleDirectoryCandidates(target, tauriTarget).map((bundleRoot) =>
    join(DESKTOP_TAURI_ROOT, bundleRoot, ...relativeSegments),
  );

const resolveOutputRoot = (argv: readonly string[]): string => {
  const rootIndex = argv.indexOf("--output-root");
  const outputRoot =
    rootIndex === -1
      ? DESKTOP_RELEASE_STAGING_ROOT
      : (argv[rootIndex + 1] ?? DESKTOP_RELEASE_STAGING_ROOT);
  return resolve(REPO_ROOT, outputRoot);
};

const buildMacosTauriTargetsFromProfile = (
  profile: DesktopReleaseArtifactProfile,
): readonly string[] =>
  normalizeDesktopReleaseArtifactProfile(profile).macosArchitectures.map(
    resolveMacosTargetFromProfileArchitecture,
  );

const resolveMacosArchitectureFromTauriTarget = (
  tauriTarget: string,
): DesktopReleaseMacosArchitecture => {
  if (tauriTarget === "aarch64-apple-darwin") {
    return "aarch64";
  }
  if (tauriTarget === "x86_64-apple-darwin") {
    return "x86_64";
  }
  if (tauriTarget === "universal-apple-darwin") {
    return "universal";
  }

  throw new Error(`Unsupported macOS Tauri target for artifact naming: ${tauriTarget}`);
};

const isLinuxReleaseTarget = (
  target: DesktopReleaseTarget,
): target is Extract<DesktopReleaseTarget, "linux-arm64" | "linux-x64"> =>
  target === "linux-arm64" || target === "linux-x64";

const resolveRequestedTarget = (argv: readonly string[]): DesktopReleaseTarget => {
  const targetIndex = argv.indexOf("--target");
  const requestedTarget = targetIndex === -1 ? null : (argv[targetIndex + 1] ?? null);
  if (requestedTarget !== null) {
    if (DESKTOP_RELEASE_TARGETS.includes(requestedTarget as DesktopReleaseTarget)) {
      return requestedTarget as DesktopReleaseTarget;
    }

    throw new Error(`Unsupported desktop release target: ${requestedTarget}`);
  }

  if (process.platform === "darwin") {
    return "macos";
  }
  if (process.platform === "win32") {
    return "windows";
  }
  if (process.platform === "linux") {
    return process.arch === "arm64" ? "linux-arm64" : "linux-x64";
  }

  throw new Error(
    `Unsupported desktop release host platform: ${process.platform}. Supply --target on a supported host.`,
  );
};

const shouldSkipBuild = (argv: readonly string[]): boolean => argv.includes("--skip-build");

const shouldSyncReleaseDirectory = (argv: readonly string[]): boolean =>
  !argv.includes("--no-sync-release-dir");

const buildHostReleaseTarget = (target: DesktopReleaseTarget): HostReleaseTarget => {
  const runtimeTargetInfo = resolveDesktopRuntimeTargetInfo(target);
  return {
    artifactLabel: target,
    expectedPlatform: runtimeTargetInfo.hostPlatform,
    tauriTarget: runtimeTargetInfo.tauriTarget,
  };
};

const filterForwardedArgs = (argv: readonly string[]): string[] =>
  argv.filter((argument, index) => {
    const previous = argv[index - 1];
    return (
      !PROFILE_FLAG_SET.has(argument) &&
      previous !== "--target" &&
      previous !== "--output-root" &&
      previous !== "--macos-architectures" &&
      argument !== "--target" &&
      argument !== "--output-root" &&
      argument !== "--macos-architectures"
    );
  });

const syncReleaseDirectory = async (
  outputRoot: string,
  target: DesktopReleaseTarget,
  stageRequest: StageRequest,
): Promise<void> => {
  const refreshArgs = [
    process.execPath,
    "run",
    "scripts/refresh-desktop-releases.ts",
    "--source-root",
    outputRoot,
    "--targets",
    target,
  ];
  if (stageRequest.profile.includeLinuxAppImage) {
    refreshArgs.push(LINUX_APPIMAGE_FLAG);
  }
  if (stageRequest.profile.includeLinuxSignatures) {
    refreshArgs.push(LINUX_SIGNING_FLAG);
  }
  if (stageRequest.profile.includeWindowsMsi) {
    refreshArgs.push(WINDOWS_MSI_FLAG);
  }
  if (stageRequest.profile.macosArchitectures.length > 0) {
    refreshArgs.push(MACOS_ARCH_FLAG, stageRequest.profile.macosArchitectures.join(","));
  }
  if (stageRequest.releaseMode) {
    refreshArgs.push("--release");
  }

  await runCommandOrExit(refreshArgs, {
    cwd: REPO_ROOT,
    env: process.env,
  });
};

const buildMacosTauriCommandEntries = (
  releaseProfile: DesktopReleaseArtifactProfile,
  tauriArgs: readonly string[],
  releaseMode: boolean,
): readonly MacosTauriCommandEntry[] => {
  const macosHostTarget = buildHostReleaseTarget("macos");
  return buildMacosTauriTargetsFromProfile(releaseProfile).map((tauriTarget) => {
    const signingArgs = buildSigningConfigArgs({ ...macosHostTarget, tauriTarget }, releaseMode);
    return {
      buildCommand: [
        process.execPath,
        "tauri",
        "build",
        "--no-bundle",
        "--target",
        tauriTarget,
        ...tauriArgs,
        ...signingArgs,
      ],
      bundleCommand: [
        process.execPath,
        "tauri",
        "bundle",
        "--bundles",
        releaseMode ? "app,dmg" : "app",
        "--target",
        tauriTarget,
        ...tauriArgs,
        ...signingArgs,
      ],
    };
  });
};

const createMacosFallbackDmg = async (
  metadata: DesktopBundleMetadata,
  tauriTarget: string,
): Promise<string> => {
  const architecture = resolveMacosArchitectureFromTauriTarget(tauriTarget);
  const appPath = await resolveExistingPath(
    `macOS app (${architecture}) bundle`,
    buildBundlePathCandidates("macos", tauriTarget, "macos", `${metadata.productName}.app`),
  );
  const dmgPath = buildBundlePathCandidates(
    "macos",
    tauriTarget,
    "dmg",
    `${metadata.productName}_${metadata.version}_${architecture}.dmg`,
  )[0];
  if (!dmgPath) {
    throw new Error(`Unable to resolve fallback macOS dmg output path for ${tauriTarget}.`);
  }
  await createMacosDmgFallback(appPath, dmgPath, metadata.productName);
  return `hdiutil create -srcfolder ${appPath} ${dmgPath}`;
};

const runMacosTauriCommandEntry = async (
  entry: MacosTauriCommandEntry,
  options: Pick<MacosTauriBuildFlowOptions, "env" | "metadata" | "releaseMode">,
): Promise<readonly string[]> => {
  await runCommandOrExit(entry.buildCommand, { cwd: DESKTOP_ROOT, env: options.env });
  await runCommandOrExit(entry.bundleCommand, { cwd: DESKTOP_ROOT, env: options.env });

  if (options.releaseMode) {
    await writeOutput(
      "desktop-release: macOS DMG bundling runs through Tauri's bundle_dmg.sh and can stay quiet while hdiutil create/convert completes.",
    );
    return [entry.buildCommand.join(" "), entry.bundleCommand.join(" ")];
  }

  const tauriTarget = entry.bundleCommand[entry.bundleCommand.indexOf("--target") + 1];
  return [
    entry.buildCommand.join(" "),
    entry.bundleCommand.join(" "),
    await createMacosFallbackDmg(options.metadata, tauriTarget),
  ];
};

const runMacosTauriBuildFlow = async ({
  env,
  metadata,
  releaseMode,
  releaseProfile,
  tauriArgs,
}: MacosTauriBuildFlowOptions): Promise<readonly string[]> => {
  const commandEntries = buildMacosTauriCommandEntries(releaseProfile, tauriArgs, releaseMode);

  const commandLog: string[] = [];
  await commandEntries.reduce<Promise<void>>(async (previous, entry) => {
    await previous;
    commandLog.push(...(await runMacosTauriCommandEntry(entry, { env, metadata, releaseMode })));
  }, Promise.resolve());

  return commandLog;
};

const createMacosDmgFallback = async (
  appPath: string,
  dmgPath: string,
  volumeName: string,
): Promise<void> => {
  if (!Bun.which("hdiutil")) {
    throw new Error("macOS DMG fallback packaging requires hdiutil on PATH.");
  }

  const stagingRoot = await mkdtemp(join(tmpdir(), "bao-desktop-dmg-"));
  await rm(dmgPath, { force: true });
  await mkdir(dirname(dmgPath), { recursive: true });

  await captureResult(async () => {
    await cp(appPath, join(stagingRoot, basename(appPath)), { recursive: true, force: true });
    await symlink("/Applications", join(stagingRoot, "Applications"));
    await runCommandOrExit(
      [
        "hdiutil",
        "create",
        "-volname",
        volumeName,
        "-srcfolder",
        stagingRoot,
        "-ov",
        "-format",
        "UDZO",
        dmgPath,
      ],
      {
        cwd: REPO_ROOT,
        env: process.env,
      },
    );
  }).then(async (result) => {
    await rm(stagingRoot, { recursive: true, force: true });
    if (!result.ok) {
      throw result.error;
    }
  });
};

/** Portable `.zip` is assembled in `stageWindowsArtifacts`; Tauri CLI only accepts `nsis` / `msi` here. */
const resolveWindowsBundles = (includeWindowsMsi: boolean): readonly string[] =>
  includeWindowsMsi ? (["nsis", "msi"] as const) : (["nsis"] as const);

const requireHostReleaseTarget = (hostTarget: HostReleaseTarget | undefined): HostReleaseTarget => {
  if (!hostTarget) {
    throw new Error("Desktop release build requires a resolved host target.");
  }

  return hostTarget;
};

const resolveBundleArgs = (
  hostTarget: HostReleaseTarget | undefined,
  releaseProfile: DesktopReleaseArtifactProfile,
): readonly string[] => {
  const resolvedHostTarget = requireHostReleaseTarget(hostTarget);

  if (resolvedHostTarget.artifactLabel.startsWith("linux")) {
    const linuxBundles: string[] = ["deb", "rpm"];
    if (releaseProfile.includeLinuxAppImage && resolvedHostTarget.artifactLabel === "linux-x64") {
      linuxBundles.push("appimage");
    }
    return ["--bundles", linuxBundles.join(",")] as const;
  }

  if (resolvedHostTarget.artifactLabel === "windows") {
    return [
      "--bundles",
      resolveWindowsBundles(releaseProfile.includeWindowsMsi).join(","),
    ] as const;
  }

  return [] as const;
};

const NSIS_CAPTURE_WATCHER_SCRIPT = join(REPO_ROOT, "scripts", "nsis-capture-watcher.ts");

/**
 * Spawns the NSIS capture watcher as a separate process.
 * The watcher polls NSIS bundle directories for `.nsi` files during
 * `cargo tauri build` and copies them to the capture directory before
 * Tauri v2 deletes them after `makensis`. Runs independently of the
 * parent's event loop to avoid starvation during subprocess I/O.
 */
const spawnNsisCaptureWatcher = (captureDir: string): { stop: () => Promise<void> } => {
  const nsisDirectories = buildDesktopBundleDirectoryCandidates("windows", undefined).map(
    (bundleRoot) => join(DESKTOP_TAURI_ROOT, bundleRoot, "nsis"),
  );

  const proc = Bun.spawn(
    [process.execPath, "run", NSIS_CAPTURE_WATCHER_SCRIPT, ...nsisDirectories, "--", captureDir],
    {
      cwd: REPO_ROOT,
      stdin: "pipe",
      stdout: "inherit",
      stderr: "inherit",
    },
  );

  return {
    stop: async () => {
      await proc.stdin.end();
      await proc.exited;
    },
  };
};

const runStandardTauriBuildFlow = async ({
  env,
  hostTarget,
  releaseMode,
  releaseProfile,
  tauriArgs,
}: TauriBuildFlowOptions): Promise<readonly string[]> => {
  const resolvedHostTarget = requireHostReleaseTarget(hostTarget);
  const isWindows = resolvedHostTarget.expectedPlatform === "win32";

  if (isWindows) {
    await rm(NSIS_CAPTURE_DIR, { force: true, recursive: true });
    await mkdir(NSIS_CAPTURE_DIR, { recursive: true });
  }
  const captureWatcher = isWindows ? spawnNsisCaptureWatcher(NSIS_CAPTURE_DIR) : undefined;

  const buildCommand = [
    process.execPath,
    "tauri",
    "build",
    ...resolveBundleArgs(resolvedHostTarget, releaseProfile),
    ...tauriArgs,
    ...buildSigningConfigArgs(resolvedHostTarget, releaseMode),
  ] as const;
  await runCommandOrExit(buildCommand, { cwd: DESKTOP_ROOT, env });
  if (captureWatcher) {
    await captureWatcher.stop();
  }
  return [buildCommand.join(" ")];
};

/** Tauri CLI's `--ci` flag reads `CI`; values like `1` are invalid (only `true` / `false`). */
const desktopReleaseEnvForTauri = (): NodeJS.ProcessEnv => {
  const env = { ...process.env } as NodeJS.ProcessEnv;
  if (env.CI === "1") {
    env.CI = "true";
  }
  return env;
};

const runTauriBuildFlow = async ({
  metadata,
  hostTarget,
  releaseMode,
  releaseProfile,
  tauriArgs,
}: TauriBuildRequest): Promise<readonly string[]> => {
  const resolvedHostTarget = requireHostReleaseTarget(hostTarget);
  const env = {
    ...desktopReleaseEnvForTauri(),
    APPIMAGE_EXTRACT_AND_RUN: process.env.APPIMAGE_EXTRACT_AND_RUN ?? "1",
  };
  const releaseEnv = releaseMode
    ? {
        ...env,
        DESKTOP_RELEASE_RELEASE_MODE: "true",
      }
    : env;

  if (resolvedHostTarget.artifactLabel === "macos") {
    return runMacosTauriBuildFlow({
      env: releaseEnv,
      metadata,
      releaseMode,
      releaseProfile,
      tauriArgs,
    });
  }

  // On Linux aarch64, linuxdeploy-plugin-gtk crashes with std::runtime_error
  // during AppImage bundling (linuxdeploy 1-alpha is unstable on ARM64).
  // Restrict to deb and rpm which build reliably.
  return runStandardTauriBuildFlow({
    env: releaseEnv,
    hostTarget: resolvedHostTarget,
    releaseMode,
    releaseProfile,
    tauriArgs,
  });
};

const buildLinuxSigningCommand = (
  outputPath: string,
  artifactPath: string,
  keyId: string,
  passphrase: string | undefined,
): readonly string[] =>
  passphrase
    ? ([
        "gpg",
        "--batch",
        "--yes",
        "--armor",
        "--pinentry-mode",
        "loopback",
        "--passphrase",
        passphrase,
        "--detach-sign",
        "--local-user",
        keyId,
        "--output",
        outputPath,
        artifactPath,
      ] as const)
    : ([
        "gpg",
        "--batch",
        "--yes",
        "--armor",
        "--detach-sign",
        "--local-user",
        keyId,
        "--output",
        outputPath,
        artifactPath,
      ] as const);

const signLinuxArtifacts = async (
  metadata: DesktopBundleMetadata,
  target: Extract<DesktopReleaseTarget, "linux-arm64" | "linux-x64">,
  profile: DesktopReleaseArtifactProfile,
): Promise<void> => {
  if (!profile.includeLinuxSignatures) {
    return;
  }

  if (!Bun.which("gpg")) {
    throw new Error("Linux release signatures require gpg on PATH.");
  }

  const keyId = readEnvValue(process.env[LINUX_GPG_KEY_ID_ENV]);
  if (!keyId) {
    throw new Error(
      `Linux release signatures require ${LINUX_GPG_KEY_ID_ENV} when --include-linux-signatures is enabled.`,
    );
  }

  const passphrase = readEnvValue(process.env[LINUX_GPG_PASSPHRASE_ENV]);
  const artifactSpecs = buildDesktopReleaseArtifactSpecs(metadata, target, profile).filter(
    isLinuxSignableArtifactSpec,
  );

  await Promise.all(
    artifactSpecs.map(async (artifact) => {
      const fileNameVariants =
        artifact.kind === "appimage"
          ? expandLinuxAppImageCandidateFileNames(target, artifact.fileName)
          : [artifact.fileName];
      const artifactPath = await resolveExistingPath(
        `Linux ${artifact.kind} artifact for detached signing`,
        buildLinuxBundlePathCandidatesForFileNames(target, artifact.kind, fileNameVariants),
      );
      const signaturePath = join(dirname(artifactPath), `${artifact.fileName}.sig`);
      await runCommandOrExit(
        buildLinuxSigningCommand(signaturePath, artifactPath, keyId, passphrase),
        {
          cwd: REPO_ROOT,
          env: process.env,
        },
      );
    }),
  );
};

const tryCreateZipArchive = async (
  commandCandidates: readonly (readonly string[])[],
  parentDir: string,
  index: number = 0,
): Promise<boolean> => {
  const command = commandCandidates[index];
  if (!command) {
    return false;
  }

  const executable = command[0];
  if (!Bun.which(executable)) {
    return tryCreateZipArchive(commandCandidates, parentDir, index + 1);
  }

  const exitCode = await runCommand(command, {
    cwd: executable === "zip" ? parentDir : REPO_ROOT,
    env: process.env,
  });
  if (exitCode === 0) {
    return true;
  }

  return tryCreateZipArchive(commandCandidates, parentDir, index + 1);
};

const createZipArchive = async (sourceDir: string, outputPath: string): Promise<void> => {
  await rm(outputPath, { force: true });
  const parentDir = resolve(sourceDir, "..");
  const baseName = basename(sourceDir);
  const zipCommandCandidates = [
    [
      "powershell",
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${sourceDir}' -DestinationPath '${outputPath}' -Force`,
    ],
    [
      "pwsh",
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${sourceDir}' -DestinationPath '${outputPath}' -Force`,
    ],
    ["zip", "-qr", "-9", outputPath, baseName],
  ] as const;

  if (await tryCreateZipArchive(zipCommandCandidates, parentDir)) {
    return;
  }

  throw new Error(`Unable to create zip archive at ${outputPath}.`);
};

const stageMacosArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
  profile: DesktopReleaseArtifactProfile,
): Promise<readonly string[]> => {
  const normalizedProfile = normalizeDesktopReleaseArtifactProfile(profile);
  const targetRoot = join(outputRoot, "macos");
  const artifactNames = buildDesktopReleaseArtifactFileNames(metadata, "macos", normalizedProfile);
  if (artifactNames.length === 0) {
    throw new Error("Canonical macOS release artifact names could not be resolved.");
  }

  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  await Promise.all(
    normalizedProfile.macosArchitectures.map(async (architecture) => {
      const dmgFileName = `${metadata.productName}_${metadata.version}_${architecture}.dmg`;
      const tauriTarget = resolveMacosTargetFromProfileArchitecture(architecture);
      const dmgPath = await resolveExistingPath(
        `macOS dmg (${architecture}) bundle`,
        buildBundlePathCandidates("macos", tauriTarget, "dmg", dmgFileName),
      );
      const destinationPath = join(targetRoot, dmgFileName);
      await cp(dmgPath, destinationPath);
    }),
  );

  const stagedArtifacts = await Promise.all(
    artifactNames.map(async (artifactName) => {
      const stagedPath = join(targetRoot, artifactName);
      if (!(await pathExists(stagedPath))) {
        throw new Error(`Expected macOS staged artifact missing: ${artifactName}`);
      }
      return artifactName;
    }),
  );

  return stagedArtifacts;
};

const resolveLinuxBundleDirectory = (
  artifactKind: "appimage" | "deb" | "rpm",
): "appimage" | "deb" | "rpm" => artifactKind;

/** Tauri AppImage naming has used both Debian (`amd64`) and GNU triplet-style (`x86_64`) suffixes. */
const expandLinuxAppImageCandidateFileNames = (
  target: Extract<DesktopReleaseTarget, "linux-arm64" | "linux-x64">,
  canonicalFileName: string,
): readonly string[] => {
  if (target !== "linux-x64" || !canonicalFileName.endsWith(".AppImage")) {
    return [canonicalFileName];
  }
  const variants = new Set<string>([canonicalFileName]);
  if (canonicalFileName.endsWith("_amd64.AppImage")) {
    variants.add(
      canonicalFileName.replace(LINUX_APPIMAGE_AMD64_SUFFIX_PATTERN, "_x86_64.AppImage"),
    );
  }
  if (canonicalFileName.endsWith("_x86_64.AppImage")) {
    variants.add(
      canonicalFileName.replace(LINUX_APPIMAGE_X86_64_SUFFIX_PATTERN, "_amd64.AppImage"),
    );
  }
  return [...variants];
};

const buildLinuxBundlePathCandidatesForFileNames = (
  target: Extract<DesktopReleaseTarget, "linux-arm64" | "linux-x64">,
  bundleKind: "appimage" | "deb" | "rpm",
  fileNames: readonly string[],
): readonly string[] =>
  fileNames.flatMap((fileName) =>
    buildBundlePathCandidates(target, undefined, resolveLinuxBundleDirectory(bundleKind), fileName),
  );

/** Resolve the NSIS `.nsi` script from the Tauri bundle output. Throws if not found. */
const resolveWindowsNsisScriptPath = async (): Promise<string> => {
  const nsisDirectories = buildDesktopBundleDirectoryCandidates("windows", undefined).map(
    (bundleRoot) => join(DESKTOP_TAURI_ROOT, bundleRoot, "nsis"),
  );
  const resolvedFromBundle = await Promise.all(
    nsisDirectories.map(async (nsisDirectory) => {
      if (!(await pathExists(nsisDirectory))) {
        return;
      }
      const directoryEntries = await readdir(nsisDirectory).catch(() => [] as string[]);
      const nsiFiles = directoryEntries.filter((entry) => entry.toLowerCase().endsWith(".nsi"));
      const preferred = nsiFiles.find((entry) => entry === "installer.nsi") ?? nsiFiles[0];
      return preferred ? join(nsisDirectory, preferred) : undefined;
    }),
  );
  const firstResolved = resolvedFromBundle.find((candidatePath) => candidatePath !== undefined);
  if (firstResolved) {
    return firstResolved;
  }

  /** Check the capture directory (populated by the background poller during build). */
  if (await pathExists(NSIS_CAPTURE_DIR)) {
    const capturedEntries = await readdir(NSIS_CAPTURE_DIR).catch(() => [] as string[]);
    const capturedNsi = capturedEntries.filter((entry) => entry.toLowerCase().endsWith(".nsi"));
    const capturedPreferred =
      capturedNsi.find((entry) => entry === "installer.nsi") ?? capturedNsi[0];
    if (capturedPreferred) {
      return join(NSIS_CAPTURE_DIR, capturedPreferred);
    }
  }

  const fallbackCandidates = [
    ...buildBundlePathCandidates("windows", undefined, "nsis", "installer.nsi"),
    ...buildReleasePathCandidates("windows", "nsis", "x64", "installer.nsi"),
  ];
  const existingFallback = await Promise.all(
    fallbackCandidates.map(async (candidate) => ({
      candidate,
      exists: await pathExists(candidate),
    })),
  );
  const resolved = existingFallback.find((entry) => entry.exists);
  if (resolved) {
    return resolved.candidate;
  }

  const searchedPaths = [...nsisDirectories, NSIS_CAPTURE_DIR, ...fallbackCandidates].join("\n  ");
  throw new Error(
    `NSIS installer script (.nsi) not found after Tauri build.\n` +
      `Searched:\n  ${searchedPaths}\n` +
      `The NSIS script is required for release verification.`,
  );
};

const inferLinuxArtifactKind = (artifactName: string): "appimage" | "deb" | "rpm" => {
  if (artifactName.endsWith(".deb")) {
    return "deb";
  }
  if (artifactName.endsWith(".rpm")) {
    return "rpm";
  }
  if (artifactName.endsWith(".AppImage")) {
    return "appimage";
  }

  throw new Error(`Unsupported Linux artifact type for ${artifactName}.`);
};

const stageLinuxArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
  target: Extract<DesktopReleaseTarget, "linux-x64" | "linux-arm64">,
  profile: DesktopReleaseArtifactProfile,
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, target);
  const artifactNames = buildDesktopReleaseArtifactFileNames(metadata, target, profile);
  if (artifactNames.length === 0) {
    throw new Error(`Canonical Linux release artifact names could not be resolved for ${target}.`);
  }

  const sourceArtifacts = new Map(
    await Promise.all(
      artifactNames.map(async (artifactName) => {
        if (artifactName.endsWith(".sig")) {
          const unsignedArtifactName = artifactName.slice(0, -4);
          const unsignedKind = inferLinuxArtifactKind(unsignedArtifactName);
          const signatureBundlePath = buildLinuxBundlePathCandidatesForFileNames(
            target,
            resolveLinuxBundleDirectory(unsignedKind),
            [artifactName],
          );
          return [
            artifactName,
            await resolveExistingPath("Linux signature artifact", signatureBundlePath),
          ] as const;
        }

        const artifactKind = inferLinuxArtifactKind(artifactName);
        const fileNameVariants =
          artifactKind === "appimage"
            ? expandLinuxAppImageCandidateFileNames(target, artifactName)
            : [artifactName];
        const sourcePaths = buildLinuxBundlePathCandidatesForFileNames(
          target,
          resolveLinuxBundleDirectory(artifactKind),
          fileNameVariants,
        );
        return [
          artifactName,
          await resolveExistingPath(`Linux ${artifactKind} artifact`, sourcePaths),
        ] as const;
      }),
    ),
  );

  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  await Promise.all(
    artifactNames.map(async (artifactName) => {
      const sourcePath = sourceArtifacts.get(artifactName);
      if (!sourcePath) {
        throw new Error(`Missing staged Linux artifact source path for ${artifactName}.`);
      }
      await cp(sourcePath, join(targetRoot, artifactName));
    }),
  );

  return artifactNames;
};

const buildWindowsPortableReadme = (metadata: DesktopBundleMetadata): string =>
  [
    "BaoBuildBuddy Windows portable package",
    "",
    "Run:",
    `  ${metadata.binaryName}.exe`,
    "",
    "Keep the gen directory next to the executable.",
    "If Microsoft Edge WebView2 is not installed yet, BaoBuildBuddy will prompt to run:",
    `  ${DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH}.exe`,
    "",
    `The packaged runtime includes ${DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH}.exe and ${DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH}.exe.`,
  ].join("\n");

const stageWindowsInstallerArtifacts = async (
  targetRoot: string,
  setupPath: string,
  nsisScriptPath: string,
): Promise<void> => {
  await cp(setupPath, join(targetRoot, basename(setupPath)));
  await cp(
    nsisScriptPath,
    join(targetRoot, DESKTOP_RELEASE_METADATA_DIR, basename(nsisScriptPath)),
  );
};

const stageWindowsPortableArtifacts = async (
  metadata: DesktopBundleMetadata,
  portableStageRoot: string,
  executablePath: string,
  runtimeRoot: string,
): Promise<void> => {
  await mkdir(portableStageRoot, { recursive: true });
  await cp(executablePath, join(portableStageRoot, `${metadata.binaryName}.exe`));
  await cp(runtimeRoot, join(portableStageRoot, "gen"), { recursive: true });
  await writeFile(join(portableStageRoot, "README.txt"), buildWindowsPortableReadme(metadata));
};

const resolveOptionalWindowsMsiPath = async (
  msiFileName: string | undefined,
): Promise<string | null> => {
  if (!msiFileName) {
    return null;
  }

  return resolveExistingPath(
    "Windows MSI installer",
    buildBundlePathCandidates("windows", undefined, "msi", msiFileName),
  );
};

const stageWindowsArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
  profile: DesktopReleaseArtifactProfile,
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, "windows");
  const artifactNames = buildDesktopReleaseArtifactFileNames(metadata, "windows", profile);
  const setupFileName = artifactNames.find((artifactName) => artifactName.endsWith("-setup.exe"));
  const portableFileName = artifactNames.find((artifactName) =>
    artifactName.endsWith("-portable.zip"),
  );
  const msiFileName = artifactNames.find((artifactName) => artifactName.endsWith(".msi"));

  if (!(setupFileName && portableFileName)) {
    throw new Error("Canonical Windows release artifact names could not be resolved.");
  }

  const setupPath = await resolveExistingPath(
    "Windows NSIS installer",
    buildBundlePathCandidates("windows", undefined, "nsis", setupFileName),
  );
  const executablePath = await resolveExistingPath(
    "Windows desktop executable",
    buildReleasePathCandidates("windows", undefined, `${metadata.binaryName}.exe`),
  );
  const runtimeRoot = await resolveExistingPath("Windows portable runtime directory", [
    DESKTOP_PORTABLE_RUNTIME_ROOT,
  ]);
  await resolveExistingPath("Windows WebView2 bootstrapper", [
    join(
      DESKTOP_TAURI_ROOT,
      DESKTOP_RUNTIME_RESOURCE_DIR,
      `${DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH}.exe`,
    ),
  ]);
  const nsisScriptPath = await resolveWindowsNsisScriptPath();
  const portableRootName = portableFileName.replace(ZIP_EXTENSION_PATTERN, "");
  const portableStageRoot = join(targetRoot, DESKTOP_RELEASE_METADATA_DIR, portableRootName);
  const portableArchivePath = join(targetRoot, portableFileName);
  const msiPath = await resolveOptionalWindowsMsiPath(msiFileName);

  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  await stageWindowsInstallerArtifacts(targetRoot, setupPath, nsisScriptPath);
  await stageWindowsPortableArtifacts(metadata, portableStageRoot, executablePath, runtimeRoot);
  await createZipArchive(portableStageRoot, portableArchivePath);
  await rm(portableStageRoot, { force: true, recursive: true });

  if (msiFileName && msiPath) {
    await cp(msiPath, join(targetRoot, msiFileName));
  }

  return artifactNames;
};

/** Replaces absolute paths in build command strings to avoid committing PII (username, home dir). */
const sanitizeBuildCommandsForProvenance = (
  commands: readonly string[],
  repoRoot: string,
): readonly string[] =>
  commands.map((cmd) => {
    let s = cmd;
    s = s.split(repoRoot).join(".");
    s = s.replace(/\/Users\/[^/]+\//g, "~/");
    s = s.replace(/\/home\/[^/]+\//g, "~/");
    s = s.replace(/C:\\Users\\[^\\]+\\/g, "<home>\\");
    return s;
  });

const writeProvenance = async (
  target: HostReleaseTarget,
  outputRoot: string,
  artifactNames: readonly string[],
  buildCommands: readonly string[],
): Promise<void> => {
  const sanitizedBuildCommands = sanitizeBuildCommandsForProvenance(buildCommands, REPO_ROOT);
  const provenance: ReleaseProvenance = {
    schemaVersion: 1,
    target: target.artifactLabel,
    strategy: "matching-host-native",
    tauriCli: "repo-local-bun",
    hostPlatform: process.platform,
    hostArch: process.arch,
    tauriTarget: target.tauriTarget,
    artifactNames,
    buildCommands: sanitizedBuildCommands,
    builtAt: new Date().toISOString(),
    ci: {
      workflow: process.env.GITHUB_WORKFLOW ?? null,
      runId: process.env.GITHUB_RUN_ID ?? null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
    },
  };
  const provenancePath = join(
    outputRoot,
    target.artifactLabel,
    DESKTOP_RELEASE_METADATA_DIR,
    DESKTOP_RELEASE_PROVENANCE_FILENAME,
  );
  await writeFormattedJsonFile(provenancePath, provenance);
};

const main = async (): Promise<void> => {
  const argv = process.argv.slice(2);
  const requestedTarget = resolveRequestedTarget(argv);
  const hostTarget = buildHostReleaseTarget(requestedTarget);
  if (process.platform !== hostTarget.expectedPlatform) {
    throw new Error(
      `Desktop release target ${requestedTarget} requires host platform ${hostTarget.expectedPlatform}, received ${process.platform}.`,
    );
  }

  const stageRequest = parseReleaseProfile(argv);
  const outputRoot = resolveOutputRoot(argv);
  const tauriArgs = filterForwardedArgs(argv);
  const skipBuild = shouldSkipBuild(argv);
  const syncReleaseDir = shouldSyncReleaseDirectory(argv);
  const metadata = await readDesktopMetadata();
  if (!skipBuild) {
    await runMacosPrebuildCleanup();
    await writeOutput(
      `desktop-release:${requestedTarget} building native artifacts for ${hostTarget.tauriTarget}`,
    );
  } else {
    await writeOutput(
      `desktop-release:${requestedTarget} staging existing native artifacts for ${hostTarget.tauriTarget}`,
    );
  }
  const buildCommands = skipBuild
    ? ([`stage-only existing bundled artifacts for ${hostTarget.tauriTarget}`] as const)
    : await runTauriBuildFlow({
        metadata,
        hostTarget,
        releaseProfile: stageRequest.profile,
        tauriArgs,
        releaseMode: stageRequest.releaseMode,
      });
  if (!skipBuild && isLinuxReleaseTarget(requestedTarget)) {
    await signLinuxArtifacts(metadata, requestedTarget, stageRequest.profile);
  }
  const artifactNames =
    requestedTarget === "macos"
      ? await stageMacosArtifacts(metadata, outputRoot, stageRequest.profile)
      : requestedTarget === "windows"
        ? await stageWindowsArtifacts(metadata, outputRoot, stageRequest.profile)
        : await stageLinuxArtifacts(metadata, outputRoot, requestedTarget, stageRequest.profile);
  await writeProvenance(hostTarget, outputRoot, artifactNames, buildCommands);
  await writeOutput(
    `desktop-release:${requestedTarget} staged ${artifactNames.join(", ")} in ${join(outputRoot, requestedTarget)}`,
  );
  if (syncReleaseDir) {
    await writeOutput(
      `desktop-release:${requestedTarget} syncing staged artifacts into packages/desktop/releases`,
    );
    await syncReleaseDirectory(outputRoot, requestedTarget, stageRequest);
  }
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(toErrorMessage(result.error, "Unexpected desktop release build failure."));
  process.exit(1);
}
