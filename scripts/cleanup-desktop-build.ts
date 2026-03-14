import { rm } from "fs/promises";
import { writeError, writeOutput } from "./utils/cli-output";

type MountedDesktopImage = {
  imagePath: string;
  mountPaths: string[];
};

const REPO_ROOT = Bun.resolveSync("..", import.meta.dir);
const DESKTOP_TAURI_ROOT = Bun.resolveSync("packages/desktop/src-tauri", REPO_ROOT);
const DESKTOP_BUNDLE_GLOB = new Bun.Glob("target/**/bundle");
const DESKTOP_TEMP_DMG_GLOB = new Bun.Glob("target/**/bundle/macos/rw.*.BaoBuildBuddy_*.dmg");
const MOUNT_LINE_SPLIT_PATTERN = /\t+/;

const isDesktopMountedImage = (imagePath: string): boolean =>
  imagePath.startsWith(DESKTOP_TAURI_ROOT) && imagePath.includes("/bundle/macos/rw.");

const runCommand = async (command: readonly string[]): Promise<number> => {
  const proc = Bun.spawn(command, {
    cwd: REPO_ROOT,
    stdout: "inherit",
    stderr: "inherit",
  });

  return proc.exited;
};

const readCommand = async (command: readonly string[]): Promise<string> => {
  const proc = Bun.spawn(command, {
    cwd: REPO_ROOT,
    stdout: "pipe",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0 || !(proc.stdout instanceof ReadableStream)) {
    await writeError(`${command.join(" ")} failed with exit code ${exitCode}.`);
    process.exit(exitCode || 1);
  }

  return new Response(proc.stdout).text();
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
    imagePaths.push(Bun.resolveSync(relativePath, DESKTOP_TAURI_ROOT));
  }

  return imagePaths;
};

const collectBundleDirectories = async (): Promise<string[]> => {
  const directoryPaths: string[] = [];
  for await (const relativePath of DESKTOP_BUNDLE_GLOB.scan({
    cwd: DESKTOP_TAURI_ROOT,
  })) {
    directoryPaths.push(Bun.resolveSync(relativePath, DESKTOP_TAURI_ROOT));
  }

  return directoryPaths;
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

const main = async (): Promise<void> => {
  if (process.platform !== "darwin") {
    await writeOutput("Skipping desktop DMG cleanup on non-darwin host.");
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

await main();
