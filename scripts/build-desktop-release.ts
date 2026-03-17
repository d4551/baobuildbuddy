import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
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
  buildDesktopReleaseDirectoryCandidates,
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
  const proc = Bun.spawn(command, {
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
  ...relativeSegments: readonly string[]
): readonly string[] =>
  buildDesktopReleaseDirectoryCandidates(target).map((releaseRoot) =>
    join(DESKTOP_TAURI_ROOT, releaseRoot, ...relativeSegments),
  );

const buildBundlePathCandidates = (
  target: DesktopReleaseTarget,
  ...relativeSegments: readonly string[]
): readonly string[] =>
  buildDesktopBundleDirectoryCandidates(target).map((bundleRoot) =>
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
      argument !== "--target" &&
      argument !== "--output-root" &&
      argument !== "--skip-build" &&
      argument !== "--no-sync-release-dir" &&
      previous !== "--target" &&
      previous !== "--output-root"
    );
  });

const syncReleaseDirectory = async (
  outputRoot: string,
  target: DesktopReleaseTarget,
): Promise<void> => {
  await runCommandOrExit(
    [
      process.execPath,
      "run",
      "scripts/refresh-desktop-releases.ts",
      "--source-root",
      outputRoot,
      "--targets",
      target,
    ],
    {
      cwd: REPO_ROOT,
      env: process.env,
    },
  );
};

const runMacosTauriBuildFlow = async (
  tauriArgs: readonly string[],
  env: Record<string, string | undefined>,
): Promise<readonly string[]> => {
  const buildCommand = [process.execPath, "tauri", "build", "--no-bundle", ...tauriArgs] as const;
  const bundleCommand = [
    process.execPath,
    "tauri",
    "bundle",
    "--bundles",
    "app,dmg",
    ...tauriArgs,
  ] as const;

  await runCommandOrExit(buildCommand, { cwd: DESKTOP_ROOT, env });
  await writeOutput(
    "desktop-release: macOS DMG bundling runs through Tauri's bundle_dmg.sh and can stay quiet while hdiutil create/convert completes.",
  );
  await runCommandOrExit(bundleCommand, { cwd: DESKTOP_ROOT, env });
  return [buildCommand.join(" "), bundleCommand.join(" ")];
};

const buildStandardBundleArgs = (hostTarget: HostReleaseTarget): readonly string[] => {
  if (hostTarget.artifactLabel.startsWith("linux")) {
    return ["--bundles", "deb,rpm"] as const;
  }

  if (hostTarget.artifactLabel === "windows") {
    return ["--bundles", "nsis"] as const;
  }

  return [] as const;
};

const runStandardTauriBuildFlow = async (
  hostTarget: HostReleaseTarget,
  tauriArgs: readonly string[],
  env: Record<string, string | undefined>,
): Promise<readonly string[]> => {
  const buildCommand = [
    process.execPath,
    "tauri",
    "build",
    ...buildStandardBundleArgs(hostTarget),
    ...tauriArgs,
  ] as const;
  await runCommandOrExit(buildCommand, { cwd: DESKTOP_ROOT, env });
  return [buildCommand.join(" ")];
};

const runTauriBuildFlow = async (
  hostTarget: HostReleaseTarget,
  tauriArgs: readonly string[],
): Promise<readonly string[]> => {
  const env = {
    ...process.env,
    APPIMAGE_EXTRACT_AND_RUN: process.env.APPIMAGE_EXTRACT_AND_RUN ?? "1",
  };

  if (hostTarget.artifactLabel === "macos") {
    return runMacosTauriBuildFlow(tauriArgs, env);
  }

  // On Linux aarch64, linuxdeploy-plugin-gtk crashes with std::runtime_error
  // during AppImage bundling (linuxdeploy 1-alpha is unstable on ARM64).
  // Restrict to deb and rpm which build reliably.
  return runStandardTauriBuildFlow(hostTarget, tauriArgs, env);
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
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, "macos");
  const [dmgFileName] = buildDesktopReleaseArtifactFileNames(metadata, "macos");
  if (!dmgFileName) {
    throw new Error("Canonical macOS release artifact name could not be resolved.");
  }
  const dmgPath = await resolveExistingPath(
    "macOS dmg bundle",
    buildBundlePathCandidates("macos", "dmg", dmgFileName),
  );
  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  const destinationPath = join(targetRoot, basename(dmgPath));
  await cp(dmgPath, destinationPath);
  return [basename(destinationPath)];
};

const stageLinuxArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
  target: Extract<DesktopReleaseTarget, "linux-x64" | "linux-arm64">,
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, target);
  const [debFileName, rpmFileName] = buildDesktopReleaseArtifactFileNames(metadata, target);
  if (!(debFileName && rpmFileName)) {
    throw new Error(`Canonical Linux release artifact names could not be resolved for ${target}.`);
  }
  const artifactPaths = await Promise.all([
    resolveExistingPath(
      `${target} deb bundle`,
      buildBundlePathCandidates(target, "deb", debFileName),
    ),
    resolveExistingPath(
      `${target} rpm bundle`,
      buildBundlePathCandidates(target, "rpm", rpmFileName),
    ),
  ] as const);
  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  await Promise.all(
    artifactPaths.map((artifactPath) => cp(artifactPath, join(targetRoot, basename(artifactPath)))),
  );

  return artifactPaths.map((artifactPath) => basename(artifactPath));
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

const stageWindowsArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, "windows");
  const [setupFileName, portableFileName] = buildDesktopReleaseArtifactFileNames(
    metadata,
    "windows",
  );
  if (!(setupFileName && portableFileName)) {
    throw new Error("Canonical Windows release artifact names could not be resolved.");
  }
  const setupPath = await resolveExistingPath(
    "Windows NSIS installer",
    buildBundlePathCandidates("windows", "nsis", setupFileName),
  );
  const executablePath = await resolveExistingPath(
    "Windows desktop executable",
    buildReleasePathCandidates("windows", `${metadata.binaryName}.exe`),
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
  const nsisScriptPath = await resolveExistingPath(
    "Windows NSIS script",
    buildReleasePathCandidates("windows", "nsis", "x64", "installer.nsi"),
  );
  const portableRootName = portableFileName.replace(ZIP_EXTENSION_PATTERN, "");
  const portableStageRoot = join(targetRoot, DESKTOP_RELEASE_METADATA_DIR, portableRootName);
  const portableArchivePath = join(targetRoot, portableFileName);

  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  await stageWindowsInstallerArtifacts(targetRoot, setupPath, nsisScriptPath);
  await stageWindowsPortableArtifacts(metadata, portableStageRoot, executablePath, runtimeRoot);
  await createZipArchive(portableStageRoot, portableArchivePath);
  await rm(portableStageRoot, { force: true, recursive: true });

  return [basename(setupPath), basename(portableArchivePath)];
};

const writeProvenance = async (
  target: HostReleaseTarget,
  outputRoot: string,
  artifactNames: readonly string[],
  buildCommands: readonly string[],
): Promise<void> => {
  const provenance: ReleaseProvenance = {
    schemaVersion: 1,
    target: target.artifactLabel,
    strategy: "matching-host-native",
    tauriCli: "repo-local-bun",
    hostPlatform: process.platform,
    hostArch: process.arch,
    tauriTarget: target.tauriTarget,
    artifactNames,
    buildCommands,
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
    : await runTauriBuildFlow(hostTarget, tauriArgs);
  const artifactNames =
    requestedTarget === "macos"
      ? await stageMacosArtifacts(metadata, outputRoot)
      : requestedTarget === "windows"
        ? await stageWindowsArtifacts(metadata, outputRoot)
        : await stageLinuxArtifacts(metadata, outputRoot, requestedTarget);
  await writeProvenance(hostTarget, outputRoot, artifactNames, buildCommands);
  await writeOutput(
    `desktop-release:${requestedTarget} staged ${artifactNames.join(", ")} in ${join(outputRoot, requestedTarget)}`,
  );
  if (syncReleaseDir) {
    await writeOutput(
      `desktop-release:${requestedTarget} syncing staged artifacts into packages/desktop/releases`,
    );
    await syncReleaseDirectory(outputRoot, requestedTarget);
  }
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(toErrorMessage(result.error, "Unexpected desktop release build failure."));
  process.exit(1);
}
