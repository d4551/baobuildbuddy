const LINE_BREAK_PATTERN = /\r?\n/;
const FETCH_TIMEOUT_MS = 8_000;
const FETCH_RETRY_COUNT = 3;

const LLM_SOURCES = [
  {
    name: "Elysia",
    url: "https://elysiajs.com/llms.txt",
    requiredMarkers: ["Ergonomic Framework for Humans", "Essential", "Best Practice - ElysiaJS"],
  },
  {
    name: "Nuxt",
    url: "https://nuxt.com/llms.txt",
    requiredMarkers: ["Nuxt v4 Documentation", "useAsyncData", "useFetch"],
  },
  {
    name: "Bun",
    url: "https://bun.sh/llms.txt",
    requiredMarkers: ["# Bun", "Welcome to Bun", "bun install"],
  },
  {
    name: "daisyUI",
    url: "https://daisyui.com/llms.txt",
    requiredMarkers: ["daisyUI 5", "btn", "card", "drawer"],
  },
] as const;

type LlmSource = (typeof LLM_SOURCES)[number];

type SourceAudit = {
  name: string;
  url: string;
  finalUrl: string;
  statusCode: number;
  ok: boolean;
  redirected: boolean;
  lineCount: number;
  contentLength: number;
  missingMarkers: string[];
  fetchError: string | null;
  failureClass: "none" | "timeout" | "network" | "http" | "marker" | "unknown";
  attempts: number;
};

const countLines = (text: string): number =>
  text.length === 0 ? 0 : text.split(LINE_BREAK_PATTERN).length;

const classifyFetchError = (reason: string): SourceAudit["failureClass"] => {
  if (reason.toLowerCase().includes("timeout")) {
    return "timeout";
  }
  if (
    reason.toLowerCase().includes("network") ||
    reason.toLowerCase().includes("fetch") ||
    reason.toLowerCase().includes("dns")
  ) {
    return "network";
  }
  return "unknown";
};

const auditResponse = async (
  source: LlmSource,
  attempts: number,
  response: Response,
): Promise<SourceAudit> => {
  const content = await response.text();
  const missingMarkers = source.requiredMarkers.filter((marker) => !content.includes(marker));
  let failureClass: "http" | "marker" | "none" = "none";
  if (!response.ok) {
    failureClass = "http";
  } else if (missingMarkers.length > 0) {
    failureClass = "marker";
  }

  return {
    name: source.name,
    url: source.url,
    finalUrl: response.url,
    statusCode: response.status,
    ok: response.ok && missingMarkers.length === 0,
    redirected: response.url !== source.url,
    lineCount: countLines(content),
    contentLength: content.length,
    missingMarkers,
    fetchError: null,
    failureClass,
    attempts,
  };
};

const createFetchErrorAudit = (
  source: LlmSource,
  reason: unknown,
  attempts: number,
): SourceAudit => {
  const errorMessage = String(reason);

  return {
    name: source.name,
    url: source.url,
    finalUrl: source.url,
    statusCode: 0,
    ok: false,
    redirected: false,
    lineCount: 0,
    contentLength: 0,
    missingMarkers: [...source.requiredMarkers],
    fetchError: errorMessage,
    failureClass: classifyFetchError(errorMessage),
    attempts,
  };
};

const attemptAudit = async (source: LlmSource, attempts: number): Promise<SourceAudit> => {
  const result = await Promise.allSettled([
    fetch(source.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    }),
  ]);
  const fetchResult = result[0];

  if (fetchResult.status === "rejected") {
    return createFetchErrorAudit(source, fetchResult.reason, attempts);
  }

  return auditResponse(source, attempts, fetchResult.value);
};

const auditSource = async (source: LlmSource, attempts = 1): Promise<SourceAudit> => {
  const audit = await attemptAudit(source, attempts);
  if (
    attempts >= FETCH_RETRY_COUNT ||
    audit.failureClass === "none" ||
    audit.failureClass === "marker"
  ) {
    return audit;
  }

  return auditSource(source, attempts + 1);
};

const formatResult = (audit: SourceAudit): string => {
  const statusToken = audit.ok ? "PASS" : "FAIL";
  const markerStatus =
    audit.missingMarkers.length === 0
      ? "markers=ok"
      : `markers=missing(${audit.missingMarkers.join(" | ")})`;
  const errorStatus = audit.fetchError ? `error=${audit.fetchError}` : "error=none";
  const failureStatus = `failureClass=${audit.failureClass}`;
  const attemptStatus = `attempts=${audit.attempts}`;

  return [
    `[${statusToken}]`,
    audit.name,
    `source=${audit.url}`,
    `final=${audit.finalUrl}`,
    `status=${audit.statusCode}`,
    `redirected=${audit.redirected}`,
    `lines=${audit.lineCount}`,
    `bytes=${audit.contentLength}`,
    markerStatus,
    failureStatus,
    attemptStatus,
    errorStatus,
  ].join(" ");
};

const writeLine = (line: string): void => {
  process.stdout.write(`${line}\n`);
};

const settledAudits = await Promise.allSettled(LLM_SOURCES.map((source) => auditSource(source)));
const audits: SourceAudit[] = settledAudits.map((result, index) =>
  result.status === "fulfilled"
    ? result.value
    : createFetchErrorAudit(LLM_SOURCES[index], result.reason, FETCH_RETRY_COUNT),
);

writeLine("Official llms.txt audit results");
for (const audit of audits) {
  writeLine(formatResult(audit));
}

const failedAudits = audits.filter((audit) => !audit.ok);
writeLine(
  failedAudits.length === 0
    ? "Summary: all official llms.txt sources are reachable and contain required markers."
    : `Summary: ${failedAudits.length} source(s) failed validation.`,
);

if (failedAudits.length > 0) {
  process.exitCode = 1;
}

export {};
