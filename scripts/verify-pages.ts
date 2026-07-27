import { readdir } from "node:fs/promises";
import { DEFAULT_I18N_LOCALE_COOKIE_KEY } from "../packages/shared/src/constants/client-config";
import {
  PREVIEW_LOG_LIMIT,
  PREVIEW_POLL_INTERVAL_MS,
  PREVIEW_READY_TIMEOUT_MS,
} from "../packages/shared/src/constants/scripts";
import { APP_LANGUAGE_CODES } from "../packages/shared/src/constants/settings";
import { writeError, writeOutput } from "./utils/cli-output";
import {
  CLIENT_BUILD_CHUNKS_PATH,
  CLIENT_BUILD_OUTPUT_PATH,
  CLIENT_OUTPUT_ROOT,
  CLIENT_PACKAGE_ROOT,
  EXTERNAL_VERIFY_BASE_URL,
  LINE_SEPARATOR,
  NUM_26,
  NUM_5,
  ROUTE_PATHS,
  VERIFY_BASE_URL,
  VERIFY_HOST,
  VERIFY_PORT,
} from "./utils/verify-pages-env";
import {
  createRouteFailure,
  type RouteVerificationFailure,
  type RouteVerificationResult,
  verifyHtmlContent,
} from "./utils/verify-pages-html";

type PreviewProcess = ReturnType<typeof Bun.spawn>;

type EnvMap = Readonly<Record<string, string | undefined>>;

const readRuntimeEnv = (): EnvMap => {
  const runtime = globalThis as {
    process?: { env?: EnvMap };
  };
  return runtime.process?.env ?? {};
};

const pushBoundedLine = (target: string[], value: string): void => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return;
  }

  target.push(normalized);
  if (target.length > PREVIEW_LOG_LIMIT) {
    target.shift();
  }
};

const readPreviewLogs = async (
  stream: number | ReadableStream<Uint8Array> | undefined,
  target: string[],
): Promise<void> => {
  if (!(stream instanceof ReadableStream)) {
    return;
  }

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  const consumeResult = async (): Promise<void> => {
    const readResult = await reader.read();
    if (readResult.done) {
      const trailing = [pending, decoder.decode()].join("").trim();
      if (trailing.length > 0) {
        pushBoundedLine(target, trailing);
      }
      return;
    }

    if (readResult.value.length > 0) {
      const chunk = [pending, decoder.decode(readResult.value, { stream: true })].join("");
      const lines = chunk.split(/\r?\n/gu);
      pending = lines.pop() ?? "";
      for (const line of lines) {
        pushBoundedLine(target, line);
      }
    }

    return consumeResult();
  };

  await consumeResult();
};

const pathExists = async (absolutePath: string): Promise<boolean> =>
  readdir(absolutePath).then(
    () => true,
    () => false,
  );

const runCommand = async (command: readonly string[], outputMessage: string): Promise<boolean> => {
  await writeOutput(outputMessage);
  const processHandle = Bun.spawn([...command], {
    cwd: process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await processHandle.exited;
  return exitCode === 0;
};

const ensureClientBuildExists = async (): Promise<boolean> => {
  const removeOutputSuccess = await runCommand(
    ["rm", "-rf", CLIENT_OUTPUT_ROOT],
    "Resetting client production output before verify:pages.",
  );
  if (!removeOutputSuccess) {
    return false;
  }

  const buildSuccess = await runCommand(
    [process.execPath, "run", "--cwd", "packages/client", "build"],
    "Running `bun run --cwd packages/client build` for verify:pages.",
  );
  if (!buildSuccess) {
    return false;
  }

  const buildFile = Bun.file(CLIENT_BUILD_OUTPUT_PATH);
  const [buildFileExists, chunksPathExists] = await Promise.all([
    buildFile.exists(),
    pathExists(CLIENT_BUILD_CHUNKS_PATH),
  ]);
  return buildFileExists && chunksPathExists;
};

const spawnPreviewProcess = (): PreviewProcess =>
  Bun.spawn(["bun", ".output/server/index.mjs"], {
    cwd: CLIENT_PACKAGE_ROOT,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...readRuntimeEnv(),
      PORT: VERIFY_PORT,
      HOST: VERIFY_HOST,
    },
  });

const pollPreviewReady = async (baseUrl: string, deadline: number): Promise<boolean> => {
  if (Date.now() >= deadline) {
    return false;
  }

  const fetchResult = await Promise.allSettled([
    fetch(baseUrl, { signal: AbortSignal.timeout(PREVIEW_POLL_INTERVAL_MS) }),
  ]);
  const response = fetchResult[0];
  if (response.status === "fulfilled" && response.value.ok) {
    return true;
  }

  await Bun.sleep(PREVIEW_POLL_INTERVAL_MS);
  return pollPreviewReady(baseUrl, deadline);
};

const waitForPreviewReady = async (baseUrl: string): Promise<boolean> => {
  const deadline = Date.now() + PREVIEW_READY_TIMEOUT_MS;
  return pollPreviewReady(baseUrl, deadline);
};

const verifyRoute = async (
  locale: string,
  route: string,
): Promise<RouteVerificationResult | RouteVerificationFailure> => {
  const requestUrl = [VERIFY_BASE_URL, route].join("");
  const localeCookie = [DEFAULT_I18N_LOCALE_COOKIE_KEY, "=", locale].join("");
  const response = await fetch(requestUrl, {
    headers: {
      "accept-language": locale,
      cookie: localeCookie,
    },
  });

  if (!response.ok) {
    const reason = ["Expected 2xx status but received ", String(response.status), "."].join("");
    return createRouteFailure(locale, route, response.status, reason);
  }

  const html = await response.text();
  return verifyHtmlContent(locale, route, response.status, html);
};

const verifyRoutes = async (): Promise<{
  successes: RouteVerificationResult[];
  failures: RouteVerificationFailure[];
}> => {
  const tasks = APP_LANGUAGE_CODES.flatMap((locale) =>
    ROUTE_PATHS.map((route) => verifyRoute(locale, route)),
  );
  const results = await Promise.all(tasks);
  const successes: RouteVerificationResult[] = [];
  const failures: RouteVerificationFailure[] = [];

  for (const result of results) {
    if ("reason" in result) {
      failures.push(result);
    } else {
      successes.push(result);
    }
  }

  return { successes, failures };
};

const formatSuccessLine = (success: RouteVerificationResult): string =>
  [
    "[ok] ",
    success.locale.padEnd(NUM_5),
    " ",
    String(success.status),
    " ",
    success.route.padEnd(NUM_26),
    " ",
    success.heading,
    " | ",
    success.title,
  ].join("");

const formatFailureLine = (failure: RouteVerificationFailure): string =>
  [
    "[fail] ",
    failure.locale.padEnd(NUM_5),
    " ",
    String(failure.status),
    " ",
    failure.route.padEnd(NUM_26),
    " ",
    failure.reason,
  ].join("");

const writeRouteSummary = async (
  successes: RouteVerificationResult[],
  failures: RouteVerificationFailure[],
): Promise<void> => {
  const summaryHeader = ["Route/content verification against ", VERIFY_BASE_URL].join("");
  await writeOutput(summaryHeader);
  await writeOutput(LINE_SEPARATOR);

  const successLines = successes.map(formatSuccessLine);
  if (successLines.length > 0) {
    await writeOutput(successLines.join("\n"));
  }

  if (failures.length === 0) {
    await writeOutput(LINE_SEPARATOR);
    const verifiedMessage = [
      "Verified ",
      String(successes.length),
      " localized route renders with non-empty page title, heading, and main landmark.",
    ].join("");
    await writeOutput(verifiedMessage);
    return;
  }

  await writeError(LINE_SEPARATOR);
  await writeError("Route/content verification failures:");
  await writeError(failures.map(formatFailureLine).join("\n"));
  process.exit(1);
};

const runWithManagedPreview = async (): Promise<void> => {
  const buildReady = await ensureClientBuildExists();
  if (!buildReady) {
    await writeError("Unable to build the client preview required for verify:pages.");
    process.exit(1);
  }

  const previewProcess = spawnPreviewProcess();
  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  const stdoutTask = readPreviewLogs(previewProcess.stdout, stdoutLines);
  const stderrTask = readPreviewLogs(previewProcess.stderr, stderrLines);

  const ready = await waitForPreviewReady(VERIFY_BASE_URL);
  if (!ready) {
    previewProcess.kill();
    await Promise.all([stdoutTask, stderrTask]);
    await writeError("Nuxt preview did not become ready before timeout.");
    const combinedLogs = [...stdoutLines, ...stderrLines];
    if (combinedLogs.length > 0) {
      await writeError(combinedLogs.join("\n"));
    }
    process.exit(1);
  }

  const { successes, failures } = await verifyRoutes();
  previewProcess.kill();
  await Promise.all([stdoutTask, stderrTask]);
  await writeRouteSummary(successes, failures);
};

const main = async (): Promise<void> => {
  if (EXTERNAL_VERIFY_BASE_URL) {
    const { successes, failures } = await verifyRoutes();
    await writeRouteSummary(successes, failures);
    return;
  }

  await runWithManagedPreview();
};

await main();
