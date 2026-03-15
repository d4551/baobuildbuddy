import { rm } from "fs/promises";
import { join } from "path";
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

const NETWORK_TIMEOUT_MS = 8_000;
const DESKTOP_TAURI_ROOT = join(process.cwd(), "packages", "desktop", "src-tauri");
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
  const proc = Bun.spawn(command, {
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
  const proc = Bun.spawn(command, {
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
    ok: process.platform === "darwin",
    details: process.platform,
  };

  const toolChecks = await Promise.all([
    checkCommand("bun", [process.execPath, "--version"]),
    checkCommand("docker", ["docker", "system", "info", "--format", "{{.ServerVersion}}"]),
    checkCommand("rustc", ["rustc", "--version"]),
    checkCommand("cargo", ["cargo", "--version"]),
    checkCommand("xcode-select", ["xcode-select", "-p"]),
  ]);

  const networkChecks = await Promise.all(
    NETWORK_TARGETS.map((target) => checkNetworkTarget(target)),
  );

  return [platformCheck, ...toolChecks, ...networkChecks];
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

  const refreshExitCode = await runCommand([
    process.execPath,
    "run",
    "release:refresh:all-os:fast",
  ]);
  if (refreshExitCode !== 0) {
    await writeError("bun run release:refresh:all-os:fast failed.");
    process.exit(refreshExitCode);
  }

  await writeOutput("release:verify passed.");
};

await main();
