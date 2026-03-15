import { cp, mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { DISK_IMAGE_TIMEOUT_MS } from "../packages/shared/src/constants/scripts";
import { writeError, writeOutput } from "./utils/cli-output";
import { captureResult, toErrorMessage } from "./utils/async-control";

type MountedDesktopImage = {
  imagePath: string;
  mountPaths: string[];
};

type CommandOutputChunk = {
  stream: "stdout" | "stderr";
  text: string;
};

type CapturedCommandResult = {
  exitCode: number;
  output: CommandOutputChunk[];
};

const readCapturedStream = (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  streamName: CommandOutputChunk["stream"],
  output: CommandOutputChunk[],
): Promise<void> =>
  reader.read().then(({ done, value }) => {
    if (done) {
      const tail = decoder.decode();
      if (tail.length > 0) {
        output.push({ stream: streamName, text: tail });
      }
      return;
    }

    const chunkText = decoder.decode(value, { stream: true });
    if (chunkText.length > 0) {
      output.push({ stream: streamName, text: chunkText });
    }

    return readCapturedStream(reader, decoder, streamName, output);
  });

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_TAURI_ROOT = join(REPO_ROOT, "packages", "desktop", "src-tauri");
const PREPARE_DESKTOP_RUNTIME_SCRIPT = join(REPO_ROOT, "scripts", "prepare-desktop-runtime.ts");
const DESKTOP_BUNDLE_GLOB = new Bun.Glob("target/**/bundle");
const DESKTOP_TEMP_DMG_GLOB = new Bun.Glob("target/**/bundle/**/rw.*.dmg");
const MOUNT_LINE_SPLIT_PATTERN = /\t+/;
const STREAM_LINE_SPLIT_PATTERN = /(?<=\n)/u;
const DESKTOP_MOUNTED_IMAGE_PATTERN = /\/bundle\/(?:dmg|macos)\/rw\..+\.dmg$/;
const CARGO_VERSION_PATTERN = /^version = "([^"]+)"/m;
const CARGO_PACKAGE_NAME_PATTERN = /^name = "([^"]+)"/m;
const RECOVERABLE_WINDOWS_BUNDLE_LINE_PATTERNS = [
  /Running makensis to produce/u,
  /warning 5202: -OUTPUTCHARSET is disabled for non Win32 platforms\./u,
  /libc\+\+abi: terminating due to uncaught exception of type std::bad_alloc: std::bad_alloc/u,
  /failed to bundle project `No such file or directory \(os error 2\)`/u,
  /Error failed to bundle project `No such file or directory \(os error 2\)`/u,
  /error: "tauri" exited with code 1/u,
] as const;

const isDesktopMountedImage = (imagePath: string): boolean =>
  imagePath.startsWith(DESKTOP_TAURI_ROOT) && DESKTOP_MOUNTED_IMAGE_PATTERN.test(imagePath);

const runCommand = async (
  command: readonly string[],
  cwd: string = REPO_ROOT,
  env: Record<string, string | undefined> = process.env,
): Promise<number> => {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    env,
  });

  return proc.exited;
};

const captureCommand = async (
  command: readonly string[],
  cwd: string = REPO_ROOT,
  env: Record<string, string | undefined> = process.env,
): Promise<CapturedCommandResult> => {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env,
  });

  const output: CommandOutputChunk[] = [];
  const consumeStream = async (
    stream: ReadableStream<Uint8Array> | null,
    streamName: "stdout" | "stderr",
  ): Promise<void> => {
    if (!stream) {
      return;
    }

    const decoder = new TextDecoder();
    const reader = stream.getReader();
    await readCapturedStream(reader, decoder, streamName, output);
    reader.releaseLock();
  };

  await Promise.all([
    consumeStream(proc.stdout instanceof ReadableStream ? proc.stdout : null, "stdout"),
    consumeStream(proc.stderr instanceof ReadableStream ? proc.stderr : null, "stderr"),
    proc.exited,
  ]);

  return {
    exitCode: await proc.exited,
    output,
  };
};

const emitCapturedOutput = (
  output: readonly CommandOutputChunk[],
  suppressedPatterns: readonly RegExp[] = [],
): void => {
  const pendingTextByStream: Record<CommandOutputChunk["stream"], string> = {
    stdout: "",
    stderr: "",
  };

  const shouldSuppress = (line: string): boolean =>
    suppressedPatterns.some((pattern) => pattern.test(line));

  const flushStreamLines = (streamName: CommandOutputChunk["stream"], flushRemainder: boolean): void => {
    const writer = streamName === "stdout" ? process.stdout : process.stderr;
    const pendingText = pendingTextByStream[streamName];
    const lastNewlineIndex = pendingText.lastIndexOf("\n");
    const flushBoundary = flushRemainder ? pendingText.length : lastNewlineIndex + 1;

    if (flushBoundary <= 0) {
      return;
    }

    const textToFlush = pendingText.slice(0, flushBoundary);
    pendingTextByStream[streamName] = pendingText.slice(flushBoundary);

    for (const line of textToFlush.split(STREAM_LINE_SPLIT_PATTERN)) {
      if (line.length === 0 || shouldSuppress(line)) {
        continue;
      }
      writer.write(line);
    }
  };

  for (const chunk of output) {
    pendingTextByStream[chunk.stream] += chunk.text;
    flushStreamLines(chunk.stream, false);
  }

  flushStreamLines("stdout", true);
  flushStreamLines("stderr", true);
};

const runCommandWithTimeout = async (
  command: readonly string[],
  timeoutMs: number,
  cwd: string = REPO_ROOT,
  env: Record<string, string | undefined> = process.env,
): Promise<number> => {
  const proc = Bun.spawn(command, {
    cwd,
    stdout: "inherit",
    stderr: "inherit",
    env,
  });

  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    proc.kill();
  }, timeoutMs);

  const exitCode = await proc.exited.finally(() => {
    clearTimeout(timeout);
  });
  return timedOut ? 124 : exitCode;
};

const readCommand = async (command: readonly string[]): Promise<string> => {
  const proc = Bun.spawn(command, {
    cwd: REPO_ROOT,
    stdout: "pipe",
    stderr: "inherit",
    env: process.env,
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0 || !(proc.stdout instanceof ReadableStream)) {
    await writeError(`${command.join(" ")} failed with exit code ${exitCode}.`);
    process.exit(exitCode || 1);
  }

  return new Response(proc.stdout).text();
};

const pathExists = async (candidatePath: string): Promise<boolean> =>
  stat(candidatePath).then(
    () => true,
    () => false,
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readJsonObject = async (absolutePath: string): Promise<Record<string, unknown>> => {
  const parsed: unknown = JSON.parse(await Bun.file(absolutePath).text());
  if (isRecord(parsed)) {
    return parsed;
  }

  await writeError(`Expected JSON object at ${absolutePath}.`);
  process.exit(1);
};

const parseMountedDesktopImages = (infoText: string): MountedDesktopImage[] =>
  infoText.split("================================================").flatMap((sectionText) => {
    const lines = sectionText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const imagePathLine = lines.find((line) => line.startsWith("image-path"));
    if (!imagePathLine) {
      return [];
    }

    const imagePath = imagePathLine.split(":").slice(1).join(":").trim();
    if (!isDesktopMountedImage(imagePath)) {
      return [];
    }

    const mountPaths = lines.flatMap((line) => {
      const parts = line.split(MOUNT_LINE_SPLIT_PATTERN);
      return parts.filter((part) => part.startsWith("/Volumes/"));
    });

    return [{ imagePath, mountPaths }];
  });

const detachMountedImagesAtIndex = async (
  mountedImages: readonly MountedDesktopImage[],
  index: number,
): Promise<void> => {
  const mountedImage = mountedImages[index];
  if (!mountedImage) {
    return;
  }

  const detachMountPathAtIndex = async (
    mountPaths: readonly string[],
    mountIndex: number,
  ): Promise<void> => {
    const mountPath = mountPaths[mountIndex];
    if (!mountPath) {
      return;
    }

    await writeOutput(`Detaching stale desktop image mount ${mountPath}`);
    const exitCode = await runCommand(["hdiutil", "detach", mountPath]);
    if (exitCode !== 0) {
      await writeError(`Failed to detach stale desktop image mount ${mountPath}.`);
      process.exit(exitCode);
    }

    return detachMountPathAtIndex(mountPaths, mountIndex + 1);
  };

  await detachMountPathAtIndex(mountedImage.mountPaths, 0);
  return detachMountedImagesAtIndex(mountedImages, index + 1);
};

const collectTemporaryDiskImages = async (): Promise<string[]> => {
  const imagePaths: string[] = [];
  for await (const relativePath of DESKTOP_TEMP_DMG_GLOB.scan({
    cwd: DESKTOP_TAURI_ROOT,
  })) {
    imagePaths.push(join(DESKTOP_TAURI_ROOT, relativePath));
  }

  return imagePaths;
};

const collectBundleDirectories = async (): Promise<string[]> => {
  const directoryPaths: string[] = [];
  for await (const relativePath of DESKTOP_BUNDLE_GLOB.scan({
    cwd: DESKTOP_TAURI_ROOT,
  })) {
    directoryPaths.push(join(DESKTOP_TAURI_ROOT, relativePath));
  }

  return directoryPaths;
};

const resolveTargetArg = (tauriArgs: readonly string[]): string | null => {
  const targetIndex = tauriArgs.findIndex(
    (argument) => argument === "--target" || argument === "-t",
  );
  if (targetIndex === -1) {
    return null;
  }

  const target = tauriArgs[targetIndex + 1];
  return typeof target === "string" && target.trim().length > 0 ? target.trim() : null;
};

const resolveBundlesArgIndex = (tauriArgs: readonly string[]): number =>
  tauriArgs.findIndex((argument) => argument === "--bundles" || argument === "-b");

const resolveConfigArgIndex = (tauriArgs: readonly string[]): number =>
  tauriArgs.findIndex((argument) => argument === "--config" || argument === "-c");

const resolveBundlesArgValue = (tauriArgs: readonly string[]): string | null => {
  const bundlesIndex = resolveBundlesArgIndex(tauriArgs);
  if (bundlesIndex === -1) {
    return null;
  }

  const bundlesValue = tauriArgs[bundlesIndex + 1];
  return typeof bundlesValue === "string" && bundlesValue.trim().length > 0
    ? bundlesValue.trim()
    : null;
};

const isMacosBuildTarget = (target: string | null): boolean =>
  target === null || target.endsWith("apple-darwin") || target === "universal-apple-darwin";

const isWindowsBuildTarget = (target: string | null): boolean =>
  target !== null &&
  (target.endsWith("pc-windows-msvc") || target.endsWith("pc-windows-gnu"));

const shouldRecoverWindowsBundleFailure = (tauriArgs: readonly string[]): boolean =>
  process.platform !== "win32" &&
  !tauriArgs.includes("--no-bundle") &&
  isWindowsBuildTarget(resolveTargetArg(tauriArgs));

const shouldBuildHeadlessMacosDmg = (tauriArgs: readonly string[]): boolean => {
  if (process.platform !== "darwin" || tauriArgs.includes("--no-bundle")) {
    return false;
  }

  if (!isMacosBuildTarget(resolveTargetArg(tauriArgs))) {
    return false;
  }

  const bundlesValue = resolveBundlesArgValue(tauriArgs);
  if (bundlesValue === null) {
    return true;
  }

  return bundlesValue
    .split(",")
    .map((bundle) => bundle.trim())
    .some((bundle) => bundle === "dmg");
};

const normalizeMacosBuildArgs = (tauriArgs: readonly string[]): string[] => {
  if (!shouldBuildHeadlessMacosDmg(tauriArgs)) {
    return [...tauriArgs];
  }

  const normalized = [...tauriArgs];
  const bundlesIndex = resolveBundlesArgIndex(normalized);
  if (bundlesIndex === -1) {
    normalized.push("--bundles", "app");
    return normalized;
  }

  normalized[bundlesIndex + 1] = "app";
  return normalized;
};

const resolveMacosArchLabel = (tauriArgs: readonly string[]): string => {
  const target = resolveTargetArg(tauriArgs);
  if (target?.startsWith("aarch64-")) {
    return "aarch64";
  }
  if (target?.startsWith("x86_64-")) {
    return "x64";
  }
  if (target === "universal-apple-darwin") {
    return "universal";
  }
  if (process.arch === "arm64") {
    return "aarch64";
  }
  if (process.arch === "x64") {
    return "x64";
  }
  return process.arch;
};

const mergeConfigObjects = (
  current: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> => {
  const merged: Record<string, unknown> = { ...current };
  for (const [key, overrideValue] of Object.entries(override)) {
    const currentValue = merged[key];
    if (isRecord(currentValue) && isRecord(overrideValue)) {
      merged[key] = mergeConfigObjects(currentValue, overrideValue);
      continue;
    }

    merged[key] = overrideValue;
  }

  return merged;
};

const withBeforeBuildDisabled = (tauriArgs: readonly string[]): string[] => {
  const configOverride = {
    build: {
      beforeBuildCommand: "",
    },
  } satisfies Record<string, unknown>;
  const nextArgs = [...tauriArgs];
  const configIndex = resolveConfigArgIndex(nextArgs);

  if (configIndex === -1) {
    nextArgs.push("--config", JSON.stringify(configOverride));
    return nextArgs;
  }

  const configValue = nextArgs[configIndex + 1];
  let parsedConfig: Record<string, unknown> = {};
  if (typeof configValue === "string" && configValue.trim().length > 0) {
    const rawConfig: unknown = JSON.parse(configValue);
    if (!isRecord(rawConfig)) {
      throw new Error("Expected --config value to be a JSON object.");
    }
    parsedConfig = rawConfig;
  }

  nextArgs[configIndex + 1] = JSON.stringify(mergeConfigObjects(parsedConfig, configOverride));
  return nextArgs;
};

const buildCandidateBundleRoots = (tauriArgs: readonly string[]): string[] => {
  const target = resolveTargetArg(tauriArgs);
  const targetedBundleRoot = target
    ? join(DESKTOP_TAURI_ROOT, "target", target, "release", "bundle")
    : null;
  const hostBundleRoot = join(DESKTOP_TAURI_ROOT, "target", "release", "bundle");

  return targetedBundleRoot ? [targetedBundleRoot, hostBundleRoot] : [hostBundleRoot];
};

const readDesktopBundleMetadata = async (): Promise<{
  productName: string;
  version: string;
  binaryName: string;
}> => {
  const tauriConfigPath = join(DESKTOP_TAURI_ROOT, "tauri.conf.json");
  const tauriConfig = await readJsonObject(tauriConfigPath);
  const cargoToml = await Bun.file(join(DESKTOP_TAURI_ROOT, "Cargo.toml")).text();
  const packageJsonPathValue = tauriConfig.version;
  const versionMatch = cargoToml.match(CARGO_VERSION_PATTERN);
  const configuredVersion =
    typeof packageJsonPathValue === "string" && packageJsonPathValue.endsWith(".json")
      ? (await readJsonObject(join(DESKTOP_TAURI_ROOT, packageJsonPathValue))).version
      : packageJsonPathValue;
  const resolvedVersion =
    typeof configuredVersion === "string" && configuredVersion.trim().length > 0
      ? configuredVersion.trim()
      : versionMatch?.[1] ?? "0.1.0";
  const binaryName = cargoToml.match(CARGO_PACKAGE_NAME_PATTERN)?.[1]?.trim() || "bao-build-buddy-desktop";
  return {
    productName:
      typeof tauriConfig.productName === "string" && tauriConfig.productName.trim().length > 0
        ? tauriConfig.productName.trim()
        : "BaoBuildBuddy",
    version: resolvedVersion,
    binaryName,
  };
};

const didWindowsCrossBuildEmitRecoverableArtifacts = async (
  tauriArgs: readonly string[],
): Promise<boolean> => {
  if (!shouldRecoverWindowsBundleFailure(tauriArgs)) {
    return false;
  }

  const target = resolveTargetArg(tauriArgs);
  if (!target) {
    return false;
  }

  const { binaryName } = await readDesktopBundleMetadata();
  const releaseRoot = join(DESKTOP_TAURI_ROOT, "target", target, "release");
  const binaryPath = join(releaseRoot, `${binaryName}.exe`);
  const nsisScriptPath = join(releaseRoot, "nsis", "x64", "installer.nsi");

  const [binaryExists, nsisScriptExists] = await Promise.all([
    pathExists(binaryPath),
    pathExists(nsisScriptPath),
  ]);

  return binaryExists && nsisScriptExists;
};

const resolveBundleRootWithApp = async (
  bundleRoots: readonly string[],
  productName: string,
): Promise<string | null> =>
  (
    await Promise.all(
      bundleRoots.map(async (bundleRoot) => ({
        bundleRoot,
        exists: await pathExists(join(bundleRoot, "macos", `${productName}.app`)),
      })),
    )
  ).find((bundleRootResult) => bundleRootResult.exists)?.bundleRoot ?? null;

const buildHeadlessMacosDmg = async (
  appBundlePath: string,
  dmgOutputPath: string,
  volumeName: string,
): Promise<boolean> => {
  const scratchRoot = await mkdtemp(join(tmpdir(), "baobuildbuddy-dmg-"));
  const stagingRoot = join(scratchRoot, "payload");
  const stagedAppBundlePath = join(stagingRoot, basename(appBundlePath));
  const hybridImageBasePath = join(scratchRoot, "headless-dmg");
  const hybridImagePath = `${hybridImageBasePath}.dmg`;

  return Promise.resolve()
    .then(async () => {
      await mkdir(dirname(dmgOutputPath), { recursive: true });
      await mkdir(stagingRoot, { recursive: true });
      await cp(appBundlePath, stagedAppBundlePath, {
        force: true,
        recursive: true,
      });

      const hybridExitCode = await runCommandWithTimeout(
        [
          "hdiutil",
          "makehybrid",
          "-default-volume-name",
          volumeName,
          "-hfs",
          "-o",
          hybridImageBasePath,
          stagingRoot,
        ],
        DISK_IMAGE_TIMEOUT_MS,
      );
      if (hybridExitCode !== 0) {
        return false;
      }

      const convertExitCode = await runCommandWithTimeout(
        ["hdiutil", "convert", "-format", "UDZO", "-ov", "-o", dmgOutputPath, hybridImagePath],
        DISK_IMAGE_TIMEOUT_MS,
      );

      return convertExitCode === 0;
    })
    .finally(async () => {
      await rm(scratchRoot, {
        force: true,
        recursive: true,
      });
    });
};

const recoverMacosDmgBuild = async (tauriArgs: readonly string[]): Promise<boolean> => {
  if (process.platform !== "darwin") {
    return false;
  }

  const { productName, version } = await readDesktopBundleMetadata();
  const bundleRoots = buildCandidateBundleRoots(tauriArgs);
  const bundleRoot = await resolveBundleRootWithApp(bundleRoots, productName);
  if (!bundleRoot) {
    return false;
  }

  const appBundlePath = join(bundleRoot, "macos", `${productName}.app`);

  const dmgOutputPath = join(
    bundleRoot,
    "dmg",
    `${productName}_${version}_${resolveMacosArchLabel(tauriArgs)}.dmg`,
  );
  const volumeName = `${productName}_${version}_${resolveMacosArchLabel(tauriArgs)}`;

  await writeOutput(`Building macOS DMG with deterministic headless fallback at ${dmgOutputPath}`);
  await rm(dmgOutputPath, { force: true });
  const fallbackSucceeded = await buildHeadlessMacosDmg(appBundlePath, dmgOutputPath, volumeName);
  if (!fallbackSucceeded) {
    return false;
  }

  const recoveredDmg = Bun.file(dmgOutputPath);
  if (!(await recoveredDmg.exists())) {
    return false;
  }

  await writeOutput(`Headless macOS DMG fallback created ${dmgOutputPath}`);
  return true;
};

const removeTemporaryDiskImagesAtIndex = async (
  imagePaths: readonly string[],
  index: number,
): Promise<void> => {
  const imagePath = imagePaths[index];
  if (!imagePath) {
    return;
  }

  await rm(imagePath, { force: true });
  await writeOutput(`Removed stale desktop disk image ${imagePath}`);
  return removeTemporaryDiskImagesAtIndex(imagePaths, index + 1);
};

const removeBundleDirectoriesAtIndex = async (
  directoryPaths: readonly string[],
  index: number,
): Promise<void> => {
  const directoryPath = directoryPaths[index];
  if (!directoryPath) {
    return;
  }

  await rm(directoryPath, {
    recursive: true,
    force: true,
  });
  await writeOutput(`Removed stale desktop bundle directory ${directoryPath}`);
  return removeBundleDirectoriesAtIndex(directoryPaths, index + 1);
};

const cleanupDesktopBuildArtifacts = async (): Promise<void> => {
  if (process.platform !== "darwin") {
    return;
  }

  const hdiutilInfo = await readCommand(["hdiutil", "info"]);
  const mountedImages = parseMountedDesktopImages(hdiutilInfo);
  await detachMountedImagesAtIndex(mountedImages, 0);

  const bundleDirectories = await collectBundleDirectories();
  await removeBundleDirectoriesAtIndex(bundleDirectories, 0);

  const temporaryDiskImages = await collectTemporaryDiskImages();
  await removeTemporaryDiskImagesAtIndex(temporaryDiskImages, 0);

  if (
    mountedImages.length === 0 &&
    bundleDirectories.length === 0 &&
    temporaryDiskImages.length === 0
  ) {
    await writeOutput("No stale desktop DMG state detected.");
  }
};

const cleanupMacosTransientDiskImages = async (): Promise<void> => {
  if (process.platform !== "darwin") {
    return;
  }

  const hdiutilInfo = await readCommand(["hdiutil", "info"]);
  const mountedImages = parseMountedDesktopImages(hdiutilInfo);
  await detachMountedImagesAtIndex(mountedImages, 0);

  const temporaryDiskImages = await collectTemporaryDiskImages();
  await removeTemporaryDiskImagesAtIndex(temporaryDiskImages, 0);
};

const prepareDesktopRuntime = async (tauriArgs: readonly string[]): Promise<void> => {
  const target = resolveTargetArg(tauriArgs);
  const prepareCommand = [
    process.execPath,
    PREPARE_DESKTOP_RUNTIME_SCRIPT,
    ...(target ? ["--target", target] : []),
  ];
  const exitCode = await runCommand(prepareCommand, REPO_ROOT);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
};

const main = async (): Promise<void> => {
  await cleanupDesktopBuildArtifacts();

  const requestedTauriArgs = process.argv.slice(2);
  await prepareDesktopRuntime(requestedTauriArgs);

  const tauriArgsResult = await captureResult(() =>
    withBeforeBuildDisabled(normalizeMacosBuildArgs(requestedTauriArgs)),
  );
  if (!tauriArgsResult.ok) {
    await writeError(
      toErrorMessage(
        tauriArgsResult.error,
        "Unable to normalize Tauri configuration overrides for desktop build.",
      ),
    );
    process.exit(1);
  }
  const tauriArgs = tauriArgsResult.value;

  const tauriBuildCommand = [process.execPath, "run", "--bun", "tauri", "build", ...tauriArgs];

  if (shouldRecoverWindowsBundleFailure(requestedTauriArgs)) {
    const capturedResult = await captureCommand(tauriBuildCommand, process.cwd());
    const recoveredWindowsBundleFailure =
      capturedResult.exitCode !== 0 &&
      (await didWindowsCrossBuildEmitRecoverableArtifacts(requestedTauriArgs));

    emitCapturedOutput(
      capturedResult.output,
      recoveredWindowsBundleFailure ? RECOVERABLE_WINDOWS_BUNDLE_LINE_PATTERNS : [],
    );

    if (!recoveredWindowsBundleFailure && capturedResult.exitCode !== 0) {
      process.exit(capturedResult.exitCode);
    }

    if (recoveredWindowsBundleFailure) {
      await writeOutput(
        "Recovered Windows cross-build after host-side NSIS failure; continuing with containerized installer generation.",
      );
    }
  } else {
    const exitCode = await runCommand(tauriBuildCommand, process.cwd());
    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  }

  if (shouldBuildHeadlessMacosDmg(requestedTauriArgs)) {
    await cleanupMacosTransientDiskImages();
    const recovered = await recoverMacosDmgBuild(requestedTauriArgs);
    if (!recovered) {
      await writeError("Headless macOS DMG creation failed after successful app build.");
      process.exit(1);
    }
  }
};

await main();
