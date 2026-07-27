import { DECIMAL_RADIX } from "../packages/shared/src/constants/client-config";
import {
  DEFAULT_CLIENT_DEV_PORT,
  DEFAULT_PINCHTAB_PORT,
  DEFAULT_SERVER_PORT,
  MAX_PORT,
  MIN_PORT,
} from "../packages/shared/src/constants/ports";
import {
  DEFAULT_HOST,
  LOOPBACK_HOST,
  LOOPBACK_HOST_IPV4,
  TRACE_ID_HEADER,
} from "../packages/shared/src/constants/runtime";
import {
  DEV_STACK_PROBE_POLL_INTERVAL_MS,
  DEV_STACK_PROBE_READY_TIMEOUT_MS,
  DEV_STACK_PROBE_REQUEST_TIMEOUT_MS,
  EXIT_CODE_FAILURE,
  EXIT_CODE_SUCCESS,
  PINCHTAB_POLL_INTERVAL_MS,
  PINCHTAB_READY_TIMEOUT_MS,
  PINCHTAB_REQUEST_TIMEOUT_MS,
} from "../packages/shared/src/constants/scripts";
import {
  BACKEND_PROBE_NO_RESPONSE_STATUS,
  type BackendProbeVerdict,
  classifyBackendProbe,
  describeForeignBackend,
  toBackendProbeUrl,
} from "../packages/shared/src/utils/backend-identity-probe";

type ProcessName = "server" | "client";
type ManagedProcess = ReturnType<typeof Bun.spawn>;
type DevStackRuntime = {
  readonly serverPort: number;
  readonly clientPort: number;
  readonly clientHost: string;
  readonly serverEnv: Record<string, string>;
  readonly clientEnv: Record<string, string>;
};

const validatePort = (value: string | undefined, fallback: number): number => {
  const parsed = value ? Number.parseInt(value, DECIMAL_RADIX) : fallback;
  if (!Number.isFinite(parsed) || parsed < MIN_PORT || parsed > MAX_PORT) {
    return fallback;
  }
  return parsed;
};

const normalizeEnv = (environment: Record<string, string | undefined>): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(environment)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }
  return normalized;
};

const toStringPort = (value: number): string => `${value}`;
const write = (value: string): void => {
  process.stdout.write(value);
};

const readCliFlagValue = (argv: readonly string[], flag: string): string | undefined => {
  const inlinePrefix = `${flag}=`;
  const inlineMatch = argv.find((argument) => argument.startsWith(inlinePrefix));
  if (inlineMatch) {
    const value = inlineMatch.slice(inlinePrefix.length);
    return value.length > 0 ? value : undefined;
  }

  const flagIndex = argv.indexOf(flag);
  if (flagIndex === -1) {
    return;
  }

  const nextValue = argv[flagIndex + 1];
  return nextValue && !nextValue.startsWith("--") ? nextValue : undefined;
};

export const createDevStackRuntime = (
  argv: readonly string[],
  environment: Record<string, string | undefined>,
): DevStackRuntime => {
  const serverPort = validatePort(
    readCliFlagValue(argv, "--server-port") ?? environment.SERVER_PORT,
    DEFAULT_SERVER_PORT,
  );
  const clientPort = validatePort(
    readCliFlagValue(argv, "--client-port") ?? environment.CLIENT_PORT,
    DEFAULT_CLIENT_DEV_PORT,
  );
  // Bind Nuxt to IPv4 loopback by default. `localhost` often resolves to ::1-only on
  // dual-stack hosts, which breaks Playwright/tooling that dials 127.0.0.1.
  const clientHost =
    readCliFlagValue(argv, "--client-host") ?? environment.NUXT_HOST ?? LOOPBACK_HOST_IPV4;
  const apiBase = `http://${LOOPBACK_HOST_IPV4}:${toStringPort(serverPort)}`;
  const corsOrigins = [
    `http://${LOOPBACK_HOST}:${toStringPort(serverPort)}`,
    `http://${LOOPBACK_HOST_IPV4}:${toStringPort(serverPort)}`,
    `http://${LOOPBACK_HOST}:${toStringPort(clientPort)}`,
    `http://${LOOPBACK_HOST_IPV4}:${toStringPort(clientPort)}`,
  ].join(",");

  const serverEnv = normalizeEnv(environment);
  serverEnv.PORT = toStringPort(serverPort);
  serverEnv.SERVER_PORT = toStringPort(serverPort);
  serverEnv.HOST = environment.HOST ?? DEFAULT_HOST;
  serverEnv.CORS_ORIGINS = corsOrigins;

  const clientEnv = normalizeEnv(environment);
  clientEnv.CLIENT_PORT = toStringPort(clientPort);
  clientEnv.NUXT_CLIENT_PORT = toStringPort(clientPort);
  clientEnv.SERVER_PORT = toStringPort(serverPort);
  clientEnv.CORS_ORIGINS = corsOrigins;
  clientEnv.NUXT_PUBLIC_API_BASE = apiBase;
  clientEnv.NUXT_PUBLIC_WS_BASE = apiBase;

  return {
    serverPort,
    clientPort,
    clientHost,
    serverEnv,
    clientEnv,
  };
};

const runtime = createDevStackRuntime(process.argv.slice(2), process.env);

const trackedProcesses: ManagedProcess[] = [];
let shuttingDown = false;

const waitForExit = async (childProcess: ManagedProcess): Promise<number> => childProcess.exited;

/**
 * Spawns a managed child and registers it for shutdown immediately.
 *
 * Registration happens at spawn time, not when `trackProcess` is awaited, so a
 * failure between the two — the backend identity probe, for instance — still
 * tears the child down instead of orphaning it.
 */
const spawnProcess = (args: string[], env: Record<string, string>): ManagedProcess => {
  const child = Bun.spawn(["bun", ...args], {
    cwd: process.cwd(),
    env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  trackedProcesses.push(child);
  return child;
};

const spawnServer = (): ManagedProcess => {
  return spawnProcess(
    ["--env-file=.env", "run", "--cwd", "packages/server", "dev"],
    runtime.serverEnv,
  );
};

const spawnClient = (): ManagedProcess => {
  return spawnProcess(
    [
      "--env-file=.env",
      "run",
      "--cwd",
      "packages/client",
      "dev",
      "--",
      "--port",
      toStringPort(runtime.clientPort),
      "--host",
      runtime.clientHost,
    ],
    runtime.clientEnv,
  );
};

/**
 * Stops every tracked child and exits.
 *
 * `exitCode` exists so a startup failure (for example another process holding
 * the API port) exits non-zero instead of masquerading as a clean shutdown —
 * a dev stack that dies with status 0 reads as success to `bun run` and CI.
 */
const shutdown = async (reason: string, exitCode: number = EXIT_CODE_SUCCESS): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  write(`\n[bao/dev-stack] shutdown: ${reason}\n`);

  for (const item of trackedProcesses) {
    item.kill("SIGTERM");
  }

  await Promise.allSettled(trackedProcesses.map(waitForExit));

  write(
    exitCode === EXIT_CODE_SUCCESS
      ? "[bao/dev-stack] exited cleanly\n"
      : `[bao/dev-stack] exited with code ${String(exitCode)}\n`,
  );
  process.exit(exitCode);
};

/**
 * Awaits a managed child and shuts the stack down when it dies unexpectedly.
 *
 * Registration is owned by `spawnProcess`, so this only observes the exit.
 */
const trackProcess = async (name: ProcessName, proc: ManagedProcess): Promise<void> => {
  const exitCode = await waitForExit(proc);
  write(`[bao/dev-stack] ${name} exited with code ${exitCode}\n`);
  if (!shuttingDown) {
    await shutdown(`${name} terminated unexpectedly`);
  }
};

const TRAILING_SLASH_REGEX = /\/$/;

const settlePromise = async <T>(promise: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([promise]);
  return result;
};

const isPinchTabReachable = async (baseUrl: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PINCHTAB_REQUEST_TIMEOUT_MS);
  const result = await settlePromise(
    fetch(`${baseUrl.replace(TRAILING_SLASH_REGEX, "")}/`, {
      signal: controller.signal,
    }),
  );
  clearTimeout(timeout);
  if (result.status === "rejected") {
    return false;
  }
  return result.value.ok;
};

const describeAsyncError = (value: unknown): string =>
  value instanceof Error ? value.message : String(value);

const ensurePinchTabRunning = async (): Promise<string> => {
  const baseUrl = process.env.PINCHTAB_URL ?? `http://${LOOPBACK_HOST}:${DEFAULT_PINCHTAB_PORT}`;
  if (await isPinchTabReachable(baseUrl)) {
    write(`[bao/dev-stack] PinchTab already running at ${baseUrl}\n`);
    return baseUrl;
  }

  const pinchtabPath = process.env.PINCHTAB_BIN ?? "pinchtab";
  if (!Bun.which(pinchtabPath)) {
    write(
      `[bao/dev-stack] PinchTab not found (${pinchtabPath}); agents will use puppeteer fallback\n`,
    );
    return baseUrl;
  }

  write(`[bao/dev-stack] starting PinchTab server at ${baseUrl}\n`);
  const url = new URL(baseUrl);
  const port = url.port || String(DEFAULT_PINCHTAB_PORT);
  const pinchtab = Bun.spawn([pinchtabPath], {
    cwd: process.cwd(),
    env: { ...process.env, PINCHTAB_PORT: port },
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    windowsHide: true,
  });
  pinchtab.unref();

  const deadline = Date.now() + PINCHTAB_READY_TIMEOUT_MS;

  const pollUntilReady = async (): Promise<string> => {
    if (Date.now() >= deadline) {
      write(
        `[bao/dev-stack] PinchTab did not become ready within ${PINCHTAB_READY_TIMEOUT_MS}ms; agents will use puppeteer fallback\n`,
      );
      return baseUrl;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, PINCHTAB_POLL_INTERVAL_MS));
    if (await isPinchTabReachable(baseUrl)) {
      write(`[bao/dev-stack] PinchTab ready at ${baseUrl}\n`);
      return baseUrl;
    }
    return pollUntilReady();
  };

  return pollUntilReady();
};

/**
 * Performs one identity probe against the advertised API base.
 */
const probeBackendOnce = async (probeUrl: string): Promise<BackendProbeVerdict> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEV_STACK_PROBE_REQUEST_TIMEOUT_MS);
  const result = await settlePromise(fetch(probeUrl, { signal: controller.signal }));
  clearTimeout(timeout);

  if (result.status === "rejected") {
    return classifyBackendProbe({
      status: BACKEND_PROBE_NO_RESPONSE_STATUS,
      traceIdHeader: null,
      bodyText: "",
    });
  }

  const bodyResult = await settlePromise(result.value.text());
  return classifyBackendProbe({
    status: result.value.status,
    traceIdHeader: result.value.headers.get(TRACE_ID_HEADER),
    bodyText: bodyResult.status === "fulfilled" ? bodyResult.value : "",
  });
};

/**
 * Waits until the advertised API base is proven to be this stack's own backend.
 *
 * A foreign responder fails immediately: retrying cannot turn somebody else's
 * server into ours, and continuing would hand the client the wrong backend.
 * Only "unreachable" is retried, because our own server needs time to boot.
 */
const ensureOwnBackendReachable = async (apiBase: string): Promise<void> => {
  const probeUrl = toBackendProbeUrl(apiBase);
  const deadline = Date.now() + DEV_STACK_PROBE_READY_TIMEOUT_MS;

  const poll = async (): Promise<void> => {
    const verdict = await probeBackendOnce(probeUrl);
    if (verdict.kind === "ours") {
      write(`[bao/dev-stack] backend identity confirmed at ${apiBase}\n`);
      return;
    }
    if (verdict.kind === "foreign") {
      write(`[bao/dev-stack] ${describeForeignBackend(apiBase, verdict.reason)}\n`);
      await shutdown(`port conflict on ${apiBase}`, EXIT_CODE_FAILURE);
      return;
    }
    if (Date.now() >= deadline) {
      write(
        `[bao/dev-stack] backend did not answer on ${apiBase} within ${String(DEV_STACK_PROBE_READY_TIMEOUT_MS)}ms (${verdict.reason})\n`,
      );
      await shutdown(`backend unreachable on ${apiBase}`, EXIT_CODE_FAILURE);
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, DEV_STACK_PROBE_POLL_INTERVAL_MS));
    return poll();
  };

  return poll();
};

const main = async (): Promise<void> => {
  const pinchtabUrl = await ensurePinchTabRunning();
  runtime.serverEnv.PINCHTAB_URL = pinchtabUrl;
  runtime.clientEnv.PINCHTAB_URL = pinchtabUrl;

  write(`[bao/dev-stack] launching server on port ${toStringPort(runtime.serverPort)}\n`);
  const server = spawnServer();

  // Prove the address the client will be told to call is served by the server we
  // just spawned. Our server binds the IPv6 wildcard, so a foreign process on
  // the IPv4 loopback wins that address without ever raising EADDRINUSE — and
  // the client would silently talk to it instead of us.
  await ensureOwnBackendReachable(runtime.clientEnv.NUXT_PUBLIC_API_BASE);

  write(`[bao/dev-stack] launching client on port ${toStringPort(runtime.clientPort)}\n`);
  const client = spawnClient();

  trackProcess("server", server).then(undefined, (error: unknown) => {
    write(`[bao/dev-stack] failed to track server process: ${describeAsyncError(error)}\n`);
  });
  trackProcess("client", client).then(undefined, (error: unknown) => {
    write(`[bao/dev-stack] failed to track client process: ${describeAsyncError(error)}\n`);
  });
};

process.once("SIGINT", () => {
  shutdown("signal: SIGINT").then(undefined, (error: unknown) => {
    write(`[bao/dev-stack] failed to handle SIGINT shutdown: ${describeAsyncError(error)}\n`);
  });
});
process.once("SIGTERM", () => {
  shutdown("signal: SIGTERM").then(undefined, (error: unknown) => {
    write(`[bao/dev-stack] failed to handle SIGTERM shutdown: ${describeAsyncError(error)}\n`);
  });
});

if (import.meta.main) {
  main().then(undefined, (err: unknown) => {
    write(`[bao/dev-stack] fatal: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
