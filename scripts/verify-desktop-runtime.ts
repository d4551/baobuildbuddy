import { cp, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { startJobApplyFixtureServer } from "../packages/server/src/test-support/automation/job-apply-fixture";
import {
  API_ENDPOINTS,
  buildAutomationRunEndpoint,
  WS_ENDPOINTS,
} from "../packages/shared/src/constants/endpoints";
import {
  DESKTOP_RUNTIME_API_BASE,
  DESKTOP_RUNTIME_BUILD_SERVER_PORT,
  DESKTOP_RUNTIME_CORS_ORIGINS,
  DESKTOP_RUNTIME_HOST,
  DESKTOP_RUNTIME_MANIFEST_PATH,
  DESKTOP_RUNTIME_RESOURCE_DIR,
  DESKTOP_RUNTIME_SCRAPER_DIR,
  DESKTOP_RUNTIME_VERIFY_FRONTEND_PORT,
  DESKTOP_RUNTIME_WS_BASE,
} from "../packages/shared/src/constants/scripts";
import {
  type RpaRunEvent,
  type RpaRunExecutionEnvelope,
  rpaRunEventSchema,
} from "../packages/shared/src/schemas/rpa-events.schema";
import { toErrorMessage, withCleanup } from "./utils/async-control";
import { writeError, writeOutput } from "./utils/cli-output";
import {
  collectRuntimeDependencySourceRoots,
  SCRAPER_RUNTIME_STAGE_SOURCE_PATHS,
} from "./utils/desktop-runtime-scraper";

type DesktopRuntimeManifest = {
  serverExecutable: string;
  scriptRunnerExecutable: string;
  scriptRunnerEntrypoint: string | null;
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

type VerificationRuntimePaths = {
  root: string;
  dbPath: string;
};

type AutomationVerifyContext = {
  resumeId: string;
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
const VERIFY_API_ROUTE_BASE = `${VERIFY_API_BASE}/api`;
const READY_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 250;
const RUN_COMPLETION_TIMEOUT_MS = 45_000;
const WEBSOCKET_OPEN_TIMEOUT_MS = 5_000;
const SCHEDULE_RUN_LEAD_TIME_MS = 1_500;
const SCHEDULE_RECOVERY_LEAD_TIME_MS = 2_500;
const AUTOMATION_RESTART_SETTLE_MS = 500;
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
    scriptRunnerEntrypoint,
    scraperDir,
    serverHost,
    serverPort,
    corsOrigins,
  } = rawManifest;

  if (
    typeof serverExecutable !== "string" ||
    typeof scriptRunnerExecutable !== "string" ||
    !(
      scriptRunnerEntrypoint === null ||
      typeof scriptRunnerEntrypoint === "string" ||
      typeof scriptRunnerEntrypoint === "undefined"
    ) ||
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
      throw new Error(
        `Desktop runtime manifest contains a non-string CORS origin at ${MANIFEST_PATH}`,
      );
    }
    normalizedCorsOrigins.push(origin);
  }

  return {
    serverExecutable,
    scriptRunnerExecutable,
    scriptRunnerEntrypoint:
      typeof scriptRunnerEntrypoint === "string" ? scriptRunnerEntrypoint : null,
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

const requestJson = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: T }> => {
  const response = await fetch(`${VERIFY_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    signal:
      init.signal ??
      AbortSignal.timeout(init.body ? RUN_COMPLETION_TIMEOUT_MS : POLL_INTERVAL_MS * 8),
  });
  const rawBody = await response.text();
  if (rawBody.trim().length === 0) {
    throw new Error(`Expected JSON response body for ${path}, received an empty payload.`);
  }

  return {
    status: response.status,
    body: JSON.parse(rawBody) as T,
  };
};

const normalizePathname = (pathname: string): string =>
  pathname.replace(LEADING_PATHNAME_SLASH_PATTERN, "").replace(TRAILING_PATHNAME_SLASH_PATTERN, "");

const fileExists = async (filePath: string): Promise<boolean> =>
  stat(filePath).then(
    () => true,
    () => false,
  );

const findFirstMissingPath = async (candidatePaths: readonly string[]): Promise<string | null> => {
  const existenceChecks = await Promise.all(
    candidatePaths.map((candidatePath) => fileExists(candidatePath)),
  );
  const missingIndex = existenceChecks.findIndex((exists) => !exists);
  return missingIndex === -1 ? null : (candidatePaths[missingIndex] ?? null);
};

const hasAutomationCapabilities = (
  payload: unknown,
): payload is {
  capabilities: unknown[];
} =>
  isRecord(payload) &&
  "capabilities" in payload &&
  Array.isArray(payload.capabilities) &&
  payload.capabilities.length > 0;

const hasRunEnvelope = (payload: unknown): payload is RpaRunExecutionEnvelope =>
  isRecord(payload) && typeof payload.id === "string" && typeof payload.status === "string";

const hasAutomationVerifyContext = (payload: unknown): payload is AutomationVerifyContext =>
  isRecord(payload) && typeof payload.resumeId === "string" && payload.resumeId.trim().length > 0;

const createVerificationRuntimePaths = async (): Promise<VerificationRuntimePaths> => {
  const root = await mkdtemp(join(tmpdir(), "bao-desktop-verify-runtime-"));
  return {
    root,
    dbPath: join(root, "bao-desktop-verify.db"),
  };
};

const configureVerificationSettings = async (): Promise<void> => {
  const response = await requestJson<Record<string, unknown>>(API_ENDPOINTS.settings, {
    method: "PUT",
    body: JSON.stringify({
      automationSettings: {
        enableSmartSelectors: false,
      },
    }),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to configure verification settings (status ${response.status})`);
  }
};

const readAutomationVerifyContext = async (): Promise<AutomationVerifyContext> => {
  const response = await requestJson<unknown>("/api/automation/verify/context");
  if (response.status !== 200 || !hasAutomationVerifyContext(response.body)) {
    throw new Error(`Failed to read automation verification context (status ${response.status})`);
  }

  return {
    resumeId: response.body.resumeId.trim(),
  };
};

const readAutomationRun = async (runId: string): Promise<RpaRunExecutionEnvelope> => {
  const response = await requestJson<RpaRunExecutionEnvelope>(buildAutomationRunEndpoint(runId));
  if (response.status !== 200 || !hasRunEnvelope(response.body)) {
    throw new Error(`Failed to read automation run ${runId}`);
  }

  return response.body;
};

const waitForAutomationRunCompletion = async (
  runId: string,
  deadline: number = Date.now() + RUN_COMPLETION_TIMEOUT_MS,
): Promise<RpaRunExecutionEnvelope> => {
  let finalRun: RpaRunExecutionEnvelope | null = null;
  await waitForCondition(
    async () => {
      const run = await readAutomationRun(runId);
      finalRun = run;
      return run.status === "success" || run.status === "error";
    },
    `Timed out waiting for automation run ${runId} to complete`,
    deadline,
  );

  if (!finalRun) {
    throw new Error(`Automation run ${runId} did not return a terminal state.`);
  }

  return finalRun;
};

const subscribeToAutomationRun = async (
  runId: string,
): Promise<{
  events: RpaRunEvent[];
  close(): void;
  waitForTerminalEvent(): Promise<RpaRunEvent>;
}> => {
  const socket = new WebSocket(`${VERIFY_WS_BASE}${WS_ENDPOINTS.automation}`);
  const events: RpaRunEvent[] = [];
  let terminalEvent: RpaRunEvent | null = null;

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timed out opening automation verification websocket")),
      WEBSOCKET_OPEN_TIMEOUT_MS,
    );
    socket.onopen = () => {
      clearTimeout(timeout);
      socket.send(JSON.stringify({ type: "subscribe", runId }));
      resolve();
    };
    socket.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("Automation verification websocket failed to open"));
    };
  });

  socket.onmessage = (event) => {
    const payload: unknown = JSON.parse(
      typeof event.data === "string" ? event.data : `${event.data}`,
    );
    const parsedEvent = rpaRunEventSchema.safeParse(payload);
    if (!parsedEvent.success || parsedEvent.data.runId !== runId) {
      return;
    }

    const runEvent = parsedEvent.data;
    events.push(runEvent);
    if (
      runEvent.eventType === "progress" &&
      (runEvent.status === "success" || runEvent.status === "error")
    ) {
      terminalEvent = runEvent;
    }
    if (runEvent.eventType === "result" || runEvent.eventType === "error") {
      terminalEvent = runEvent;
    }
  };

  return {
    events,
    close(): void {
      socket.close();
    },
    async waitForTerminalEvent(): Promise<RpaRunEvent> {
      await waitForCondition(
        () => Promise.resolve(terminalEvent !== null),
        `Timed out waiting for websocket completion for run ${runId}`,
        Date.now() + RUN_COMPLETION_TIMEOUT_MS,
      );
      if (!terminalEvent) {
        throw new Error(`Automation websocket for run ${runId} did not yield a terminal event.`);
      }
      return terminalEvent;
    },
  };
};

const isTerminalAutomationEvent = (event: RpaRunEvent): boolean =>
  event.eventType === "result" ||
  event.eventType === "error" ||
  (event.eventType === "progress" && (event.status === "success" || event.status === "error"));

const assertAutomationEventSequence = (runId: string, events: readonly RpaRunEvent[]): void => {
  if (events.length === 0) {
    throw new Error(`Automation run ${runId} did not emit websocket events.`);
  }

  for (let index = 1; index < events.length; index += 1) {
    const currentEvent = events[index];
    const previousEvent = events[index - 1];
    if (!(currentEvent && previousEvent)) {
      throw new Error(`Automation run ${runId} emitted an invalid websocket sequence.`);
    }
    if (currentEvent.sequence < previousEvent.sequence) {
      throw new Error(`Automation run ${runId} emitted out-of-order websocket events.`);
    }
  }
};

const assertSuccessfulRun = (runId: string, run: RpaRunExecutionEnvelope): void => {
  if (run.status !== "success") {
    throw new Error(
      `Automation run ${runId} completed with ${run.status}: ${JSON.stringify({
        error: run.error,
        output: run.output,
      })}`,
    );
  }

  if (!(run.output && isRecord(run.output) && run.output.success === true)) {
    throw new Error(`Automation run ${runId} did not persist a successful output envelope.`);
  }
};

const assertObservedTerminalEvent = (
  runId: string,
  terminalEvent: RpaRunEvent,
  events: readonly RpaRunEvent[],
): void => {
  if (!isTerminalAutomationEvent(terminalEvent)) {
    throw new Error(`Automation run ${runId} did not emit a terminal websocket event.`);
  }

  const hasRunningProgress = events.some(
    (event) => event.eventType === "progress" && event.status === "running",
  );
  if (!hasRunningProgress) {
    throw new Error(`Automation run ${runId} did not emit running progress over websocket.`);
  }
};

const createJobApplyRun = async (params: {
  jobUrl: string;
  resumeId: string;
  runAt?: string;
}): Promise<RpaRunExecutionEnvelope> => {
  const endpoint = params.runAt
    ? API_ENDPOINTS.automationJobApplySchedule
    : API_ENDPOINTS.automationJobApply;
  const response = await requestJson<RpaRunExecutionEnvelope>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      jobUrl: params.jobUrl,
      resumeId: params.resumeId,
      ...(params.runAt ? { runAt: params.runAt } : {}),
    }),
  });
  if (response.status !== 200 || !hasRunEnvelope(response.body)) {
    throw new Error(`Failed to create job-apply run via ${endpoint}.`);
  }

  return response.body;
};

const assertScraperRuntimeContract = async (manifest: DesktopRuntimeManifest): Promise<void> => {
  if (manifest.scraperDir !== DESKTOP_RUNTIME_SCRAPER_DIR) {
    throw new Error(`Unexpected desktop runtime scraper dir: ${manifest.scraperDir}`);
  }

  const scraperRuntimeRoot = join(RUNTIME_ROOT, manifest.scraperDir);
  const stagedContractPaths = SCRAPER_RUNTIME_STAGE_SOURCE_PATHS.map((relativePath) =>
    join(scraperRuntimeRoot, relativePath),
  );
  const missingContractPath = await findFirstMissingPath(stagedContractPaths);
  if (missingContractPath) {
    throw new Error(`Packaged scraper runtime is missing ${missingContractPath}`);
  }

  const runtimeDependencyRoots = await collectRuntimeDependencySourceRoots(
    join(REPO_ROOT, "packages", "scraper"),
  );
  const stagedDependencyManifestPaths = Array.from(runtimeDependencyRoots.keys(), (packageName) =>
    join(scraperRuntimeRoot, "node_modules", packageName, "package.json"),
  );
  const missingDependencyManifestPath = await findFirstMissingPath(stagedDependencyManifestPaths);
  if (missingDependencyManifestPath) {
    throw new Error(
      `Packaged scraper runtime is missing dependency manifest ${missingDependencyManifestPath}`,
    );
  }
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

const runBrowserChecks = async (apiBase: string, wsBase: string): Promise<BrowserCheckResult> => {
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

const assertAutomationEndpoints = async (apiBase: string): Promise<void> => {
  const capabilitiesResponse = await fetch(`${apiBase}/automation/capabilities`);
  if (!capabilitiesResponse.ok) {
    throw new Error(
      `Automation capabilities endpoint failed: ${capabilitiesResponse.status} ${capabilitiesResponse.statusText}`,
    );
  }
  const capabilitiesPayload: unknown = await capabilitiesResponse.json();
  if (!hasAutomationCapabilities(capabilitiesPayload)) {
    throw new Error("Automation capabilities payload missing required entries.");
  }

  const runsResponse = await fetch(`${apiBase}/automation/runs?limit=1`);
  if (!runsResponse.ok) {
    throw new Error(`Automation runs endpoint failed: ${runsResponse.status}`);
  }
};

const verifyAutomationRun = async (
  runId: string,
  subscription: Awaited<ReturnType<typeof subscribeToAutomationRun>>,
): Promise<void> => {
  await withCleanup(
    async () => {
      const terminalEvent = await subscription.waitForTerminalEvent();
      const completedRun = await waitForAutomationRunCompletion(runId);
      assertAutomationEventSequence(runId, subscription.events);
      assertObservedTerminalEvent(runId, terminalEvent, subscription.events);
      assertSuccessfulRun(runId, completedRun);
    },
    () => {
      subscription.close();
    },
  );
};

const verifyCompletedAutomationRun = async (runId: string): Promise<void> => {
  const completedRun = await waitForAutomationRunCompletion(runId);
  assertSuccessfulRun(runId, completedRun);
};

const verifyManualJobApplyRun = async (resumeId: string, fixtureBaseUrl: string): Promise<void> => {
  const run = await createJobApplyRun({
    jobUrl: fixtureBaseUrl,
    resumeId,
  });
  await verifyCompletedAutomationRun(run.id);
};

const verifyScheduledJobApplyRun = async (
  resumeId: string,
  fixtureBaseUrl: string,
): Promise<void> => {
  const runAt = new Date(Date.now() + SCHEDULE_RUN_LEAD_TIME_MS).toISOString();
  const run = await createJobApplyRun({
    jobUrl: fixtureBaseUrl,
    resumeId,
    runAt,
  });
  const subscription = await subscribeToAutomationRun(run.id);
  await verifyAutomationRun(run.id, subscription);
};

const verifyScheduledRunRecovery = async (
  resumeId: string,
  fixtureBaseUrl: string,
  restartServer: () => Promise<void>,
): Promise<void> => {
  const runAt = new Date(Date.now() + SCHEDULE_RECOVERY_LEAD_TIME_MS).toISOString();
  const run = await createJobApplyRun({
    jobUrl: fixtureBaseUrl,
    resumeId,
    runAt,
  });

  await Bun.sleep(AUTOMATION_RESTART_SETTLE_MS);
  await restartServer();

  const subscription = await subscribeToAutomationRun(run.id);
  await verifyAutomationRun(run.id, subscription);
};

const startPackagedServer = async (
  manifest: DesktopRuntimeManifest,
  runtimePaths: VerificationRuntimePaths,
): Promise<ReturnType<typeof Bun.spawn>> => {
  const serverExecutablePath = join(RUNTIME_ROOT, manifest.serverExecutable);
  const scriptRunnerPath = join(RUNTIME_ROOT, manifest.scriptRunnerExecutable);
  const scriptRunnerEntrypointPath = manifest.scriptRunnerEntrypoint
    ? join(RUNTIME_ROOT, manifest.scriptRunnerEntrypoint)
    : null;
  const scraperDirPath = join(RUNTIME_ROOT, manifest.scraperDir);

  if (!(await fileExists(scriptRunnerPath))) {
    throw new Error(`Packaged desktop script runner is missing ${scriptRunnerPath}`);
  }
  if (scriptRunnerEntrypointPath && !(await fileExists(scriptRunnerEntrypointPath))) {
    throw new Error(
      `Packaged desktop script runner entrypoint is missing ${scriptRunnerEntrypointPath}`,
    );
  }

  const overrideCorsOrigins = Array.from(
    new Set([...manifest.corsOrigins, VERIFY_FRONTEND_ORIGIN]),
  ).join(",");

  const proc = Bun.spawn([serverExecutablePath], {
    cwd: RUNTIME_ROOT,
    env: {
      ...process.env,
      BAO_ALLOW_AUTOMATION_PRIVATE_HOSTS: "true",
      BAO_DISABLE_AUTH: "true",
      BAO_ENABLE_AUTOMATION_VERIFY: "true",
      BAO_SCRAPER_DIR: scraperDirPath,
      BAO_SCRIPT_RUNNER_PATH: scriptRunnerPath,
      BAO_SCRIPT_RUNNER_ENTRYPOINT_PATH: scriptRunnerEntrypointPath ?? undefined,
      CORS_ORIGINS: overrideCorsOrigins,
      DB_PATH: runtimePaths.dbPath,
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
    throw new Error(
      "Generated desktop frontend is missing packages/client/.output/public/index.html",
    );
  }

  const leakedBuildFile = await findLeakedBuildEndpoint(CLIENT_PUBLIC_ROOT);
  if (leakedBuildFile) {
    throw new Error(`Temporary build endpoint leaked into generated frontend: ${leakedBuildFile}`);
  }

  if (!manifest.corsOrigins.includes(DESKTOP_RUNTIME_CORS_ORIGINS[0])) {
    throw new Error("Desktop runtime manifest is missing the primary packaged CORS origin.");
  }

  await assertScraperRuntimeContract(manifest);
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
    throw new Error(
      `Unexpected desktop API health status from browser: ${browserResult.healthStatus}`,
    );
  }
  if (!browserResult.websocketOpened) {
    throw new Error("Desktop automation WebSocket did not open from the generated frontend.");
  }
};

const runPackagedRuntimeChecks = async (
  manifest: DesktopRuntimeManifest,
  verificationFrontendRoot: string,
  fixtureBaseUrl: string,
  restartServer: () => Promise<void>,
): Promise<void> => {
  const staticServer = startStaticFrontendServer(verificationFrontendRoot);
  await withCleanup(
    async () => {
      await verifyCorsContract(VERIFY_API_BASE, manifest, DESKTOP_RUNTIME_CORS_ORIGINS[0]);
      await verifyCorsContract(VERIFY_API_BASE, manifest, VERIFY_FRONTEND_ORIGIN);
      await assertAutomationEndpoints(VERIFY_API_ROUTE_BASE);
      const browserResult = await runBrowserChecks(VERIFY_API_BASE, VERIFY_WS_BASE);
      assertBrowserChecksPassed(browserResult);
      await configureVerificationSettings();
      await writeOutput(
        "desktop-runtime: configured deterministic automation verification settings",
      );

      const { resumeId } = await readAutomationVerifyContext();
      await writeOutput("desktop-runtime: verifying packaged manual automation run");
      await verifyManualJobApplyRun(resumeId, fixtureBaseUrl);

      await writeOutput("desktop-runtime: verifying scheduled automation run and websocket events");
      await verifyScheduledJobApplyRun(resumeId, fixtureBaseUrl);

      await writeOutput("desktop-runtime: verifying scheduled automation recovery across restart");
      await verifyScheduledRunRecovery(resumeId, fixtureBaseUrl, restartServer);

      await writeOutput(
        `desktop-runtime: verified frontend "${browserResult.pageTitle}" against ${VERIFY_API_BASE}`,
      );
      await writeOutput("desktop-runtime: verification passed");
    },
    () => staticServer.stop(true),
  );
};

const verifyPackagedRuntime = async (
  manifest: DesktopRuntimeManifest,
  verificationFrontendRoot: string,
): Promise<void> => {
  const runtimePaths = await createVerificationRuntimePaths();
  let serverProcess: ReturnType<typeof Bun.spawn> | null = null;
  const fixture = startJobApplyFixtureServer();

  const startServer = async (): Promise<void> => {
    serverProcess = await startPackagedServer(manifest, runtimePaths);
  };

  const restartServer = async (): Promise<void> => {
    if (serverProcess) {
      await stopProcess(serverProcess);
      serverProcess = null;
    }
    await startServer();
  };

  await withCleanup(
    async () => {
      await writeOutput("desktop-runtime: launching packaged server executable");
      await startServer();
      await runPackagedRuntimeChecks(
        manifest,
        verificationFrontendRoot,
        fixture.baseUrl,
        restartServer,
      );
    },
    async () => {
      await fixture.stop();
      if (serverProcess) {
        await stopProcess(serverProcess);
      }
      await rm(runtimePaths.root, { recursive: true, force: true });
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
