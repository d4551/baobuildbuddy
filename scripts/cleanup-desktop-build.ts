import { rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { writeError, writeOutput } from "./utils/cli-output";

type MountedDesktopImage = {
  readonly imagePath: string;
  readonly mountPaths: readonly string[];
};

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_TAURI_ROOT = join(REPO_ROOT, "packages", "desktop", "src-tauri");
const DESKTOP_TEMP_DMG_GLOB = new Bun.Glob("target/**/bundle/**/rw.*.dmg");
const DESKTOP_MOUNTED_IMAGE_PATTERN = /\/bundle\/(?:dmg|macos)\/rw\..+\.dmg$/;
const MOUNT_LINE_SPLIT_PATTERN = /\t+/;

const runCommand = async (
  command: readonly string[],
  cwd: string = REPO_ROOT,
  env: Record<string, string | undefined> = process.env,
): Promise<number> => {
  const proc = Bun.spawn(command, {
    cwd,
    env,
    stdout: "inherit",
    stderr: "inherit",
  });

  return proc.exited;
};

const readCommand = async (command: readonly string[]): Promise<string> => {
  const proc = Bun.spawn(command, {
    cwd: REPO_ROOT,
    env: process.env,
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

const pathExists = async (candidatePath: string): Promise<boolean> =>
  stat(candidatePath).then(
    () => true,
    () => false,
  );

const parseMountedDesktopImages = (infoText: string): readonly MountedDesktopImage[] =>
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
    if (
      !(imagePath.startsWith(DESKTOP_TAURI_ROOT) &&
        DESKTOP_MOUNTED_IMAGE_PATTERN.test(imagePath))
    ) {
      return [];
    }

    const mountPaths = lines.flatMap((line) => {
      const parts = line.split(MOUNT_LINE_SPLIT_PATTERN);
      return parts.filter((part) => part.startsWith("/Volumes/"));
    });

    return [{ imagePath, mountPaths }];
  });

const collectTemporaryDiskImages = async (): Promise<readonly string[]> => {
  const imagePaths: string[] = [];
  for await (const relativePath of DESKTOP_TEMP_DMG_GLOB.scan({
    cwd: DESKTOP_TAURI_ROOT,
  })) {
    imagePaths.push(join(DESKTOP_TAURI_ROOT, relativePath));
  }

  return imagePaths;
};

const detachMountPathsSequentially = async (
  mountPaths: readonly string[],
  index: number = 0,
): Promise<void> => {
  const mountPath = mountPaths[index];
  if (!mountPath) {
    return;
  }

  await writeOutput(`Detaching stale desktop image mount ${mountPath}`);
  const exitCode = await runCommand(["hdiutil", "detach", mountPath]);
  if (exitCode !== 0) {
    await writeError(`Failed to detach stale desktop image mount ${mountPath}.`);
    process.exit(exitCode);
  }

  await detachMountPathsSequentially(mountPaths, index + 1);
};

const detachMountedImages = async (mountedImages: readonly MountedDesktopImage[]): Promise<void> => {
  const mountPaths = mountedImages.flatMap((mountedImage) => mountedImage.mountPaths);
  await detachMountPathsSequentially(mountPaths);
};

const removeTemporaryDiskImages = async (
  imagePaths: readonly string[],
): Promise<void> => {
  await Promise.all(
    imagePaths.map(async (imagePath) => {
      if (!(await pathExists(imagePath))) {
        return;
      }

      await rm(imagePath, { force: true });
      await writeOutput(`Removed stale desktop disk image ${imagePath}`);
    }),
  );
};

const runPrebuildCleanup = async (): Promise<void> => {
  if (process.platform !== "darwin") {
    await writeOutput("Skipping desktop disk image cleanup outside macOS.");
    return;
  }

  const mountedImages = parseMountedDesktopImages(await readCommand(["hdiutil", "info"]));
  await detachMountedImages(mountedImages);
  await removeTemporaryDiskImages(await collectTemporaryDiskImages());
};

const command = process.argv[2];
if (command !== "prebuild") {
  await writeError("Usage: bun scripts/cleanup-desktop-build.ts prebuild");
  process.exit(1);
}

await runPrebuildCleanup();
