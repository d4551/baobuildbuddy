/**
 * One-shot codemod: detail: { tags: ["X"] } → openapiDetail("X", "<inferred>")
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROUTES_ROOT = join(import.meta.dir, "../packages/server/src/routes");
const DETAIL_PATTERN = /detail:\s*\{\s*tags:\s*\["([^"]+)"\]\s*,?\s*\}/gu;
const METHOD_PATH_PATTERN =
  /\.(get|post|put|patch|delete|options|head)\(\s*(?:\n\s*)?["'`]([^"'`]+)["'`]/gu;
const PATH_PARAM_PATTERN = /\{([^}]+)\}/gu;
const PATH_SEPARATOR_PATTERN = /[-_/]+/gu;
const LEADING_SLASH_PATTERN = /^\//u;
const QUOTE_PATTERN = /"/gu;

const verbPhrase = (method: string): string => {
  switch (method.toLowerCase()) {
    case "get":
      return "Retrieve";
    case "post":
      return "Create or execute";
    case "put":
      return "Replace";
    case "patch":
      return "Update";
    case "delete":
      return "Delete";
    default:
      return "Invoke";
  }
};

const humanizePath = (path: string): string => {
  const cleaned = path
    .replace(LEADING_SLASH_PATTERN, "")
    .replace(PATH_PARAM_PATTERN, "$1")
    .replace(PATH_SEPARATOR_PATTERN, " ")
    .trim();
  return cleaned.length > 0 ? cleaned : "resource";
};

const inferDescription = (tag: string, method: string, path: string): string => {
  const action = verbPhrase(method);
  const target = humanizePath(path);
  return `${action} ${tag.toLowerCase()} ${target} for BaoBuildBuddy career automation.`;
};

const nearestMethodPath = (
  content: string,
  detailIndex: number,
): { method: string; path: string } => {
  METHOD_PATH_PATTERN.lastIndex = 0;
  let best: { method: string; path: string; index: number } | null = null;
  let match: RegExpExecArray | null = METHOD_PATH_PATTERN.exec(content);
  while (match) {
    const index = match.index;
    if (index < detailIndex && (best === null || index > best.index)) {
      best = { method: match[1] ?? "get", path: match[2] ?? "/", index };
    }
    match = METHOD_PATH_PATTERN.exec(content);
  }
  return best ?? { method: "get", path: "/" };
};

const ensureImport = (content: string): string => {
  if (content.includes("openapiDetail")) {
    return content;
  }
  const importLine = 'import { openapiDetail } from "../utils/openapi-detail";\n';
  const lastImport = content.lastIndexOf("\nimport ");
  if (lastImport === -1) {
    return `${importLine}${content}`;
  }
  const endOfLine = content.indexOf("\n", lastImport + 1);
  const insertAt = endOfLine === -1 ? content.length : endOfLine + 1;
  return `${content.slice(0, insertAt)}${importLine}${content.slice(insertAt)}`;
};

const transformFile = async (filePath: string): Promise<number> => {
  const original = await readFile(filePath, "utf8");
  if (!DETAIL_PATTERN.test(original)) {
    return 0;
  }
  DETAIL_PATTERN.lastIndex = 0;
  let count = 0;
  const next = original.replace(DETAIL_PATTERN, (_full, tag: string, offset: number) => {
    count += 1;
    const { method, path } = nearestMethodPath(original, offset);
    const description = inferDescription(tag, method, path).replace(QUOTE_PATTERN, "'");
    return `detail: openapiDetail("${tag}", "${description}")`;
  });
  if (count === 0) {
    return 0;
  }
  await writeFile(filePath, ensureImport(next), "utf8");
  return count;
};

const walkTs = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        return walkTs(full);
      }
      if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) {
        return [full];
      }
      return [] as string[];
    }),
  );
  return nested.flat();
};

const main = async (): Promise<void> => {
  const files = await walkTs(ROUTES_ROOT);
  const appPath = join(import.meta.dir, "../packages/server/src/app.ts");
  files.push(appPath);
  await Promise.all(files.map((file) => transformFile(file)));
};

await main();
