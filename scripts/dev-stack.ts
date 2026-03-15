import { type ChildProcess, spawn, spawnSync, type SpawnSyncReturns } from "child_process";

import {
  DEFAULT_CLIENT_DEV_PORT,
  DEFAULT_PINCHTAB_PORT,
  DEFAULT_SERVER_PORT,
  MAX_PORT,
  MIN_PORT,
} from "../packages/shared/src/constants/ports";
import { DECIMAL_RADIX } from "../packages/shared/src/constants/client-config";
import {
  LOOPBACK_HOST,
  DEFAULT_HOST,
  LOOPBACK_HOST_IPV4,
} from "../packages/shared/src/constants/runtime";
import {
  PINCHTAB_POLL_INTERVAL_MS,
  PINCHTAB_READY_TIMEOUT_MS,
  PINCHTAB_REQUEST_TIMEOUT_MS,
} from "../packages/shared/src/constants/scripts";

type ProcessName = "server" | "client";

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

const resolveErrorCode = (value: unknown): string | undefined => {
  if (!(value && typeof value === "object" && "code" in value)) {
    return;
  }
  const code = value.code;
  return typeof code === "string" ? code : undefined;
};

const serverPort = validatePort(process.env.SERVER_PORT, DEFAULT_SERVER_PORT);
const localhostHost = LOOPBACK_HOST;
const clientHost = process.env.NUXT_HOST ?? LOOPBACK_HOST;
const clientPort = validatePort(process.env.CLIENT_PORT, DEFAULT_CLIENT_DEV_PORT);
const apiBase = `http://${localhostHost}:${toStringPort(serverPort)}`;
const corsOrigins = [
  `http://${LOOPBACK_HOST}:${toStringPort(serverPort)}`,
  `http://${LOOPBACK_HOST_IPV4}:${toStringPort(serverPort)}`,
  `http://${LOOPBACK_HOST}:${toStringPort(clientPort)}`,
  `http://${LOOPBACK_HOST_IPV4}:${toStringPort(clientPort)}`,
].join(",");

const serverEnv = normalizeEnv(process.env);
serverEnv.PORT = toStringPort(serverPort);
serverEnv.SERVER_PORT = toStringPort(serverPort);
serverEnv.HOST = process.env.HOST ?? DEFAULT_HOST;
serverEnv.CORS_ORIGINS = corsOrigins;

const clientEnv = normalizeEnv(process.env);
clientEnv.CLIENT_PORT = toStringPort(clientPort);
clientEnv.NUXT_CLIENT_PORT = toStringPort(clientPort);
clientEnv.SERVER_PORT = toStringPort(serverPort);
clientEnv.CORS_ORIGINS = corsOrigins;
clientEnv.NUXT_PUBLIC_API_BASE = apiBase;
clientEnv.NUXT_PUBLIC_WS_BASE = apiBase;

const trackedProcesses: ChildProcess[] = [];
let shuttingDown = false;

const waitForExit = (childProcess: ChildProcess): Promise<number> => {
  return new Promise((resolve) => {
    childProcess.once("exit", (exitCode) => {
      resolve(exitCode ?? 0);
    });
  });
};

const spawnProcess = (args: string[], env: Record<string, string>): ChildProcess => {
  return spawn("bun", args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
};

const spawnServer = (): ChildProcess => {
  return spawnProcess(["--env-file=.env", "run", "--filter", "@bao/server", "dev"], serverEnv);
};

const spawnClient = (): ChildProcess => {
  return spawnProcess(
    [
      "--env-file=.env",
      "run",
      "--filter",
      "@bao/client",
      "dev",
      "--",
      "--port",
      toStringPort(clientPort),
      "--host",
      clientHost,
    ],
    clientEnv,
  );
};

const shutdown = async (reason: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  write(`\n[bao/dev-stack] shutdown: ${reason}\n`);

  for (const item of trackedProcesses) {
    item.kill();
  }

  await Promise.allSettled(trackedProcesses.map(waitForExit));

  write("[bao/dev-stack] exited cleanly\n");
  process.exit(0);
};

const trackProcess = async (name: ProcessName, proc: ChildProcess): Promise<void> => {
  trackedProcesses.push(proc);
  const exitCode = await waitForExit(proc);
  write(`[bao/dev-stack] ${name} exited with code ${exitCode}\n`);
  if (!shuttingDown) {
    await shutdown(`${name} terminated unexpectedly`);
  }
};

const TRAILING_SLASH_REGEX = /\/$/;

const isPinchTabReachable = async (baseUrl: string): Promise<boolean> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PINCHTAB_REQUEST_TIMEOUT_MS);
  const result = await fetch(`${baseUrl.replace(TRAILING_SLASH_REGEX, "")}/`, {
    signal: controller.signal,
  })
    .then((res) => res.ok)
    .catch(() => false);
  clearTimeout(timeout);
  return result;
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
  const check: SpawnSyncReturns<string> = spawnSync(pinchtabPath, ["--version"], {
    encoding: "utf8",
    stdio: "pipe",
  });
  const errCode = resolveErrorCode(check.error);
  if (errCode === "ENOENT") {
    write(
      `[bao/dev-stack] PinchTab not found (${pinchtabPath}); agents will use puppeteer fallback\n`,
    );
    return baseUrl;
  }

  write(`[bao/dev-stack] starting PinchTab server at ${baseUrl}\n`);
  const url = new URL(baseUrl);
  const port = url.port || String(DEFAULT_PINCHTAB_PORT);
  const pinchtab = spawn(pinchtabPath, [], {
    cwd: process.cwd(),
    env: { ...process.env, PINCHTAB_PORT: port },
    stdio: "ignore",
    detached: true,
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
  serverEnv.PINCHTAB_URL = pinchtabUrl;
  clientEnv.PINCHTAB_URL = pinchtabUrl;

  write(`[bao/dev-stack] launching server on port ${toStringPort(serverPort)}\n`);
  const server = spawnServer();
  write(`[bao/dev-stack] launching client on port ${toStringPort(clientPort)}\n`);
  const client = spawnClient();

  trackProcess("server", server).catch((error: unknown) => {
    write(`[bao/dev-stack] failed to track server process: ${describeAsyncError(error)}\n`);
  });
  trackProcess("client", client).catch((error: unknown) => {
    write(`[bao/dev-stack] failed to track client process: ${describeAsyncError(error)}\n`);
  });
};

process.once("SIGINT", () => {
  shutdown("signal: SIGINT").catch((error: unknown) => {
    write(`[bao/dev-stack] failed to handle SIGINT shutdown: ${describeAsyncError(error)}\n`);
  });
});
process.once("SIGTERM", () => {
  shutdown("signal: SIGTERM").catch((error: unknown) => {
    write(`[bao/dev-stack] failed to handle SIGTERM shutdown: ${describeAsyncError(error)}\n`);
  });
});

main().catch((err: unknown) => {
  write(`[bao/dev-stack] fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
