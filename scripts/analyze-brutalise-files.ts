import { readFileSync } from "node:fs";
import {
  safeParseJson,
  type JsonArray,
  type JsonObject,
  type JsonValue,
} from "../packages/shared/src/utils/json";
import { writeOutput } from "./utils/cli-output";

const isObject = (v: JsonValue): v is JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isArray = (v: JsonValue): v is JsonArray => Array.isArray(v);

const raw = safeParseJson(readFileSync("/tmp/brutalise-result.json", "utf8"));
if (!isObject(raw) || !isArray(raw.findings)) {
  await writeOutput("bad result");
  process.exit(1);
}

type Finding = { rule: string; file: string; line: number; severity: string; excerpt: string };
const findings: Finding[] = raw.findings.filter(isObject).map((f) => ({
  rule: typeof f.rule === "string" ? f.rule : "",
  file: typeof f.file === "string" ? f.file : "",
  line: typeof f.line === "number" ? f.line : 0,
  severity: typeof f.severity === "string" ? f.severity : "",
  excerpt: typeof f.excerpt === "string" ? f.excerpt : "",
}));

const errors = findings.filter((f) => f.severity === "error");

// Group by rule → file
const byRuleFile = new Map<string, Map<string, number>>();
for (const f of errors) {
  if (!byRuleFile.has(f.rule)) byRuleFile.set(f.rule, new Map());
  const fileMap = byRuleFile.get(f.rule);
  if (fileMap) fileMap.set(f.file, (fileMap.get(f.file) ?? 0) + 1);
}

/** Worst-offender files listed per rule. */
const TOP_FILES_PER_RULE = 8;

const lines: string[] = [];
for (const [rule, fileMap] of byRuleFile) {
  const sorted = [...fileMap.entries()].sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((sum, entry) => sum + entry[1], 0);
  lines.push(`=== ${rule} (${String(total)} errors) ===`);
  for (const [file, count] of sorted.slice(0, TOP_FILES_PER_RULE)) {
    lines.push(`  ${String(count)}x ${file}`);
  }
}

await writeOutput(lines.join("\n"));
