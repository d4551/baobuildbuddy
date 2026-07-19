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
} from "../packages/shared/src/constants/runtime";
import {
  PINCHTAB_POLL_INTERVAL_MS,
  PINCHTAB_READY_TIMEOUT_MS,
  PINCHTAB_REQUEST_TIMEOUT_MS,
} from "../packages/shared/src/constants/scripts";

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

const spawnProcess = (args: string[], env: Record<string, string>): ManagedProcess => {
  return Bun.spawn(["bun", ...args], {
    cwd: process.cwd(),
    env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
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

const shutdown = async (reason: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  write(`\n[bao/dev-stack] shutdown: ${reason}\n`);

  for (const item of trackedProcesses) {
    item.kill("SIGTERM");
  }

  await Promise.allSettled(trackedProcesses.map(waitForExit));

  write("[bao/dev-stack] exited cleanly\n");
  process.exit(0);
};

const trackProcess = async (name: ProcessName, proc: ManagedProcess): Promise<void> => {
  trackedProcesses.push(proc);
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

const main = async (): Promise<void> => {
  const pinchtabUrl = await ensurePinchTabRunning();
  runtime.serverEnv.PINCHTAB_URL = pinchtabUrl;
  runtime.clientEnv.PINCHTAB_URL = pinchtabUrl;

  write(`[bao/dev-stack] launching server on port ${toStringPort(runtime.serverPort)}\n`);
  const server = spawnServer();
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
