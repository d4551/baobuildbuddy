import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import {
  DESKTOP_RUNTIME_API_BASE,
  DESKTOP_RUNTIME_BUILD_SERVER_PORT,
  DESKTOP_RUNTIME_CORS_ORIGINS,
  DESKTOP_RUNTIME_HOST,
  DESKTOP_RUNTIME_LINUX_BUN_PATH,
  DESKTOP_RUNTIME_MANIFEST_PATH,
  DESKTOP_RUNTIME_RESOURCE_DIR,
  DESKTOP_RUNTIME_SCRAPER_DIR,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
  DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH,
  DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH,
  DESKTOP_RUNTIME_SERVER_PORT,
  DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT,
  DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH,
  DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_FILENAME,
  DESKTOP_RUNTIME_WS_BASE,
} from "../packages/shared/src/constants/scripts";
import { captureResult, toErrorMessage, withCleanup } from "./utils/async-control";
import { writeError, writeOutput } from "./utils/cli-output";
import {
  collectRuntimeDependencySourceRoots,
  SCRAPER_RUNTIME_STAGE_SOURCE_PATHS,
} from "./utils/desktop-runtime-scraper";

type DesktopRuntimeManifest = {
  serverExecutable: string;
  scriptRunnerExecutable: string;
  scriptRunnerEntrypoint: string | null;
  webviewBootstrapperExecutable: string | null;
  scraperDir: string;
  serverHost: string;
  serverPort: number;
  corsOrigins: string[];
};

const REPO_ROOT = resolve(import.meta.dir, "..");
const CLIENT_ROOT = join(REPO_ROOT, "packages", "client");
const CLIENT_PUBLIC_ROOT = join(CLIENT_ROOT, ".output", "public");
const DESKTOP_TAURI_ROOT = join(REPO_ROOT, "packages", "desktop", "src-tauri");
const RUNTIME_ROOT = join(DESKTOP_TAURI_ROOT, DESKTOP_RUNTIME_RESOURCE_DIR);
const RUNTIME_MANIFEST_PATH = join(DESKTOP_TAURI_ROOT, DESKTOP_RUNTIME_MANIFEST_PATH);
const SCRAPER_ROOT = join(REPO_ROOT, "packages", "scraper");
const SERVER_ENTRYPOINT = join(REPO_ROOT, "packages", "server", "src", "index.ts");
const SERVER_DIST_ENTRYPOINT = join(REPO_ROOT, "packages", "server", "dist", "index.js");
const SCRIPT_RUNNER_ENTRYPOINT = join(REPO_ROOT, "scripts", "desktop-bun-entrypoint-runner.ts");
const BUILD_SERVER_API_BASE = `http://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_BUILD_SERVER_PORT}`;
const BUILD_SERVER_WS_BASE = `ws://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_BUILD_SERVER_PORT}`;
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 250;
const LOG_LINE_LIMIT = 60;
const COMPILE_RETRY_LIMIT = 2;
const BUN_COMPILE_TARGET_REGISTRY_URL = "https://registry.npmjs.org" as const;
const TEXT_FILE_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".svg",
  ".txt",
  ".xml",
]);
const BUN_COMPILE_EXTRACTION_FAILURE_PATTERN =
  /Failed to extract executable for '.+?'\. The download may be incomplete\./u;

let compileTargetScratchRoot: string | null = null;
const prewarmedCompileTargetDirectories = new Map<string, Promise<string>>();

const toExecutablePath = (relativePath: string, tauriTarget: string | null): string =>
  tauriTarget?.includes("windows") ? `${relativePath}.exe` : relativePath;

const isLinuxTarget = (tauriTarget: string | null): boolean =>
  tauriTarget?.includes("linux") ?? process.platform === "linux";

const resolveTauriCacheDir = (): string => {
  const envOverride = process.env.TAURI_CACHE_DIR?.trim();
  if (envOverride) {
    return envOverride;
  }

  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Caches", "tauri");
  }

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA?.trim();
    return join(
      localAppData && localAppData.length > 0 ? localAppData : join(homedir(), "AppData", "Local"),
      "tauri",
    );
  }

  const xdgCacheHome = process.env.XDG_CACHE_HOME?.trim();
  return join(
    xdgCacheHome && xdgCacheHome.length > 0 ? xdgCacheHome : join(homedir(), ".cache"),
    "tauri",
  );
};

const resolveWebviewBootstrapperSourcePath = (): string => {
  const envOverride = process.env.BAO_DESKTOP_WEBVIEW_BOOTSTRAPPER_PATH?.trim();
  if (envOverride) {
    return envOverride;
  }

  return join(resolveTauriCacheDir(), DESKTOP_RUNTIME_WINDOWS_WEBVIEW_BOOTSTRAPPER_FILENAME);
};

const captureStreamLines = async (
  stream: number | ReadableStream<Uint8Array> | undefined,
  target: string[],
): Promise<void> => {
  if (!(stream instanceof ReadableStream)) {
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  const pushLine = (value: string): void => {
    const normalized = value.trim();
    if (normalized.length === 0) {
      return;
    }
    target.push(normalized);
    if (target.length > LOG_LINE_LIMIT) {
      target.shift();
    }
  };

  const readChunk = async (): Promise<void> => {
    const result = await reader.read();
    if (result.done) {
      const trailing = `${pending}${decoder.decode()}`.trim();
      if (trailing.length > 0) {
        pushLine(trailing);
      }
      return;
    }

    const decoded = `${pending}${decoder.decode(result.value, { stream: true })}`;
    const lines = decoded.split(/\r?\n/gu);
    pending = lines.pop() ?? "";
    for (const line of lines) {
      pushLine(line);
    }

    await readChunk();
  };

  await readChunk();
};

const parseTargetArg = (argv: readonly string[]): string | null => {
  const targetIndex = argv.findIndex((argument) => argument === "--target" || argument === "-t");
  if (targetIndex === -1) {
    return null;
  }

  const targetValue = argv[targetIndex + 1];
  return typeof targetValue === "string" && targetValue.trim().length > 0
    ? targetValue.trim()
    : null;
};

const resolveTargetFromEnvironment = (): string | null => {
  const targetTriple = process.env.TAURI_ENV_TARGET_TRIPLE?.trim();
  if (targetTriple && targetTriple.length > 0) {
    return targetTriple;
  }

  const cargoTarget = process.env.CARGO_BUILD_TARGET?.trim();
  return cargoTarget && cargoTarget.length > 0 ? cargoTarget : null;
};

const resolveHostBunCompileTarget = (): string => {
  if (process.platform === "darwin") {
    return process.arch === "arm64" ? "bun-darwin-arm64" : "bun-darwin-x64";
  }
  if (process.platform === "linux") {
    return process.arch === "arm64" ? "bun-linux-arm64" : "bun-linux-x64";
  }
  if (process.platform === "win32") {
    return process.arch === "arm64" ? "bun-windows-arm64" : "bun-windows-x64-baseline";
  }

  throw new Error(
    `Unsupported host platform for Bun compile target: ${process.platform}/${process.arch}`,
  );
};

const resolveBunCompileTarget = (tauriTarget: string | null): string => {
  if (tauriTarget === null) {
    return resolveHostBunCompileTarget();
  }

  switch (tauriTarget) {
    case "aarch64-apple-darwin":
      return "bun-darwin-arm64";
    case "x86_64-apple-darwin":
      return "bun-darwin-x64";
    case "aarch64-unknown-linux-gnu":
      return "bun-linux-arm64";
    case "x86_64-unknown-linux-gnu":
      return "bun-linux-x64";
    case "x86_64-unknown-linux-musl":
      return "bun-linux-x64-musl";
    case "aarch64-unknown-linux-musl":
      return "bun-linux-arm64-musl";
    case "x86_64-pc-windows-msvc":
    case "x86_64-pc-windows-gnu":
      return "bun-windows-x64-baseline";
    case "i686-pc-windows-msvc":
    case "i686-pc-windows-gnu":
      throw new Error(
        "Unsupported desktop target for Bun compile: 32-bit Windows (i686) is not supported because Bun only provides Windows x64 and arm64 standalone runtime targets.",
      );
    case "aarch64-pc-windows-msvc":
      return "bun-windows-arm64";
    default:
      throw new Error(`Unsupported desktop target for Bun compile: ${tauriTarget}`);
  }
};

const resolveCompileTargetScratchRoot = (): string => {
  if (!compileTargetScratchRoot) {
    throw new Error("Compile target scratch root is not initialized.");
  }

  return compileTargetScratchRoot;
};

const shouldPrewarmCompileTarget = (compileTarget: string): boolean =>
  process.platform === "win32" && compileTarget.startsWith("bun-windows-");

const buildCompileTargetExecutableName = (compileTarget: string): string =>
  `${compileTarget}-v${Bun.version}`;

const buildCompileTargetTarballUrl = (compileTarget: string): string => {
  if (!compileTarget.startsWith("bun-")) {
    throw new Error(`Unsupported Bun compile target package name: ${compileTarget}`);
  }

  const packageSuffix = compileTarget.slice("bun-".length);
  return [
    BUN_COMPILE_TARGET_REGISTRY_URL,
    "@oven",
    `bun-${packageSuffix}`,
    "-",
    `bun-${packageSuffix}-${Bun.version}.tgz`,
  ].join("/");
};

type PrewarmedCompileTargetPaths = {
  readonly workingDirectory: string;
  readonly tarballPath: string;
  readonly extractedExecutablePath: string;
  readonly prewarmedExecutablePath: string;
};

const buildPrewarmedCompileTargetPaths = (compileTarget: string): PrewarmedCompileTargetPaths => {
  const scratchRoot = resolveCompileTargetScratchRoot();
  const workingDirectory = join(scratchRoot, "compile-targets", compileTarget);
  const extractedDirectory = join(workingDirectory, "package");

  return {
    workingDirectory,
    tarballPath: join(workingDirectory, "target.tgz"),
    extractedExecutablePath: join(extractedDirectory, "bin", "bun.exe"),
    prewarmedExecutablePath: join(
      workingDirectory,
      buildCompileTargetExecutableName(compileTarget),
    ),
  };
};

const downloadCompileTargetTarball = async (
  compileTarget: string,
  tarballPath: string,
): Promise<void> => {
  const tarballUrl = buildCompileTargetTarballUrl(compileTarget);
  const tarballResponse = await fetch(tarballUrl, {
    signal: AbortSignal.timeout(READY_TIMEOUT_MS),
  });
  if (!tarballResponse.ok) {
    throw new Error(
      `Unable to download ${compileTarget} tarball from ${tarballUrl}: ${tarballResponse.status} ${tarballResponse.statusText}`,
    );
  }

  await writeFile(tarballPath, Buffer.from(await tarballResponse.arrayBuffer()));
};

const extractCompileTargetExecutable = async (
  paths: PrewarmedCompileTargetPaths,
): Promise<void> => {
  await runCommand(["tar", "-xzf", paths.tarballPath, "-C", paths.workingDirectory]);

  if (!(await Bun.file(paths.extractedExecutablePath).exists())) {
    throw new Error(
      `Prewarmed Bun compile target executable is missing after extraction: ${paths.extractedExecutablePath}`,
    );
  }

  await cp(paths.extractedExecutablePath, paths.prewarmedExecutablePath, { force: true });
};

const prepareCompileTargetDirectory = async (compileTarget: string): Promise<string> => {
  const paths = buildPrewarmedCompileTargetPaths(compileTarget);
  if (await Bun.file(paths.prewarmedExecutablePath).exists()) {
    return paths.workingDirectory;
  }

  await mkdir(paths.workingDirectory, { recursive: true });
  await writeOutput(
    `desktop-runtime: prewarming official Bun compile target ${compileTarget} for ${Bun.version}`,
  );
  await downloadCompileTargetTarball(compileTarget, paths.tarballPath);
  await extractCompileTargetExecutable(paths);
  return paths.workingDirectory;
};

const ensurePrewarmedCompileTargetDirectory = async (compileTarget: string): Promise<string> => {
  const existingDirectory = prewarmedCompileTargetDirectories.get(compileTarget);
  if (existingDirectory) {
    return await existingDirectory;
  }

  const preparation = prepareCompileTargetDirectory(compileTarget);

  const trackedPreparation = preparation.then(
    (workingDirectory) => workingDirectory,
    (error: unknown) => {
      prewarmedCompileTargetDirectories.delete(compileTarget);
      return Promise.reject(error instanceof Error ? error : new Error(toErrorMessage(error)));
    },
  );

  prewarmedCompileTargetDirectories.set(compileTarget, trackedPreparation);
  return trackedPreparation;
};

const runCommand = async (
  command: readonly string[],
  options: {
    cwd?: string;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<void> => {
  const proc = Bun.spawn(command, {
    cwd: options.cwd ?? REPO_ROOT,
    env: options.env ?? process.env,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} exited with code ${exitCode}`);
  }
};

const readStreamText = async (
  stream: number | ReadableStream<Uint8Array> | undefined,
): Promise<string> => {
  if (!(stream instanceof ReadableStream)) {
    return "";
  }

  return await new Response(stream).text();
};

const runCommandCaptured = async (
  command: readonly string[],
  options: {
    cwd?: string;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<{
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}> => {
  const proc = Bun.spawn(command, {
    cwd: options.cwd ?? REPO_ROOT,
    env: options.env ?? process.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    readStreamText(proc.stdout),
    readStreamText(proc.stderr),
    proc.exited,
  ]);

  if (stdout.length > 0) {
    process.stdout.write(stdout);
  }
  if (stderr.length > 0) {
    process.stderr.write(stderr);
  }

  return {
    exitCode,
    stdout,
    stderr,
  };
};

const isServiceReady = async (url: string): Promise<boolean> => {
  const fetchResult = await Promise.resolve(
    fetch(url, { signal: AbortSignal.timeout(POLL_INTERVAL_MS) }),
  ).then(
    (response) => response.ok,
    () => false,
  );

  return fetchResult;
};

const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeoutMessage: string,
  deadline: number = Date.now() + READY_TIMEOUT_MS,
): Promise<void> => {
  if (await condition()) {
    return;
  }

  if (Date.now() >= deadline) {
    throw new Error(timeoutMessage);
  }

  await Bun.sleep(POLL_INTERVAL_MS);
  await waitForCondition(condition, timeoutMessage, deadline);
};

const waitForService = async (url: string): Promise<void> => {
  await waitForCondition(() => isServiceReady(url), `Timed out waiting for ${url}`);
};

const ensureBuildServerPortIsFree = async (): Promise<void> => {
  if (await isServiceReady(`${BUILD_SERVER_API_BASE}/api/health`)) {
    throw new Error(
      `Desktop runtime build port ${DESKTOP_RUNTIME_BUILD_SERVER_PORT} is already serving HTTP traffic.`,
    );
  }
};

const startBuildServer = async (
  tempDbPath: string,
): Promise<{
  proc: ReturnType<typeof Bun.spawn>;
}> => {
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  const env = {
    ...process.env,
    BAO_DISABLE_AUTH: "true",
    CLIENT_PORT: `${DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT}`,
    CORS_ORIGINS: DESKTOP_RUNTIME_CORS_ORIGINS.join(","),
    DB_PATH: tempDbPath,
    HOST: DESKTOP_RUNTIME_HOST,
    LOG_LEVEL: "warn",
    PORT: `${DESKTOP_RUNTIME_BUILD_SERVER_PORT}`,
  };

  const proc = Bun.spawn([process.execPath, SERVER_DIST_ENTRYPOINT], {
    cwd: REPO_ROOT,
    env,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });

  captureStreamLines(proc.stdout, stdoutLines).catch(() => undefined);
  captureStreamLines(proc.stderr, stderrLines).catch(() => undefined);

  const waitResult = await captureResult(() =>
    waitForService(`${BUILD_SERVER_API_BASE}/api/health`),
  );
  if (!waitResult.ok) {
    proc.kill();
    await proc.exited.catch(() => undefined);
    const logDump = [...stdoutLines, ...stderrLines].join("\n");
    const message = toErrorMessage(
      waitResult.error,
      `Timed out waiting for ${BUILD_SERVER_API_BASE}/api/health`,
    );
    throw new Error(logDump.length > 0 ? `${message}\n${logDump}` : message, {
      cause: waitResult.error,
    });
  }

  return {
    proc,
  };
};

const stopProcess = async (proc: ReturnType<typeof Bun.spawn>): Promise<void> => {
  proc.kill();
  await proc.exited.catch(() => undefined);
};

const isTextFile = (filePath: string): boolean => {
  const extension = extname(filePath).toLowerCase();
  return extension.length === 0 || TEXT_FILE_EXTENSIONS.has(extension);
};

const visitTextFiles = async (
  path: string,
  visitor: (filePath: string) => Promise<void>,
): Promise<void> => {
  const currentStat = await stat(path);
  if (currentStat.isDirectory()) {
    const entries = await readdir(path, { withFileTypes: true });
    await Promise.all(entries.map((entry) => visitTextFiles(join(path, entry.name), visitor)));
    return;
  }

  if (isTextFile(path)) {
    await visitor(path);
  }
};

const rewriteGeneratedRuntimeBase = async (directoryPath: string): Promise<void> => {
  await visitTextFiles(directoryPath, async (filePath) => {
    const sourceText = await readFile(filePath, "utf8");
    const nextText = sourceText
      .replaceAll(BUILD_SERVER_API_BASE, DESKTOP_RUNTIME_API_BASE)
      .replaceAll(BUILD_SERVER_WS_BASE, DESKTOP_RUNTIME_WS_BASE);

    if (nextText !== sourceText) {
      await writeFile(filePath, nextText, "utf8");
    }
  });
};

const assertNoBuildRuntimeLeak = async (directoryPath: string): Promise<void> => {
  await visitTextFiles(directoryPath, async (filePath) => {
    const fileText = await readFile(filePath, "utf8");
    if (fileText.includes(BUILD_SERVER_API_BASE) || fileText.includes(BUILD_SERVER_WS_BASE)) {
      throw new Error(`Build-only desktop API endpoint leaked into ${filePath}`);
    }
  });
};

const buildDesktopClient = async (tempDbPath: string): Promise<void> => {
  await writeOutput("desktop-runtime: building server bundle for desktop prerender");
  await runCommand([process.execPath, "run", "--filter", "@bao/server", "build"]);

  await ensureBuildServerPortIsFree();
  await writeOutput(
    "desktop-runtime: starting temporary API server for static desktop client generation",
  );
  const { proc } = await startBuildServer(tempDbPath);

  await withCleanup(
    async () => {
      await writeOutput("desktop-runtime: generating static Nuxt desktop frontend");
      await runCommand([process.execPath, "run", "--filter", "@bao/client", "generate"], {
        env: {
          ...process.env,
          BAO_DISABLE_AUTH: "true",
          NUXT_PUBLIC_API_BASE: BUILD_SERVER_API_BASE,
          NUXT_PUBLIC_WS_BASE: BUILD_SERVER_WS_BASE,
        },
      });
    },
    () => stopProcess(proc),
  );

  await rewriteGeneratedRuntimeBase(CLIENT_PUBLIC_ROOT);
  await assertNoBuildRuntimeLeak(CLIENT_PUBLIC_ROOT);
};

type CompileRetryContext = {
  readonly command: readonly string[];
  readonly commandCwd: string;
  readonly compileTarget: string;
  readonly outputPath: string;
  readonly attempt?: number;
};

const runCompileCommandWithRetries = async ({
  command,
  commandCwd,
  compileTarget,
  outputPath,
  attempt = 1,
}: CompileRetryContext): Promise<void> => {
  const result = await runCommandCaptured(command, { cwd: commandCwd });
  if (result.exitCode === 0) {
    return;
  }

  const combinedOutput = `${result.stdout}\n${result.stderr}`;
  const canRetryExtractionFailure =
    process.platform === "win32" &&
    compileTarget.startsWith("bun-windows-") &&
    attempt < COMPILE_RETRY_LIMIT &&
    BUN_COMPILE_EXTRACTION_FAILURE_PATTERN.test(combinedOutput);

  if (!canRetryExtractionFailure) {
    throw new Error(`${command.join(" ")} exited with code ${result.exitCode}`);
  }

  await writeOutput(
    `desktop-runtime: Bun compile target download for ${compileTarget} was incomplete; clearing Bun package cache and retrying`,
  );
  await runCommand([process.execPath, "pm", "cache", "rm"]);
  await rm(outputPath, { force: true });
  await runCompileCommandWithRetries({
    command,
    commandCwd,
    compileTarget,
    outputPath,
    attempt: attempt + 1,
  });
};

const compileRuntimeBinary = async (
  compileTarget: string,
  entrypointPath: string,
  outputPath: string,
): Promise<void> => {
  await mkdir(dirname(outputPath), { recursive: true });
  const commandCwd = shouldPrewarmCompileTarget(compileTarget)
    ? await ensurePrewarmedCompileTargetDirectory(compileTarget)
    : REPO_ROOT;
  const command = [
    process.execPath,
    "build",
    "--compile",
    "--target",
    compileTarget,
    entrypointPath,
    "--outfile",
    outputPath,
  ];
  await runCompileCommandWithRetries({
    command,
    commandCwd,
    compileTarget,
    outputPath,
  });
};

const stageScraperRuntime = async (): Promise<void> => {
  const destinationPath = join(RUNTIME_ROOT, DESKTOP_RUNTIME_SCRAPER_DIR);
  await writeOutput("desktop-runtime: staging scraper runtime resources");
  await mkdir(destinationPath, { recursive: true });

  await Promise.all(
    SCRAPER_RUNTIME_STAGE_SOURCE_PATHS.map((relativePath) =>
      cp(join(SCRAPER_ROOT, relativePath), join(destinationPath, relativePath), {
        recursive: true,
        force: true,
      }),
    ),
  );

  const runtimeDependencyRoots = await collectRuntimeDependencySourceRoots(SCRAPER_ROOT);
  await Promise.all(
    Array.from(runtimeDependencyRoots, async ([packageName, sourceRoot]) => {
      const packageDestinationPath = join(destinationPath, "node_modules", packageName);
      await mkdir(dirname(packageDestinationPath), { recursive: true });
      await cp(sourceRoot, packageDestinationPath, {
        recursive: true,
        force: true,
      });
      await rm(join(packageDestinationPath, "node_modules"), {
        recursive: true,
        force: true,
      });
    }),
  );

  await writeOutput(
    `desktop-runtime: staged scraper runtime package plus ${runtimeDependencyRoots.size} runtime dependencies`,
  );
};

const stageWebviewBootstrapper = async (tauriTarget: string | null): Promise<string | null> => {
  if (!tauriTarget?.includes("windows")) {
    return null;
  }

  const sourcePath = resolveWebviewBootstrapperSourcePath();
  if (!(await Bun.file(sourcePath).exists())) {
    throw new Error(
      `Bundled WebView2 bootstrapper was not found at ${sourcePath}. Set BAO_DESKTOP_WEBVIEW_BOOTSTRAPPER_PATH or TAURI_CACHE_DIR before building the Windows desktop release.`,
    );
  }

  const destinationRelativePath = toExecutablePath(
    DESKTOP_RUNTIME_WEBVIEW_BOOTSTRAPPER_PATH,
    tauriTarget,
  );
  const destinationPath = join(RUNTIME_ROOT, destinationRelativePath);
  await mkdir(dirname(destinationPath), { recursive: true });
  await cp(sourcePath, destinationPath, { force: true });
  await writeOutput(`desktop-runtime: staged bundled WebView2 bootstrapper from ${sourcePath}`);
  return destinationRelativePath;
};

const stageBundledScriptRunnerRuntime = async (tauriTarget: string | null): Promise<void> => {
  const bunBinaryPath = join(
    RUNTIME_ROOT,
    isLinuxTarget(tauriTarget)
      ? DESKTOP_RUNTIME_LINUX_BUN_PATH
      : toExecutablePath(DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH, tauriTarget),
  );
  const entrypointPath = join(RUNTIME_ROOT, DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH);

  await mkdir(dirname(bunBinaryPath), { recursive: true });
  await cp(process.execPath, bunBinaryPath, { force: true });
  await cp(SCRIPT_RUNNER_ENTRYPOINT, entrypointPath, { force: true });
  await chmod(bunBinaryPath, 0o755);
};

const writeRuntimeManifest = async (
  tauriTarget: string | null,
  webviewBootstrapperExecutable: string | null,
): Promise<void> => {
  const isLinuxRuntimeTarget = isLinuxTarget(tauriTarget);
  const manifest: DesktopRuntimeManifest = {
    serverExecutable: toExecutablePath(DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH, tauriTarget),
    scriptRunnerExecutable: isLinuxRuntimeTarget
      ? DESKTOP_RUNTIME_LINUX_BUN_PATH
      : toExecutablePath(DESKTOP_RUNTIME_SCRIPT_RUNNER_PATH, tauriTarget),
    scriptRunnerEntrypoint: DESKTOP_RUNTIME_SCRIPT_RUNNER_ENTRYPOINT_PATH,
    webviewBootstrapperExecutable,
    scraperDir: DESKTOP_RUNTIME_SCRAPER_DIR,
    serverHost: DESKTOP_RUNTIME_HOST,
    serverPort: DESKTOP_RUNTIME_SERVER_PORT,
    corsOrigins: [...DESKTOP_RUNTIME_CORS_ORIGINS],
  };

  await mkdir(resolve(RUNTIME_MANIFEST_PATH, ".."), { recursive: true });
  await writeFile(RUNTIME_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
};

const prepareRuntimeResources = async (tauriTarget: string | null): Promise<void> => {
  const compileTarget = resolveBunCompileTarget(tauriTarget);
  const serverExecutablePath = join(
    RUNTIME_ROOT,
    toExecutablePath(DESKTOP_RUNTIME_SERVER_EXECUTABLE_PATH, tauriTarget),
  );

  await writeOutput(`desktop-runtime: compiling bundled desktop server (${compileTarget})`);
  await compileRuntimeBinary(compileTarget, SERVER_ENTRYPOINT, serverExecutablePath);

  await writeOutput(
    `desktop-runtime: staging bundled Bun runtime and entrypoint helper for script execution (${compileTarget})`,
  );
  await stageBundledScriptRunnerRuntime(tauriTarget);

  await stageScraperRuntime();
  const webviewBootstrapperExecutable = await stageWebviewBootstrapper(tauriTarget);
  await writeRuntimeManifest(tauriTarget, webviewBootstrapperExecutable);
};

const main = async (): Promise<void> => {
  const tauriTarget = parseTargetArg(process.argv.slice(2)) ?? resolveTargetFromEnvironment();
  const tempRoot = await mkdtemp(join(tmpdir(), "bao-desktop-runtime-"));
  const tempDbPath = join(tempRoot, "desktop-build.db");
  compileTargetScratchRoot = tempRoot;
  prewarmedCompileTargetDirectories.clear();

  await withCleanup(
    async () => {
      await writeOutput(
        `desktop-runtime: preparing resources${tauriTarget ? ` for ${tauriTarget}` : ""}`,
      );
      await rm(RUNTIME_ROOT, { recursive: true, force: true });
      await mkdir(RUNTIME_ROOT, { recursive: true });

      await buildDesktopClient(tempDbPath);
      await prepareRuntimeResources(tauriTarget);

      if (!(await Bun.file(join(CLIENT_PUBLIC_ROOT, "index.html")).exists())) {
        throw new Error(
          "Static desktop frontend is missing packages/client/.output/public/index.html",
        );
      }

      await writeOutput("desktop-runtime: preparation complete");
    },
    async () => {
      compileTargetScratchRoot = null;
      prewarmedCompileTargetDirectories.clear();
      await rm(tempRoot, { recursive: true, force: true });
    },
  );
};

await main().catch(async (error: unknown) => {
  const message = toErrorMessage(error);
  await writeError(`desktop-runtime: preparation failed: ${message}`);
  process.exit(1);
});
