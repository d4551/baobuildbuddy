import { cp, mkdir, mkdtemp, rm, stat } from "fs/promises";
import { basename, dirname, join, resolve } from "path";
import { tmpdir } from "os";
import { writeError, writeOutput } from "./utils/cli-output";

type MountedDesktopImage = {
  imagePath: string;
  mountPaths: string[];
};

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_TAURI_ROOT = join(REPO_ROOT, "packages", "desktop", "src-tauri");
const DESKTOP_BUNDLE_GLOB = new Bun.Glob("target/**/bundle");
const DESKTOP_TEMP_DMG_GLOB = new Bun.Glob("target/**/bundle/**/rw.*.dmg");
const DISK_IMAGE_TIMEOUT_MS = 60_000;
const MOUNT_LINE_SPLIT_PATTERN = /\t+/;
const DESKTOP_MOUNTED_IMAGE_PATTERN = /\/bundle\/(?:dmg|macos)\/rw\..+\.dmg$/;
const CARGO_VERSION_PATTERN = /^version = "([^"]+)"/m;
const TAURI_PRODUCT_NAME_PATTERN = /"productName"\s*:\s*"([^"]+)"/;

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
}> => {
  const tauriConfigText = await Bun.file(join(DESKTOP_TAURI_ROOT, "tauri.conf.json")).text();
  const productName =
    tauriConfigText.match(TAURI_PRODUCT_NAME_PATTERN)?.[1]?.trim() || "BaoBuildBuddy";
  const cargoToml = await Bun.file(join(DESKTOP_TAURI_ROOT, "Cargo.toml")).text();
  const versionMatch = cargoToml.match(CARGO_VERSION_PATTERN);
  return {
    productName,
    version: versionMatch?.[1] ?? "0.1.0",
  };
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

const main = async (): Promise<void> => {
  await cleanupDesktopBuildArtifacts();

  const requestedTauriArgs = process.argv.slice(2);
  const tauriArgs = normalizeMacosBuildArgs(requestedTauriArgs);
  const exitCode = await runCommand(
    [process.execPath, "run", "--bun", "tauri", "build", ...tauriArgs],
    process.cwd(),
  );

  if (exitCode !== 0) {
    process.exit(exitCode);
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
