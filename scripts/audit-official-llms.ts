const LINE_BREAK_PATTERN = /\r?\n/;

const LLM_SOURCES = [
  {
    name: "Elysia",
    url: "https://elysiajs.com/llms.txt",
    requiredMarkers: [
      "Ergonomic Framework for Humans",
      "Essential",
      "Best Practice - ElysiaJS",
    ],
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
};

const countLines = (text: string): number =>
  text.length === 0 ? 0 : text.split(LINE_BREAK_PATTERN).length;

const auditSource = async (source: LlmSource): Promise<SourceAudit> => {
  const response = await fetch(source.url, { redirect: "follow" });
  const content = await response.text();
  const missingMarkers = source.requiredMarkers.filter((marker) => !content.includes(marker));

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
  };
};

const createFetchErrorAudit = (source: LlmSource, reason: unknown): SourceAudit => ({
  name: source.name,
  url: source.url,
  finalUrl: source.url,
  statusCode: 0,
  ok: false,
  redirected: false,
  lineCount: 0,
  contentLength: 0,
  missingMarkers: [...source.requiredMarkers],
  fetchError: String(reason),
});

const formatResult = (audit: SourceAudit): string => {
  const statusToken = audit.ok ? "PASS" : "FAIL";
  const markerStatus =
    audit.missingMarkers.length === 0
      ? "markers=ok"
      : `markers=missing(${audit.missingMarkers.join(" | ")})`;
  const errorStatus = audit.fetchError ? `error=${audit.fetchError}` : "error=none";

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
    : createFetchErrorAudit(LLM_SOURCES[index], result.reason),
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
