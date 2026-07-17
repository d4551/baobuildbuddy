/**
 * Codemod: Elysia 1 `.method(path, handler, hooks)` → Elysia 2 `.method(path, hooks, handler)`.
 * Also renames lifecycle hooks: onRequest→request, onAfterHandle→afterHandle,
 * onError→error, onBeforeHandle→beforeHandle.
 *
 * Usage: bun run scripts/codemod-elysia2-route-order.ts [--write]
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const WRITE = process.argv.includes("--write");
const ROOT = join(import.meta.dir, "..");
const SCAN_ROOTS = [join(ROOT, "packages/server/src")];

const HTTP_METHOD_PATTERN =
  /\.(get|post|put|patch|delete|options|head|all)\s*\(/g;
const LIFECYCLE_PATTERN = /\.(onRequest|onAfterHandle|onError|onBeforeHandle)\s*\(/g;
const LIFECYCLE_RENAMES: Record<string, string> = {
  onRequest: "request",
  onAfterHandle: "afterHandle",
  onError: "error",
  onBeforeHandle: "beforeHandle",
};

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "dist" || entry === "dist-types" || entry === "node_modules") continue;
      out.push(...collectTsFiles(full));
      continue;
    }
    if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function skipWhitespaceAndComments(text: string, index: number): number {
  let i = index;
  while (i < text.length) {
    if (/\s/.test(text[i] ?? "")) {
      i += 1;
      continue;
    }
    if (text.startsWith("//", i)) {
      const nl = text.indexOf("\n", i);
      i = nl === -1 ? text.length : nl + 1;
      continue;
    }
    if (text.startsWith("/*", i)) {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
      continue;
    }
    break;
  }
  return i;
}

function scanString(text: string, start: number): number {
  const quote = text[start];
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) {
      return i + 1;
    }
    i += 1;
  }
  return text.length;
}

function scanTemplate(text: string, start: number): number {
  let i = start + 1;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === "`") {
      return i + 1;
    }
    if (ch === "$" && text[i + 1] === "{") {
      i = scanBalanced(text, i + 1, "{", "}");
      continue;
    }
    i += 1;
  }
  return text.length;
}

function scanBalanced(text: string, start: number, open: string, close: string): number {
  let depth = 0;
  let i = start;
  while (i < text.length) {
    const ch = text[i];
    if (ch === "'" || ch === '"') {
      i = scanString(text, i);
      continue;
    }
    if (ch === "`") {
      i = scanTemplate(text, i);
      continue;
    }
    if (text.startsWith("//", i)) {
      const nl = text.indexOf("\n", i);
      i = nl === -1 ? text.length : nl + 1;
      continue;
    }
    if (text.startsWith("/*", i)) {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 2;
      continue;
    }
    if (ch === open) {
      depth += 1;
      i += 1;
      continue;
    }
    if (ch === close) {
      depth -= 1;
      i += 1;
      if (depth === 0) {
        return i;
      }
      continue;
    }
    i += 1;
  }
  return text.length;
}

type ArgSpan = { start: number; end: number; text: string };

function splitCallArgs(text: string, openParenIndex: number): ArgSpan[] | null {
  if (text[openParenIndex] !== "(") return null;
  const args: ArgSpan[] = [];
  let i = openParenIndex + 1;
  let argStart = skipWhitespaceAndComments(text, i);

  while (i < text.length) {
    i = skipWhitespaceAndComments(text, i);
    if (i >= text.length) break;
    if (text[i] === ")") {
      if (argStart < i && text.slice(argStart, i).trim().length > 0) {
        args.push({ start: argStart, end: i, text: text.slice(argStart, i) });
      }
      return args;
    }

    const tokenStart = i;
    while (i < text.length) {
      const ch = text[i];
      if (ch === "'" || ch === '"') {
        i = scanString(text, i);
        continue;
      }
      if (ch === "`") {
        i = scanTemplate(text, i);
        continue;
      }
      if (text.startsWith("//", i)) {
        const nl = text.indexOf("\n", i);
        i = nl === -1 ? text.length : nl + 1;
        continue;
      }
      if (text.startsWith("/*", i)) {
        const end = text.indexOf("*/", i + 2);
        i = end === -1 ? text.length : end + 2;
        continue;
      }
      if (ch === "(") {
        i = scanBalanced(text, i, "(", ")");
        continue;
      }
      if (ch === "{") {
        i = scanBalanced(text, i, "{", "}");
        continue;
      }
      if (ch === "[") {
        i = scanBalanced(text, i, "[", "]");
        continue;
      }
      if (ch === ",") {
        args.push({ start: tokenStart, end: i, text: text.slice(tokenStart, i) });
        i += 1;
        argStart = skipWhitespaceAndComments(text, i);
        break;
      }
      if (ch === ")") {
        args.push({ start: tokenStart, end: i, text: text.slice(tokenStart, i) });
        return args;
      }
      i += 1;
    }
  }
  return null;
}

function looksLikeObjectLiteral(argText: string): boolean {
  const trimmed = argText.trim();
  return trimmed.startsWith("{");
}

function looksLikeHandler(argText: string): boolean {
  const trimmed = argText.trim();
  if (looksLikeObjectLiteral(trimmed)) return false;
  return (
    trimmed.startsWith("async ") ||
    trimmed.startsWith("(") ||
    trimmed.startsWith("function") ||
    /^[A-Za-z_$][\w$]*$/.test(trimmed) ||
    trimmed.includes("=>")
  );
}

function transformSource(sourceText: string): { text: string; changes: number } {
  let text = sourceText;
  let changes = 0;

  // Lifecycle renames first (simple identifier replacements on call sites).
  text = text.replace(LIFECYCLE_PATTERN, (match, name: string) => {
    const renamed = LIFECYCLE_RENAMES[name];
    if (!renamed) return match;
    changes += 1;
    return `.${renamed}(`;
  });

  // Route argument swaps.
  const edits: { start: number; end: number; replacement: string }[] = [];
  HTTP_METHOD_PATTERN.lastIndex = 0;
  let match = HTTP_METHOD_PATTERN.exec(text);
  while (match) {
    const openParen = (match.index ?? 0) + match[0].length - 1;
    const args = splitCallArgs(text, openParen);
    if (args && args.length >= 3) {
      const second = args[1];
      const third = args[2];
      if (
        second &&
        third &&
        looksLikeHandler(second.text) &&
        looksLikeObjectLiteral(third.text) &&
        args.length === 3
      ) {
        edits.push({
          start: second.start,
          end: third.end,
          replacement: `${third.text}, ${second.text}`,
        });
      }
    }
    match = HTTP_METHOD_PATTERN.exec(text);
  }

  edits.sort((a, b) => b.start - a.start);
  for (const edit of edits) {
    text = text.slice(0, edit.start) + edit.replacement + text.slice(edit.end);
    changes += 1;
  }

  return { text, changes };
}

let totalFiles = 0;
let totalChanges = 0;
const changedFiles: string[] = [];

for (const root of SCAN_ROOTS) {
  if (!existsSync(root)) continue;
  for (const file of collectTsFiles(root)) {
    const original = readFileSync(file, "utf8");
    const { text, changes } = transformSource(original);
    if (changes === 0 || text === original) continue;
    totalFiles += 1;
    totalChanges += changes;
    changedFiles.push(`${relative(ROOT, file)} (${changes})`);
    if (WRITE) {
      writeFileSync(file, text);
    }
  }
}

console.log(
  JSON.stringify(
    {
      write: WRITE,
      filesChanged: totalFiles,
      edits: totalChanges,
      files: changedFiles,
    },
    null,
    2,
  ),
);
