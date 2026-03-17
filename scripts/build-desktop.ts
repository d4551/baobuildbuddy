import { join, resolve } from "node:path";
import { captureResult, toErrorMessage } from "./utils/async-control";
import { writeError, writeOutput } from "./utils/cli-output";

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_PACKAGE_ROOT = join(REPO_ROOT, "packages", "desktop");
const DESKTOP_CLEANUP_SCRIPT_PATH = join(REPO_ROOT, "scripts", "cleanup-desktop-build.ts");

type HostDesktopTarget = {
  readonly name: "linux" | "macos" | "windows";
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

const resolveHostDesktopTarget = (): HostDesktopTarget => {
  if (process.platform === "darwin") {
    return {
      name: "macos",
    };
  }

  if (process.platform === "win32") {
    return {
      name: "windows",
    };
  }

  if (process.platform === "linux") {
    return {
      name: "linux",
    };
  }

  throw new Error(`Unsupported desktop host platform: ${process.platform}`);
};

const isDebugDesktopBuild = (tauriArgs: readonly string[]): boolean =>
  tauriArgs.includes("--debug");

const buildDesktopTarget = async (
  hostTarget: HostDesktopTarget,
  tauriArgs: readonly string[],
): Promise<void> => {
  const sharedCommandPrefix = [process.execPath, "tauri"] as const;
  const commandEnv = {
    ...process.env,
    APPIMAGE_EXTRACT_AND_RUN: process.env.APPIMAGE_EXTRACT_AND_RUN ?? "1",
  };

  if (hostTarget.name === "macos") {
    const buildExitCode = await runCommand(
      [...sharedCommandPrefix, "build", "--no-bundle", ...tauriArgs],
      {
        cwd: DESKTOP_PACKAGE_ROOT,
        env: commandEnv,
      },
    );
    if (buildExitCode !== 0) {
      process.exit(buildExitCode);
    }

    await writeOutput(
      "desktop-build: macOS DMG bundling runs through Tauri's bundle_dmg.sh in noninteractive mode and can stay quiet while hdiutil create/convert completes.",
    );
    const bundleEnv = {
      ...commandEnv,
      CI: "true",
    };
    const bundleExitCode = await runCommand(
      [...sharedCommandPrefix, "bundle", "--bundles", "app,dmg", ...tauriArgs],
      {
        cwd: DESKTOP_PACKAGE_ROOT,
        env: bundleEnv,
      },
    );
    if (bundleExitCode !== 0) {
      process.exit(bundleExitCode);
    }

    return;
  }

  const buildExitCode = await runCommand([...sharedCommandPrefix, "build", ...tauriArgs], {
    cwd: DESKTOP_PACKAGE_ROOT,
    env: commandEnv,
  });
  if (buildExitCode !== 0) {
    process.exit(buildExitCode);
  }
};

const main = async (): Promise<void> => {
  const tauriArgs = process.argv.slice(2);
  const hostTarget = resolveHostDesktopTarget();
  await runMacosPrebuildCleanup();
  await writeOutput(`desktop-build: running standard host-local Tauri flow for ${hostTarget.name}`);
  await buildDesktopTarget(hostTarget, tauriArgs);
  if (!isDebugDesktopBuild(tauriArgs)) {
    await writeOutput(
      `desktop-build: syncing latest ${hostTarget.name} release artifacts into packages/desktop/releases`,
    );
    const syncExitCode = await runCommand(
      [
        process.execPath,
        "run",
        "scripts/build-desktop-release.ts",
        "--target",
        hostTarget.name,
        "--skip-build",
      ],
      {
        cwd: REPO_ROOT,
        env: process.env,
      },
    );
    if (syncExitCode !== 0) {
      process.exit(syncExitCode);
    }
  }
  await writeOutput("desktop-build: completed");
};

const result = await captureResult(main);
if (!result.ok) {
  await writeError(toErrorMessage(result.error, "Unexpected desktop build failure."));
  process.exit(1);
}
