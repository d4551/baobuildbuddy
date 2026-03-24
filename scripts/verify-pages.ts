import { join } from "node:path";
import { APP_BRAND } from "../packages/shared/src/constants/branding";
import { DEFAULT_I18N_LOCALE_COOKIE_KEY } from "../packages/shared/src/constants/client-config";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import {
  DEFAULT_VERIFY_HOST,
  DEFAULT_VERIFY_PORT,
  PREVIEW_LOG_LIMIT,
  PREVIEW_POLL_INTERVAL_MS,
  PREVIEW_READY_TIMEOUT_MS,
  PREVIEW_SEPARATOR_LENGTH,
} from "../packages/shared/src/constants/scripts";
import { APP_LANGUAGE_CODES } from "../packages/shared/src/constants/settings";
import { writeError, writeOutput } from "./utils/cli-output";

type RouteVerificationResult = {
  locale: string;
  route: string;
  status: number;
  heading: string;
  title: string;
};

type RouteVerificationFailure = {
  locale: string;
  route: string;
  status: number;
  reason: string;
};

type PreviewProcess = ReturnType<typeof Bun.spawn>;

const VERIFY_HOST = process.env.VERIFY_HOST || DEFAULT_VERIFY_HOST;
const VERIFY_PORT = process.env.VERIFY_PORT || DEFAULT_VERIFY_PORT;
const DEFAULT_VERIFY_BASE_URL = `http://${VERIFY_HOST}:${VERIFY_PORT}`;
const EXTERNAL_VERIFY_BASE_URL = process.env.VERIFY_BASE_URL?.replace(/\/$/u, "") ?? null;
const VERIFY_BASE_URL = EXTERNAL_VERIFY_BASE_URL ?? DEFAULT_VERIFY_BASE_URL;
const CLIENT_PACKAGE_ROOT = join(process.cwd(), "packages", "client");
const CLIENT_BUILD_OUTPUT_PATH = join(CLIENT_PACKAGE_ROOT, ".output", "server", "index.mjs");
const htmlHeadingPattern = /<h1\b[^>]*>([\s\S]*?)<\/h1>/iu;
const htmlTitlePattern = /<title\b[^>]*>([\s\S]*?)<\/title>/iu;
const htmlMainPattern = /<main\b[^>]*>/iu;
const htmlTagPattern = /<[^>]+>/gu;
const whitespacePattern = /\s+/gu;
const lineSeparator = "-".repeat(PREVIEW_SEPARATOR_LENGTH);
const expectedBrandToken = APP_BRAND.name.toLowerCase();
const routePaths = Array.from(new Set(Object.values(APP_ROUTES)));

const normalizeText = (value: string): string =>
  value.replace(htmlTagPattern, " ").replace(whitespacePattern, " ").trim();

const createRouteFailure = (
  locale: string,
  route: string,
  status: number,
  reason: string,
): RouteVerificationFailure => ({
  locale,
  route,
  status,
  reason,
});

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
      const trailing = `${pending}${decoder.decode()}`.trim();
      if (trailing.length > 0) {
        pushBoundedLine(target, trailing);
      }
      return;
    }

    if (readResult.value.length > 0) {
      const chunk = `${pending}${decoder.decode(readResult.value, { stream: true })}`;
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

const ensureClientBuildExists = async (): Promise<boolean> => {
  const buildFile = Bun.file(CLIENT_BUILD_OUTPUT_PATH);
  if (await buildFile.exists()) {
    return true;
  }

  await writeOutput("Client build output missing; running `bun run --filter '@bao/client' build`.");
  const buildProcess = Bun.spawn([process.execPath, "run", "--filter", "@bao/client", "build"], {
    cwd: process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
  });
  const buildExitCode = await buildProcess.exited;
  return buildExitCode === 0;
};

const spawnPreviewProcess = (): PreviewProcess =>
  Bun.spawn(["bun", ".output/server/index.mjs"], {
    cwd: CLIENT_PACKAGE_ROOT,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      PORT: DEFAULT_VERIFY_PORT,
      HOST: DEFAULT_VERIFY_HOST,
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

const verifyHtmlContent = (
  locale: string,
  route: string,
  status: number,
  html: string,
): RouteVerificationResult | RouteVerificationFailure => {
  if (route === "/" && !html.toLowerCase().includes(expectedBrandToken)) {
    return createRouteFailure(
      locale,
      route,
      status,
      `Root route did not include expected brand token "${APP_BRAND.name}".`,
    );
  }

  const headingMatch = html.match(htmlHeadingPattern);
  const heading = normalizeText(headingMatch?.[1] ?? "");
  if (heading.length === 0) {
    return createRouteFailure(
      locale,
      route,
      status,
      "No non-empty <h1> heading found in SSR HTML.",
    );
  }

  const titleMatch = html.match(htmlTitlePattern);
  const title = normalizeText(titleMatch?.[1] ?? "");
  if (title.length === 0) {
    return createRouteFailure(locale, route, status, "No non-empty <title> found in SSR HTML.");
  }

  if (!htmlMainPattern.test(html)) {
    return createRouteFailure(locale, route, status, "No <main> landmark found in SSR HTML.");
  }

  return {
    locale,
    route,
    status,
    heading,
    title,
  };
};

const verifyRoute = async (
  locale: string,
  route: string,
): Promise<RouteVerificationResult | RouteVerificationFailure> => {
  const response = await fetch(`${VERIFY_BASE_URL}${route}`, {
    headers: {
      "accept-language": locale,
      cookie: `${DEFAULT_I18N_LOCALE_COOKIE_KEY}=${locale}`,
    },
  });

  if (!response.ok) {
    return createRouteFailure(
      locale,
      route,
      response.status,
      `Expected 2xx status but received ${response.status}.`,
    );
  }

  const html = await response.text();
  return verifyHtmlContent(locale, route, response.status, html);
};

const verifyRoutes = async (): Promise<{
  successes: RouteVerificationResult[];
  failures: RouteVerificationFailure[];
}> => {
  const tasks = APP_LANGUAGE_CODES.flatMap((locale) =>
    routePaths.map((route) => verifyRoute(locale, route)),
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

  return {
    successes,
    failures,
  };
};

const writeRouteSummary = async (
  successes: RouteVerificationResult[],
  failures: RouteVerificationFailure[],
): Promise<void> => {
  await writeOutput(`Route/content verification against ${VERIFY_BASE_URL}`);
  await writeOutput(lineSeparator);

  const successLines = successes.map(
    (success) =>
      `[ok] ${success.locale.padEnd(5)} ${success.status} ${success.route.padEnd(26)} ${success.heading} | ${success.title}`,
  );
  if (successLines.length > 0) {
    await writeOutput(successLines.join("\n"));
  }

  if (failures.length === 0) {
    await writeOutput(lineSeparator);
    await writeOutput(
      `Verified ${successes.length} localized route renders with non-empty page title, heading, and main landmark.`,
    );
    return;
  }

  await writeError(lineSeparator);
  await writeError("Route/content verification failures:");
  await writeError(
    failures
      .map(
        (failure) =>
          `[fail] ${failure.locale.padEnd(5)} ${failure.status} ${failure.route.padEnd(26)} ${failure.reason}`,
      )
      .join("\n"),
  );
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
