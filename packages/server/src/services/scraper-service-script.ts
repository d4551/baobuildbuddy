import {
  API_ERROR_INVALID_SCRAPER_JSON,
  API_ERROR_INVALID_SCRIPT_ID,
  type AutomationScriptId,
  automationScriptIdSchema,
  safeParseJson,
  scrapedJobSchema,
  scrapedStudioSchema,
  type JobSearchResult,
  type ScrapedJob,
  type ScrapedStudio,
} from "@bao/shared";
import { config } from "../config/env";
import { runAutomationScript } from "./automation/rpa-runner";
import type {
  AutomationScriptReference,
  ScriptExecutionOptions,
  ScriptInputPayload,
  ScriptReferenceOverride,
  ScriptRows,
  ScraperScriptExecutionResult,
} from "./scraper-service-contracts";
import {
  CONTENT_HASH_LENGTH,
  CONTENT_HASH_PREFIX,
  DEFAULT_JOB_POSTED_DATE,
  DEFAULT_JOB_SOURCE,
  DEFAULT_JOB_TYPE,
} from "./scraper-service-contracts";
import { generateId } from "@bao/shared";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value))
    : null;

const parseJsonRows = (raw: unknown): unknown[] => {
  if (Array.isArray(raw)) {
    return raw;
  }

  const asObject = asRecord(raw);
  if (!asObject) {
    return [];
  }

  if (Array.isArray(asObject.items)) {
    return asObject.items;
  }
  if (Array.isArray(asObject.rows)) {
    return asObject.rows;
  }

  return [raw];
};

const normalizeHashInput = (value: string | undefined): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const buildDeterministicContentHash = (row: ScrapedJob): string => {
  const canonical = [
    normalizeHashInput(row.source),
    normalizeHashInput(row.title),
    normalizeHashInput(row.company),
    normalizeHashInput(row.location),
    normalizeHashInput(row.url),
    normalizeHashInput(row.postDate),
    normalizeHashInput(row.postedDate),
    normalizeHashInput(row.description),
  ].join("|");
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(canonical);
  return `${CONTENT_HASH_PREFIX}-${hasher.digest("hex").slice(0, CONTENT_HASH_LENGTH)}`;
};

export const resolveScrapedContentHash = (row: ScrapedJob): string => {
  const normalized = row.contentHash?.trim();
  if (normalized && normalized.length > 0) {
    return normalized;
  }
  return buildDeterministicContentHash(row);
};

export const toJobSearchResult = (rows: ScrapedJob[]): JobSearchResult => ({
  jobs: rows.map((row) => ({
    id: resolveScrapedContentHash(row),
    title: row.title,
    company: row.company,
    location: row.location,
    remote: Boolean(row.remote),
    description: row.description,
    url: row.url,
    source:
      row.source?.trim() && row.source.trim().length > 0 ? row.source.trim() : DEFAULT_JOB_SOURCE,
    contentHash: resolveScrapedContentHash(row),
    postedDate: row.postDate || row.postedDate || DEFAULT_JOB_POSTED_DATE,
    type: DEFAULT_JOB_TYPE,
  })),
  total: rows.length,
  page: 1,
  limit: rows.length,
  filters: {},
});

export const resolveScriptReference = (
  scriptReference: AutomationScriptId | ScriptReferenceOverride,
): AutomationScriptReference => {
  if (typeof scriptReference !== "string") {
    return { scriptPath: scriptReference.scriptPath };
  }

  const parsed = automationScriptIdSchema.safeParse(scriptReference);
  if (!parsed.success) {
    throw new Error(API_ERROR_INVALID_SCRIPT_ID);
  }

  return { scriptId: parsed.data };
};

export const runScraperScript = async (
  scriptReference: AutomationScriptReference,
  payload: ScriptInputPayload = {},
  options: ScriptExecutionOptions = {},
): Promise<ScraperScriptExecutionResult> => {
  const execution = await runAutomationScript({
    scriptId: scriptReference.scriptId,
    scriptPath: scriptReference.scriptPath,
    scriptInput: payload,
    runId: generateId(),
    timeoutMs: options.timeoutMs ?? config.automationScriptTimeoutMs,
    signal: options.signal,
    stdoutLineLimit: config.automationStdioBufferLimit,
    stderrLineLimit: config.automationStdioBufferLimit,
  });

  if (execution.exitCode !== 0) {
    return {
      ok: false,
      error: `Script exited ${execution.exitCode}: ${execution.stderrLines.join("\n") || execution.stdoutLines.join("\n")}`,
      stderrLines: execution.stderrLines,
    };
  }

  const outputText = execution.stdoutLines.join("\n").trim();
  const parsed = safeParseJson(outputText);
  if (parsed === null && outputText !== "null") {
    return {
      ok: false,
      error: API_ERROR_INVALID_SCRAPER_JSON,
      stderrLines: execution.stderrLines,
    };
  }

  return {
    ok: true,
    parsed,
    stderrLines: execution.stderrLines,
  };
};

export const parseStudioRows = (raw: unknown): ScriptRows<ScrapedStudio> => {
  const rows = parseJsonRows(raw);
  const parsedRows: ScrapedStudio[] = [];
  const rowErrors: string[] = [];

  rows.forEach((row, index) => {
    const parsed = scrapedStudioSchema.safeParse(row);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const issuePath = issue?.path.join(".") || "root";
      rowErrors.push(`studio_row_${index}: invalid payload at ${issuePath}`);
      return;
    }
    parsedRows.push(parsed.data);
  });

  return { rows: parsedRows, rowErrors };
};

export const parseJobRows = (raw: unknown): ScriptRows<ScrapedJob> => {
  const rows = parseJsonRows(raw);
  const parsedRows: ScrapedJob[] = [];
  const rowErrors: string[] = [];

  rows.forEach((row, index) => {
    const parsed = scrapedJobSchema.safeParse(row);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const issuePath = issue?.path.join(".") || "root";
      rowErrors.push(`job_row_${index}: invalid payload at ${issuePath}`);
      return;
    }
    parsedRows.push(parsed.data);
  });

  return { rows: parsedRows, rowErrors };
};
