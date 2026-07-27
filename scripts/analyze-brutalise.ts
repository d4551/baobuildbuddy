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
if (!isObject(raw)) {
  await writeOutput("bad result file");
  process.exit(1);
}

const findingsRaw = raw.findings;
if (!isArray(findingsRaw)) {
  await writeOutput("no findings array");
  process.exit(1);
}

type Finding = { rule: string; file: string; line: number; severity: string; excerpt: string };
const findings: Finding[] = findingsRaw.filter(isObject).map((f) => ({
  rule: typeof f.rule === "string" ? f.rule : "",
  file: typeof f.file === "string" ? f.file : "",
  line: typeof f.line === "number" ? f.line : 0,
  severity: typeof f.severity === "string" ? f.severity : "",
  excerpt: typeof f.excerpt === "string" ? f.excerpt : "",
}));

const errors = findings.filter((f) => f.severity === "error");
const byRule = new Map<string, { count: number; sample: Finding }>();
for (const f of errors) {
  const existing = byRule.get(f.rule);
  if (existing) {
    existing.count += 1;
  } else {
    byRule.set(f.rule, { count: 1, sample: f });
  }
}

/** Characters of the sample excerpt shown per rule. */
const EXCERPT_PREVIEW_LENGTH = 120;

const sorted = [...byRule.entries()].sort((a, b) => b[1].count - a[1].count);
const lines: string[] = [];
for (const [rule, data] of sorted) {
  const location = `${data.sample.file}:${String(data.sample.line)}`;
  const excerpt = data.sample.excerpt.slice(0, EXCERPT_PREVIEW_LENGTH);
  lines.push(`${rule} (${String(data.count)}): ${location} — ${excerpt}`);
}

await writeOutput(lines.join("\n"));
