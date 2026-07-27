import { readFileSync } from "node:fs";
import {
  safeParseJson,
  type JsonArray,
  type JsonObject,
  type JsonValue,
} from "../packages/shared/src/utils/json";

const ENDPOINT = "https://brutalise-production.up.railway.app/mcp";
const CHUNK_SIZE = 80;
/** Characters of a non-JSON response body retained for debugging. */
const DEBUG_BODY_LENGTH = 2000;
/** Indentation width for the written result JSON. */
const RESULT_JSON_INDENT = 2;
/** Length of the SSE `data:` field prefix stripped from streamed frames. */
const SSE_DATA_PREFIX = "data:";

const token = Bun.argv[2] ?? "";

type Finding = {
  rule: string;
  file: string;
  line: number;
  column: number;
  severity: string;
  excerpt: string;
};

type ScanSummary = {
  totalFindings: number;
  errors: number;
  warnings: number;
  filesScanned: number;
};
type ScanResult = { pass: boolean; summary: ScanSummary; findings: Finding[]; error?: string };

const isObject = (v: JsonValue): v is JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isArray = (v: JsonValue): v is JsonArray => Array.isArray(v);
const asString = (v: JsonValue | undefined): string => (typeof v === "string" ? v : "");
const asNumber = (v: JsonValue | undefined): number => (typeof v === "number" ? v : 0);
const asBool = (v: JsonValue | undefined): boolean => v === true;

const parseFinding = (v: JsonValue): Finding | null => {
  if (!isObject(v)) return null;
  return {
    rule: asString(v.rule),
    file: asString(v.file),
    line: asNumber(v.line),
    column: asNumber(v.column),
    severity: asString(v.severity),
    excerpt: asString(v.excerpt),
  };
};

const parseScanResult = (v: JsonValue): ScanResult | null => {
  if (!isObject(v)) return null;
  const summaryRaw = v.summary;
  const findingsRaw = v.findings;
  const summary: ScanSummary = isObject(summaryRaw)
    ? {
        totalFindings: asNumber(summaryRaw.totalFindings),
        errors: asNumber(summaryRaw.errors),
        warnings: asNumber(summaryRaw.warnings),
        filesScanned: asNumber(summaryRaw.filesScanned),
      }
    : { totalFindings: 0, errors: 0, warnings: 0, filesScanned: 0 };
  const findings: Finding[] = isArray(findingsRaw)
    ? findingsRaw.map(parseFinding).filter((f): f is Finding => f !== null)
    : [];
  return {
    pass: asBool(v.pass),
    summary,
    findings,
    error: typeof v.error === "string" ? v.error : undefined,
  };
};

const payloadRaw = safeParseJson(readFileSync("/tmp/brutalise-payload.json", "utf8"));
const payloadObj = isObject(payloadRaw) ? payloadRaw : null;
const filesRaw = payloadObj?.files;
const allFiles: Array<{ path: string; content: string }> = isArray(filesRaw)
  ? filesRaw
      .filter(isObject)
      .map((f) => ({ path: asString(f.path), content: asString(f.content) }))
      .filter((f) => f.path.length > 0)
  : [];

if (allFiles.length === 0) {
  await Bun.write(
    "/tmp/brutalise-result.json",
    JSON.stringify({ pass: false, error: "empty payload" }),
  );
  process.exit(1);
}

const chunks: Array<Array<{ path: string; content: string }>> = [];
for (let i = 0; i < allFiles.length; i += CHUNK_SIZE) {
  chunks.push(allFiles.slice(i, i + CHUNK_SIZE));
}

const callBrutalise = async (
  files: Array<{ path: string; content: string }>,
): Promise<ScanResult | null> => {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "brutal_full_gate", arguments: { files } },
  });

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/json, text/event-stream",
    },
    body,
  });

  const text = await res.text();

  // MCP Streamable HTTP may return SSE (text/event-stream) — extract data: lines
  const extractJson = (raw: string): string => {
    if (raw.trimStart().startsWith("{")) return raw;
    const dataLines = raw
      .split("\n")
      .filter((line) => line.startsWith(SSE_DATA_PREFIX))
      .map((line) => line.slice(SSE_DATA_PREFIX.length).trim());
    return dataLines.join("");
  };

  const jsonText = extractJson(text);
  const parsed = safeParseJson(jsonText);
  if (!isObject(parsed)) {
    await Bun.write("/tmp/brutalise-debug.txt", text.slice(0, DEBUG_BODY_LENGTH));
    return null;
  }

  const errObj = parsed.error;
  if (isObject(errObj) && typeof errObj.message === "string") {
    return {
      pass: false,
      summary: { totalFindings: 0, errors: 1, warnings: 0, filesScanned: 0 },
      findings: [],
      error: errObj.message,
    };
  }

  const resultObj = parsed.result;
  if (!isObject(resultObj)) return null;
  const contentArr = resultObj.content;
  const firstContent = isArray(contentArr) && contentArr.length > 0 ? contentArr[0] : null;
  const contentText = isObject(firstContent) ? asString(firstContent.text) : "{}";
  return parseScanResult(safeParseJson(contentText));
};

/** Running totals accumulated across chunk scans. */
type ScanTotals = {
  findings: Finding[];
  errors: number;
  warnings: number;
  scanned: number;
  pass: boolean;
};

/**
 * Scans chunks one at a time, aborting on the first chunk that fails.
 *
 * Recursion rather than a loop: chunks must be sequential (the scanner is rate
 * limited and the run stops at the first failure), and awaiting inside a loop is
 * banned by the performance lint. Failing fast matters here — a partial scan that
 * still writes a result file would be reported as a completed audit.
 */
const scanChunks = async (index: number, totals: ScanTotals): Promise<ScanTotals> => {
  const chunk = chunks[index];
  if (chunk === undefined) {
    return totals;
  }

  const result = await callBrutalise(chunk);
  if (!result || result.error) {
    await Bun.write(
      "/tmp/brutalise-result.json",
      JSON.stringify(
        { pass: false, error: result?.error ?? "parse failure", chunk: index },
        null,
        RESULT_JSON_INDENT,
      ),
    );
    process.exit(1);
  }

  return scanChunks(index + 1, {
    findings: [...totals.findings, ...result.findings],
    errors: totals.errors + result.summary.errors,
    warnings: totals.warnings + result.summary.warnings,
    scanned: totals.scanned + result.summary.filesScanned,
    pass: totals.pass && result.pass,
  });
};

const totals = await scanChunks(0, {
  findings: [],
  errors: 0,
  warnings: 0,
  scanned: 0,
  pass: true,
});

const report = {
  pass: totals.pass && totals.errors === 0,
  summary: {
    totalFindings: totals.findings.length,
    errors: totals.errors,
    warnings: totals.warnings,
    filesScanned: totals.scanned,
    chunks: chunks.length,
  },
  findings: totals.findings,
};

await Bun.write("/tmp/brutalise-result.json", JSON.stringify(report, null, RESULT_JSON_INDENT));
