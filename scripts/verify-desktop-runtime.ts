import {
  DESKTOP_RUNTIME_API_BASE,
  DESKTOP_RUNTIME_BUILD_SERVER_PORT,
  DESKTOP_RUNTIME_CORS_ORIGINS,
  DESKTOP_RUNTIME_HOST,
  DESKTOP_RUNTIME_MANIFEST_PATH,
  DESKTOP_RUNTIME_RESOURCE_DIR,
  DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT,
  DESKTOP_RUNTIME_WS_BASE,
} from "../packages/shared/src/constants/scripts";
import { writeError, writeOutput } from "./utils/cli-output";
import { toErrorMessage, withCleanup } from "./utils/async-control";
import { cp, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

type DesktopRuntimeManifest = {
  serverExecutable: string;
  scriptRunnerExecutable: string;
  scraperDir: string;
  serverHost: string;
  serverPort: number;
  corsOrigins: string[];
};

type BrowserCheckResult = {
  pageTitle: string;
  healthStatus: string;
  websocketOpened: boolean;
};

type StaticServerHandle = {
  stop(closeActiveConnections?: boolean): Promise<void>;
};

const REPO_ROOT = resolve(import.meta.dir, "..");
const DESKTOP_TAURI_ROOT = join(REPO_ROOT, "packages", "desktop", "src-tauri");
const RUNTIME_ROOT = join(DESKTOP_TAURI_ROOT, DESKTOP_RUNTIME_RESOURCE_DIR);
const MANIFEST_PATH = join(DESKTOP_TAURI_ROOT, DESKTOP_RUNTIME_MANIFEST_PATH);
const CLIENT_PUBLIC_ROOT = join(REPO_ROOT, "packages", "client", ".output", "public");
const PLAYWRIGHT_ENTRYPOINT = join(
  REPO_ROOT,
  "packages",
  "scraper",
  "node_modules",
  "playwright",
  "index.mjs",
);
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
const VERIFY_FRONTEND_ORIGIN = `http://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT}`;
const VERIFY_FRONTEND_URL = `${VERIFY_FRONTEND_ORIGIN}/`;
const DESKTOP_RUNTIME_VERIFY_SERVER_PORT = DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT + 1;
const VERIFY_API_BASE = `http://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_VERIFY_SERVER_PORT}`;
const VERIFY_WS_BASE = `ws://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_VERIFY_SERVER_PORT}`;
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 250;
const BUILD_API_LEAK_MARKERS = [
  `http://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_BUILD_SERVER_PORT}`,
  `http:\\/\\/${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_BUILD_SERVER_PORT}`,
];
const BUILD_WS_LEAK_MARKERS = [
  `ws://${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_BUILD_SERVER_PORT}`,
  `ws:\\/\\/${DESKTOP_RUNTIME_HOST}:${DESKTOP_RUNTIME_BUILD_SERVER_PORT}`,
];
const LEADING_PATHNAME_SLASH_PATTERN = /^\/+/u;
const TRAILING_PATHNAME_SLASH_PATTERN = /\/+$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

const runCommand = async (
  command: readonly string[],
  cwd: string = REPO_ROOT,
  env: Record<string, string | undefined> = process.env,
): Promise<void> => {
  const proc = Bun.spawn(command, {
    cwd,
    env,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} exited with code ${exitCode}`);
  }
};

const readManifest = async (): Promise<DesktopRuntimeManifest> => {
  const rawManifest: unknown = JSON.parse(await Bun.file(MANIFEST_PATH).text());
  if (!isRecord(rawManifest)) {
    throw new Error(`Expected desktop runtime manifest object at ${MANIFEST_PATH}`);
  }

  const {
    serverExecutable,
    scriptRunnerExecutable,
    scraperDir,
    serverHost,
    serverPort,
    corsOrigins,
  } = rawManifest;

  if (
    typeof serverExecutable !== "string" ||
    typeof scriptRunnerExecutable !== "string" ||
    typeof scraperDir !== "string" ||
    typeof serverHost !== "string" ||
    typeof serverPort !== "number" ||
    !Array.isArray(corsOrigins) ||
    corsOrigins.some((origin) => typeof origin !== "string")
  ) {
    throw new Error(`Desktop runtime manifest is missing required fields at ${MANIFEST_PATH}`);
  }

  const normalizedCorsOrigins: string[] = [];
  for (const origin of corsOrigins) {
    if (typeof origin !== "string") {
      throw new Error(`Desktop runtime manifest contains a non-string CORS origin at ${MANIFEST_PATH}`);
    }
    normalizedCorsOrigins.push(origin);
  }

  return {
    serverExecutable,
    scriptRunnerExecutable,
    scraperDir,
    serverHost,
    serverPort,
    corsOrigins: normalizedCorsOrigins,
  };
};

const isServiceReady = async (url: string): Promise<boolean> =>
  Promise.resolve(fetch(url, { signal: AbortSignal.timeout(POLL_INTERVAL_MS) })).then(
    (response) => response.ok,
    () => false,
  );

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

const normalizePathname = (pathname: string): string =>
  pathname
    .replace(LEADING_PATHNAME_SLASH_PATTERN, "")
    .replace(TRAILING_PATHNAME_SLASH_PATTERN, "");

const fileExists = async (filePath: string): Promise<boolean> =>
  stat(filePath).then(
    () => true,
    () => false,
  );

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

const findFirstMarkerMatch = async (
  path: string,
  markers: readonly string[],
): Promise<string | null> => {
  const currentStat = await stat(path);
  if (currentStat.isDirectory()) {
    const entries = await readdir(path, { withFileTypes: true });
    const matches = await Promise.all(
      entries.map((entry) => findFirstMarkerMatch(join(path, entry.name), markers)),
    );
    return matches.find((match): match is string => typeof match === "string") ?? null;
  }

  if (!isTextFile(path)) {
    return null;
  }

  const fileText = await readFile(path, "utf8");
  return markers.some((marker) => fileText.includes(marker)) ? path : null;
};

const findLeakedBuildEndpoint = (directoryPath: string): Promise<string | null> =>
  findFirstMarkerMatch(directoryPath, [...BUILD_API_LEAK_MARKERS, ...BUILD_WS_LEAK_MARKERS]);

const rewriteTextTree = async (
  directoryPath: string,
  replacements: readonly [string, string][],
): Promise<void> => {
  await visitTextFiles(directoryPath, async (filePath) => {
    const sourceText = await readFile(filePath, "utf8");
    let nextText = sourceText;
    for (const [fromValue, toValue] of replacements) {
      nextText = nextText.replaceAll(fromValue, toValue);
    }

    if (nextText !== sourceText) {
      await writeFile(filePath, nextText, "utf8");
    }
  });
};

const createVerificationFrontendRoot = async (): Promise<string> => {
  const verificationRoot = await mkdtemp(join(tmpdir(), "bao-desktop-verify-frontend-"));
  await cp(CLIENT_PUBLIC_ROOT, verificationRoot, { recursive: true, force: true });
  await rewriteTextTree(verificationRoot, [
    [DESKTOP_RUNTIME_API_BASE, VERIFY_API_BASE],
    [DESKTOP_RUNTIME_WS_BASE, VERIFY_WS_BASE],
    [DESKTOP_RUNTIME_API_BASE.replaceAll("/", "\\/"), VERIFY_API_BASE.replaceAll("/", "\\/")],
    [DESKTOP_RUNTIME_WS_BASE.replaceAll("/", "\\/"), VERIFY_WS_BASE.replaceAll("/", "\\/")],
  ]);
  return verificationRoot;
};

const resolveStaticAssetPath = async (frontendRoot: string, pathname: string): Promise<string> => {
  const normalizedPath = normalizePathname(decodeURIComponent(pathname));
  const candidateRelativePaths =
    normalizedPath.length === 0
      ? ["index.html"]
      : [normalizedPath, join(normalizedPath, "index.html")];

  const candidateMatches = await Promise.all(
    candidateRelativePaths.map(async (relativePath) => {
      const absolutePath = resolve(frontendRoot, relativePath);
      if (!absolutePath.startsWith(frontendRoot)) {
        return null;
      }

      return (await fileExists(absolutePath)) ? absolutePath : null;
    }),
  );
  const existingCandidate = candidateMatches.find(
    (match): match is string => typeof match === "string",
  );
  if (existingCandidate) {
    return existingCandidate;
  }

  const notFoundPath = join(frontendRoot, "404.html");
  if (await fileExists(notFoundPath)) {
    return notFoundPath;
  }

  return join(frontendRoot, "index.html");
};

const startStaticFrontendServer = (frontendRoot: string): StaticServerHandle => {
  const server = Bun.serve({
    hostname: DESKTOP_RUNTIME_HOST,
    port: DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT,
    fetch: async (request) => {
      const requestUrl = new URL(request.url);
      const filePath = await resolveStaticAssetPath(frontendRoot, requestUrl.pathname);
      return new Response(Bun.file(filePath));
    },
  });

  return {
    async stop(closeActiveConnections = false): Promise<void> {
      await server.stop(closeActiveConnections);
    },
  };
};

const verifyCorsContract = async (
  apiBase: string,
  manifest: DesktopRuntimeManifest,
  origin: string,
): Promise<void> => {
  const response = await fetch(`${apiBase}/api/health`, {
    headers: {
      origin,
    },
    signal: AbortSignal.timeout(POLL_INTERVAL_MS * 4),
  });

  const allowedOrigin = response.headers.get("access-control-allow-origin");
  if (allowedOrigin !== origin) {
    throw new Error(
      `Expected desktop server CORS origin ${origin}, received ${allowedOrigin ?? "<missing>"}`,
    );
  }

  if (origin !== VERIFY_FRONTEND_ORIGIN && !manifest.corsOrigins.includes(origin)) {
    throw new Error(`Desktop runtime manifest is missing expected origin ${origin}.`);
  }
};

const runBrowserChecks = async (
  apiBase: string,
  wsBase: string,
): Promise<BrowserCheckResult> => {
  const playwrightModule = (await import(pathToFileURL(PLAYWRIGHT_ENTRYPOINT).href)) as {
    chromium: {
      launch(options: { headless: boolean }): Promise<{
        newPage(): Promise<{
          goto(url: string, options?: { waitUntil?: string }): Promise<void>;
          title(): Promise<string>;
          waitForLoadState(state: "domcontentloaded" | "load" | "networkidle"): Promise<void>;
          waitForTimeout(timeoutMs: number): Promise<void>;
          evaluate<T, TArg>(pageFunction: (arg: TArg) => Promise<T> | T, arg: TArg): Promise<T>;
          close(): Promise<void>;
        }>;
        close(): Promise<void>;
      }>;
    };
  };

  const browser = await playwrightModule.chromium.launch({ headless: true });
  return withCleanup(
    async () => {
      const page = await browser.newPage();
      return withCleanup(
        async () => {
          await page.goto(VERIFY_FRONTEND_URL, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(1_000);

          const pageTitle = await page.title();
          const healthStatus = await page.evaluate(async (runtimeApiBase) => {
            const response = await fetch(`${runtimeApiBase}/api/health`);
            const payload = (await response.json()) as { status?: string };
            return typeof payload.status === "string" ? payload.status : "unknown";
          }, apiBase);

          const websocketOpened = await page.evaluate(async (runtimeWsBase) => {
            const targetUrl = `${runtimeWsBase}/api/ws/automation`;
            return new Promise<boolean>((resolve) => {
              const timeout = window.setTimeout(() => resolve(false), 5_000);
              const socket = new WebSocket(targetUrl);

              socket.onopen = () => {
                clearTimeout(timeout);
                socket.close();
                resolve(true);
              };
              socket.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
              };
            });
          }, wsBase);

          return {
            pageTitle,
            healthStatus,
            websocketOpened,
          };
        },
        () => page.close(),
      );
    },
    () => browser.close(),
  );
};

const startPackagedServer = async (
  manifest: DesktopRuntimeManifest,
): Promise<ReturnType<typeof Bun.spawn>> => {
  const serverExecutablePath = join(RUNTIME_ROOT, manifest.serverExecutable);
  const scriptRunnerPath = join(RUNTIME_ROOT, manifest.scriptRunnerExecutable);
  const scraperDirPath = join(RUNTIME_ROOT, manifest.scraperDir);

  const overrideCorsOrigins = Array.from(
    new Set([...manifest.corsOrigins, VERIFY_FRONTEND_ORIGIN]),
  ).join(",");

  const proc = Bun.spawn([serverExecutablePath], {
    cwd: RUNTIME_ROOT,
    env: {
      ...process.env,
      BAO_DISABLE_AUTH: "true",
      BAO_SCRAPER_DIR: scraperDirPath,
      BAO_SCRIPT_RUNNER_PATH: scriptRunnerPath,
      CORS_ORIGINS: overrideCorsOrigins,
      HOST: manifest.serverHost,
      NODE_ENV: "production",
      PORT: `${DESKTOP_RUNTIME_VERIFY_SERVER_PORT}`,
    },
    stdin: "ignore",
    stdout: "inherit",
    stderr: "inherit",
  });

  await waitForService(`${VERIFY_API_BASE}/api/health`);
  return proc;
};

const stopProcess = async (proc: ReturnType<typeof Bun.spawn>): Promise<void> => {
  proc.kill();
  await proc.exited.catch(() => undefined);
};

const assertGeneratedFrontendIsReady = async (): Promise<void> => {
  const manifest = await readManifest();
  const indexFile = Bun.file(join(CLIENT_PUBLIC_ROOT, "index.html"));
  if (!(await indexFile.exists())) {
    throw new Error("Generated desktop frontend is missing packages/client/.output/public/index.html");
  }

  const leakedBuildFile = await findLeakedBuildEndpoint(CLIENT_PUBLIC_ROOT);
  if (leakedBuildFile) {
    throw new Error(`Temporary build endpoint leaked into generated frontend: ${leakedBuildFile}`);
  }

  if (!manifest.corsOrigins.includes(DESKTOP_RUNTIME_CORS_ORIGINS[0])) {
    throw new Error("Desktop runtime manifest is missing the primary packaged CORS origin.");
  }
};

const prepareVerificationFrontendRoot = async (): Promise<string> => {
  await assertGeneratedFrontendIsReady();
  const verificationFrontendRoot = await createVerificationFrontendRoot();
  const leakedProductionRuntimeFile = await findFirstMarkerMatch(verificationFrontendRoot, [
    DESKTOP_RUNTIME_API_BASE,
    DESKTOP_RUNTIME_WS_BASE,
    DESKTOP_RUNTIME_API_BASE.replaceAll("/", "\\/"),
    DESKTOP_RUNTIME_WS_BASE.replaceAll("/", "\\/"),
  ]);
  if (leakedProductionRuntimeFile) {
    throw new Error(
      `Verification frontend still references the packaged runtime default endpoints: ${leakedProductionRuntimeFile}`,
    );
  }

  return verificationFrontendRoot;
};

const assertBrowserChecksPassed = (browserResult: BrowserCheckResult): void => {
  if (browserResult.pageTitle.trim().length === 0) {
    throw new Error("Generated desktop frontend did not expose a document title.");
  }
  if (browserResult.healthStatus !== "healthy" && browserResult.healthStatus !== "degraded") {
    throw new Error(`Unexpected desktop API health status from browser: ${browserResult.healthStatus}`);
  }
  if (!browserResult.websocketOpened) {
    throw new Error("Desktop automation WebSocket did not open from the generated frontend.");
  }
};

const verifyPackagedRuntime = async (
  manifest: DesktopRuntimeManifest,
  verificationFrontendRoot: string,
): Promise<void> => {
  let serverProcess: ReturnType<typeof Bun.spawn> | null = null;
  let staticServer: StaticServerHandle | null = null;

  await withCleanup(
    async () => {
      await writeOutput("desktop-runtime: launching packaged server executable");
      serverProcess = await startPackagedServer(manifest);
      staticServer = startStaticFrontendServer(verificationFrontendRoot);

      await verifyCorsContract(VERIFY_API_BASE, manifest, DESKTOP_RUNTIME_CORS_ORIGINS[0]);
      await verifyCorsContract(VERIFY_API_BASE, manifest, VERIFY_FRONTEND_ORIGIN);
      const browserResult = await runBrowserChecks(VERIFY_API_BASE, VERIFY_WS_BASE);
      assertBrowserChecksPassed(browserResult);

      await writeOutput(
        `desktop-runtime: verified frontend "${browserResult.pageTitle}" against ${VERIFY_API_BASE}`,
      );
      await writeOutput("desktop-runtime: verification passed");
    },
    async () => {
      await staticServer?.stop(true);
      if (serverProcess) {
        await stopProcess(serverProcess);
      }
      await rm(verificationFrontendRoot, { recursive: true, force: true });
    },
  );
};

const main = async (): Promise<void> => {
  const tauriTarget = parseTargetArg(process.argv.slice(2));
  await writeOutput("desktop-runtime: preparing runtime before verification");
  await runCommand(
    [
      process.execPath,
      "scripts/prepare-desktop-runtime.ts",
      ...(tauriTarget ? ["--target", tauriTarget] : []),
    ],
    REPO_ROOT,
  );

  const manifest = await readManifest();
  const verificationFrontendRoot = await prepareVerificationFrontendRoot();
  await verifyPackagedRuntime(manifest, verificationFrontendRoot);
};

await main().catch(async (error: unknown) => {
  const message = toErrorMessage(error);
  await writeError(`desktop-runtime: verification failed: ${message}`);
  process.exit(1);
});
