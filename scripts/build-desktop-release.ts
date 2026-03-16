import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import {
  DESKTOP_RELEASE_LINUX_ARCH,
  DESKTOP_RELEASE_LINUX_DEB_ARCH,
  DESKTOP_RELEASE_LINUX_TARGET,
  DESKTOP_RELEASE_MACOS_ARCH,
  DESKTOP_RELEASE_MACOS_TARGET,
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  DESKTOP_RELEASE_STAGING_ROOT,
  DESKTOP_RELEASE_TARGETS,
  DESKTOP_RELEASE_WINDOWS_ARCH,
  DESKTOP_RUNTIME_RESOURCE_DIR,
  DESKTOP_RELEASE_WINDOWS_TARGET,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH,
  DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
  DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH,
} from "../packages/shared/src/constants/scripts";
import { captureResult, toErrorMessage } from "./utils/async-control";
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
const DESKTOP_CLEANUP_SCRIPT_PATH = join(REPO_ROOT, "scripts", "cleanup-desktop-build.ts");
const DESKTOP_PACKAGE_JSON_PATH = join(DESKTOP_ROOT, "package.json");
const DESKTOP_TAURI_CONFIG_PATH = join(DESKTOP_TAURI_ROOT, "tauri.conf.json");
const DESKTOP_CARGO_TOML_PATH = join(DESKTOP_TAURI_ROOT, "Cargo.toml");
const CARGO_VERSION_PATTERN = /^version = "([^"]+)"/m;
const CARGO_PACKAGE_NAME_PATTERN = /^name = "([^"]+)"/m;

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

const runMacosPrebuildCleanup = async (): Promise<void> => {
  if (process.platform !== "darwin") {
    return;
  }

  const cleanupExitCode = await runCommand(
    [process.execPath, DESKTOP_CLEANUP_SCRIPT_PATH, "prebuild"],
    {
      cwd: REPO_ROOT,
      env: process.env,
    },
  );
  if (cleanupExitCode !== 0) {
    process.exit(cleanupExitCode);
  }
};

const pathExists = async (absolutePath: string): Promise<boolean> =>
  Bun.file(absolutePath).exists();

const requireFile = async (absolutePath: string): Promise<void> => {
  if (!(await pathExists(absolutePath))) {
    throw new Error(`Required file is missing: ${absolutePath}`);
  }
};

const resolveOutputRoot = (argv: readonly string[]): string => {
  const rootIndex = argv.indexOf("--output-root");
  const outputRoot =
    rootIndex === -1 ? DESKTOP_RELEASE_STAGING_ROOT : argv[rootIndex + 1] ?? DESKTOP_RELEASE_STAGING_ROOT;
  return resolve(REPO_ROOT, outputRoot);
};

const resolveRequestedTarget = (argv: readonly string[]): DesktopReleaseTarget => {
  const targetIndex = argv.indexOf("--target");
  const requestedTarget = targetIndex === -1 ? null : argv[targetIndex + 1] ?? null;
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
    return "linux";
  }

  throw new Error(
    `Unsupported desktop release host platform: ${process.platform}. Supply --target on a supported host.`,
  );
};

const shouldSkipBuild = (argv: readonly string[]): boolean =>
  argv.includes("--skip-build");

const shouldSyncReleaseDirectory = (argv: readonly string[]): boolean =>
  !argv.includes("--no-sync-release-dir");

const buildHostReleaseTarget = (target: DesktopReleaseTarget): HostReleaseTarget => {
  if (target === "macos") {
    return {
      artifactLabel: "macos",
      expectedPlatform: "darwin",
      tauriTarget: DESKTOP_RELEASE_MACOS_TARGET,
    };
  }

  if (target === "windows") {
    return {
      artifactLabel: "windows",
      expectedPlatform: "win32",
      tauriTarget: DESKTOP_RELEASE_WINDOWS_TARGET,
    };
  }

  return {
    artifactLabel: "linux",
    expectedPlatform: "linux",
    tauriTarget: DESKTOP_RELEASE_LINUX_TARGET,
  };
};

const filterForwardedArgs = (argv: readonly string[]): string[] =>
  argv.filter((argument, index) => {
    const previous = argv[index - 1];
    return argument !== "--target" &&
      argument !== "--output-root" &&
      argument !== "--skip-build" &&
      argument !== "--no-sync-release-dir" &&
      previous !== "--target" &&
      previous !== "--output-root";
  });

const syncReleaseDirectory = async (
  outputRoot: string,
  target: DesktopReleaseTarget,
): Promise<void> => {
  const refreshExitCode = await runCommand(
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
  if (refreshExitCode !== 0) {
    process.exit(refreshExitCode);
  }
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
    const buildCommand = [
      process.execPath,
      "tauri",
      "build",
      "--no-bundle",
      ...tauriArgs,
    ] as const;
    const bundleCommand = [
      process.execPath,
      "tauri",
      "bundle",
      "--bundles",
      "app,dmg",
      ...tauriArgs,
    ] as const;

    const buildExitCode = await runCommand(buildCommand, {
      cwd: DESKTOP_ROOT,
      env,
    });
    if (buildExitCode !== 0) {
      process.exit(buildExitCode);
    }

    await writeOutput(
      "desktop-release: macOS DMG bundling runs through Tauri's bundle_dmg.sh and can stay quiet while hdiutil create/convert completes.",
    );
    const bundleExitCode = await runCommand(bundleCommand, {
      cwd: DESKTOP_ROOT,
      env,
    });
    if (bundleExitCode !== 0) {
      process.exit(bundleExitCode);
    }

    return [buildCommand.join(" "), bundleCommand.join(" ")];
  }

  // On Linux aarch64, linuxdeploy-plugin-gtk crashes with std::runtime_error
  // during AppImage bundling (linuxdeploy 1-alpha is unstable on ARM64).
  // Restrict to deb and rpm which build reliably.
  const linuxBundleArgs =
    hostTarget.artifactLabel === "linux" ? ["--bundles", "deb,rpm"] : [];

  const buildCommand = [
    process.execPath,
    "tauri",
    "build",
    ...linuxBundleArgs,
    ...tauriArgs,
  ] as const;
  const buildExitCode = await runCommand(buildCommand, {
    cwd: DESKTOP_ROOT,
    env,
  });
  if (buildExitCode !== 0) {
    process.exit(buildExitCode);
  }

  return [buildCommand.join(" ")];
};

const createZipArchive = async (sourceDir: string, outputPath: string): Promise<void> => {
  await rm(outputPath, { force: true });
  const parentDir = resolve(sourceDir, "..");
  const baseName = basename(sourceDir);
  const zipCommandCandidates = [
    ["powershell", "-NoProfile", "-Command", `Compress-Archive -Path '${sourceDir}' -DestinationPath '${outputPath}' -Force`],
    ["pwsh", "-NoProfile", "-Command", `Compress-Archive -Path '${sourceDir}' -DestinationPath '${outputPath}' -Force`],
    ["zip", "-qr", "-9", outputPath, baseName],
  ] as const;

  for (const command of zipCommandCandidates) {
    const executable = command[0];
    const executablePath = Bun.which(executable);
    if (!executablePath) {
      continue;
    }

    const exitCode = await runCommand(command, {
      cwd: executable === "zip" ? parentDir : REPO_ROOT,
      env: process.env,
    });
    if (exitCode === 0) {
      return;
    }
  }

  throw new Error(`Unable to create zip archive at ${outputPath}.`);
};

const stageMacosArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, "macos");
  const dmgPath = join(
    DESKTOP_TAURI_ROOT,
    "target",
    "release",
    "bundle",
    "dmg",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_MACOS_ARCH}.dmg`,
  );

  await requireFile(dmgPath);
  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  const destinationPath = join(targetRoot, basename(dmgPath));
  await cp(dmgPath, destinationPath);
  return [basename(destinationPath)];
};

const stageLinuxArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, "linux");
  const bundleRoot = join(
    DESKTOP_TAURI_ROOT,
    "target",
    "release",
    "bundle",
  );
  const artifactPaths = [
    join(
      bundleRoot,
      "deb",
      `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_LINUX_DEB_ARCH}.deb`,
    ),
    join(
      bundleRoot,
      "rpm",
      `${metadata.productName}-${metadata.version}-1.${DESKTOP_RELEASE_LINUX_ARCH}.rpm`,
    ),
  ] as const;

  await Promise.all(artifactPaths.map((artifactPath) => requireFile(artifactPath)));
  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  await Promise.all(
    artifactPaths.map((artifactPath) =>
      cp(artifactPath, join(targetRoot, basename(artifactPath)))),
  );

  return artifactPaths.map((artifactPath) => basename(artifactPath));
};

const stageWindowsArtifacts = async (
  metadata: DesktopBundleMetadata,
  outputRoot: string,
): Promise<readonly string[]> => {
  const targetRoot = join(outputRoot, "windows");
  const targetReleaseRoot = join(
    DESKTOP_TAURI_ROOT,
    "target",
    "release",
  );
  const bundledRuntimeRoot = join(targetReleaseRoot, DESKTOP_RUNTIME_RESOURCE_DIR);
  const setupPath = join(
    targetReleaseRoot,
    "bundle",
    "nsis",
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-setup.exe`,
  );
  const executablePath = join(targetReleaseRoot, `${metadata.binaryName}.exe`);
  const runtimeRoot = join(targetReleaseRoot, "gen");
  const bootstrapperPath = join(
    bundledRuntimeRoot,
    `${DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH}.exe`,
  );
  const nsisScriptPath = join(targetReleaseRoot, "nsis", "x64", "installer.nsi");
  const portableRootName =
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-portable`;
  const portableStageRoot = join(targetRoot, DESKTOP_RELEASE_METADATA_DIR, portableRootName);
  const portableArchivePath = join(
    targetRoot,
    `${metadata.productName}_${metadata.version}_${DESKTOP_RELEASE_WINDOWS_ARCH}-portable.zip`,
  );

  await Promise.all([
    requireFile(setupPath),
    requireFile(executablePath),
    requireFile(bootstrapperPath),
    requireFile(nsisScriptPath),
  ]);

  await rm(targetRoot, { force: true, recursive: true });
  await mkdir(join(targetRoot, DESKTOP_RELEASE_METADATA_DIR), { recursive: true });
  await cp(setupPath, join(targetRoot, basename(setupPath)));
  await cp(nsisScriptPath, join(targetRoot, DESKTOP_RELEASE_METADATA_DIR, basename(nsisScriptPath)));

  await mkdir(portableStageRoot, { recursive: true });
  await cp(executablePath, join(portableStageRoot, `${metadata.binaryName}.exe`));
  await cp(runtimeRoot, join(portableStageRoot, "gen"), { recursive: true });
  await writeFile(
    join(portableStageRoot, "README.txt"),
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
    ].join("\n"),
  );
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
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
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
        : await stageLinuxArtifacts(metadata, outputRoot);
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
