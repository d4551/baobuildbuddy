import { rm } from "node:fs/promises";
import { join } from "node:path";
import {
  DESKTOP_RELEASE_LINUX_ARM64_TARGET,
  DESKTOP_RELEASE_LINUX_X64_TARGET,
  DESKTOP_RELEASE_MACOS_AARCH64_TARGET,
  DESKTOP_RELEASE_METADATA_DIR,
  DESKTOP_RELEASE_PROVENANCE_FILENAME,
  type DESKTOP_RELEASE_TARGETS,
  DESKTOP_RELEASE_WINDOWS_TARGET,
} from "../packages/shared/src/constants/scripts";
import { writeError, writeOutput } from "./utils/cli-output";

type PreflightCheck = {
  label: string;
  ok: boolean;
  details: string;
};

type NetworkTarget = {
  label: string;
  url: string;
};

type DesktopReleaseBucket = (typeof DESKTOP_RELEASE_TARGETS)[number];

const NETWORK_TIMEOUT_MS = 8_000;
const DESKTOP_TAURI_ROOT = join(process.cwd(), "packages", "desktop", "src-tauri");
const DESKTOP_RELEASE_ROOT = join(process.cwd(), "packages", "desktop", "releases");
const DESKTOP_TAURI_TARGET_DIRS = [
  join(DESKTOP_TAURI_ROOT, "target"),
  join(DESKTOP_TAURI_ROOT, "target-linux"),
] as const;
const NETWORK_TARGETS: readonly NetworkTarget[] = [
  { label: "bun.sh", url: "https://bun.sh" },
  { label: "crates-index", url: "https://index.crates.io/config.json" },
  { label: "deb.debian.org", url: "https://deb.debian.org" },
];

const runCommand = async (
  command: readonly string[],
  env: Record<string, string | undefined> = process.env,
): Promise<number> => {
  const proc = Bun.spawn(command as string[], {
    cwd: process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
    env,
  });

  return proc.exited;
};

const readStreamText = async (
  stream: number | ReadableStream<Uint8Array> | undefined,
): Promise<string> => {
  if (!(stream instanceof ReadableStream)) {
    return "";
  }

  return new Response(stream).text();
};

const readCommand = async (
  command: readonly string[],
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
}> => {
  const proc = Bun.spawn(command as string[], {
    cwd: process.cwd(),
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    readStreamText(proc.stdout),
    readStreamText(proc.stderr),
  ]);

  return {
    exitCode,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
};

const checkCommand = async (label: string, command: readonly string[]): Promise<PreflightCheck> => {
  const result = await readCommand(command);
  const details =
    result.stdout.length > 0
      ? result.stdout
      : result.stderr.length > 0
        ? result.stderr
        : `${command[0]} exited with code ${result.exitCode}`;

  return {
    label,
    ok: result.exitCode === 0,
    details,
  };
};

const checkNetworkTarget = async (target: NetworkTarget): Promise<PreflightCheck> => {
  const responseResult = await Promise.allSettled([
    fetch(target.url, {
      method: "HEAD",
      signal: AbortSignal.timeout(NETWORK_TIMEOUT_MS),
    }),
  ]);
  const response = responseResult[0];

  if (response.status === "fulfilled") {
    return {
      label: `network:${target.label}`,
      ok: response.value.ok,
      details: `status=${response.value.status}`,
    };
  }

  return {
    label: `network:${target.label}`,
    ok: false,
    details: String(response.reason),
  };
};

const collectPreflightChecks = async (): Promise<PreflightCheck[]> => {
  const platformCheck: PreflightCheck = {
    label: "platform",
    ok: ["darwin", "linux", "win32"].includes(process.platform),
    details: process.platform,
  };

  const toolChecks = await Promise.all([
    checkCommand("bun", [process.execPath, "--version"]),
    checkCommand("rustc", ["rustc", "--version"]),
    checkCommand("cargo", ["cargo", "--version"]),
    ...(process.platform === "darwin"
      ? [checkCommand("xcode-select", ["xcode-select", "-p"])]
      : []),
  ]);

  const networkChecks = await Promise.all(
    NETWORK_TARGETS.map((target) => checkNetworkTarget(target)),
  );

  return [platformCheck, ...toolChecks, ...networkChecks];
};

const resolveHostDesktopTarget = (): string | null => {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return DESKTOP_RELEASE_MACOS_AARCH64_TARGET;
  }

  if (process.platform === "win32" && process.arch === "x64") {
    return DESKTOP_RELEASE_WINDOWS_TARGET;
  }

  if (process.platform === "linux") {
    return process.arch === "arm64"
      ? DESKTOP_RELEASE_LINUX_ARM64_TARGET
      : DESKTOP_RELEASE_LINUX_X64_TARGET;
  }

  return null;
};

const resolveHostReleaseBucket = (): DesktopReleaseBucket | null => {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return "macos";
  }

  if (process.platform === "win32" && process.arch === "x64") {
    return "windows";
  }

  if (process.platform === "linux") {
    return process.arch === "arm64" ? "linux-arm64" : "linux-x64";
  }

  return null;
};

const assembledDesktopReleasesExist = async (): Promise<boolean> => {
  const [provenanceExists, metadataExists] = await Promise.all([
    Bun.file(join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_PROVENANCE_FILENAME)).exists(),
    Bun.file(join(DESKTOP_RELEASE_ROOT, DESKTOP_RELEASE_METADATA_DIR)).exists(),
  ]);

  return provenanceExists && metadataExists;
};

const cleanDesktopBuildArtifacts = async (): Promise<void> => {
  await writeOutput("Cleaning desktop target artifacts for deterministic release verification.");
  await Promise.all(
    DESKTOP_TAURI_TARGET_DIRS.map((targetDirectory) =>
      rm(targetDirectory, {
        recursive: true,
        force: true,
      }),
    ),
  );
};

const writePreflightSummary = async (checks: PreflightCheck[]): Promise<void> => {
  await writeOutput("release:verify preflight");
  const writeCheckAtIndex = async (index: number): Promise<void> => {
    const check = checks[index];
    if (!check) {
      return;
    }

    const status = check.ok ? "ok" : "fail";
    await writeOutput(`[${status}] ${check.label} ${check.details}`);
    return writeCheckAtIndex(index + 1);
  };

  await writeCheckAtIndex(0);
};

const main = async (): Promise<void> => {
  const checks = await collectPreflightChecks();
  await writePreflightSummary(checks);

  const failedChecks = checks.filter((check) => !check.ok);
  if (failedChecks.length > 0) {
    await writeError("release:verify failed preflight checks.");
    process.exit(1);
  }

  await cleanDesktopBuildArtifacts();

  const buildExitCode = await runCommand([process.execPath, "run", "build:desktop"], {
    ...process.env,
    CI: "true",
  });
  if (buildExitCode !== 0) {
    await writeError("CI=true bun run build:desktop failed.");
    process.exit(buildExitCode);
  }

  const hostDesktopTarget = resolveHostDesktopTarget();
  const runtimeVerifyExitCode = await runCommand([
    process.execPath,
    "run",
    "verify:desktop-runtime",
    ...(hostDesktopTarget ? ["--target", hostDesktopTarget] : []),
  ]);
  if (runtimeVerifyExitCode !== 0) {
    await writeError("bun run verify:desktop-runtime failed.");
    process.exit(runtimeVerifyExitCode);
  }

  if (await assembledDesktopReleasesExist()) {
    const hostReleaseBucket = resolveHostReleaseBucket();
    const releaseVerificationTargets = hostReleaseBucket ? ["--targets", hostReleaseBucket] : [];
    const releasesVerifyExitCode = await runCommand([
      process.execPath,
      "run",
      "verify:desktop-releases",
      ...releaseVerificationTargets,
    ]);
    if (releasesVerifyExitCode !== 0) {
      await writeError("bun run verify:desktop-releases failed.");
      process.exit(releasesVerifyExitCode);
    }
  }

  await writeOutput("release:verify passed.");
};

await main();
