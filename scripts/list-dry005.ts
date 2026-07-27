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

const findings = raw.findings.filter(isObject).filter((f) => f.severity === "error");
const dry005 = findings.filter((f) => f.rule === "DRY005");
const lines = dry005.map(
  (f) =>
    (typeof f.file === "string" ? f.file : "") +
    ":" +
    String(typeof f.line === "number" ? f.line : 0) +
    " — " +
    (typeof f.excerpt === "string" ? f.excerpt : ""),
);
await writeOutput(lines.join("\n"));
