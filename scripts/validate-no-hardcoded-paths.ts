import { APP_ROUTES } from "../packages/shared/src/constants/routes";

type ViolationCategory = "route" | "api";

type Violation = {
  filePath: string;
  line: number;
  literal: string;
  category: ViolationCategory;
};

const projectRoot = process.cwd();
const clientRoot = "packages/client";
const allowedExtensions = new Set([".ts", ".tsx", ".vue", ".js", ".mjs", ".cjs"]);
const ignoredDirectoryNames = new Set([
  "node_modules",
  ".git",
  ".nuxt",
  ".output",
  "dist",
  "dist-types",
  "coverage",
]);
const ignoredPathSegments = new Set(["locales"]);
const routeAllowList = new Set<string>(["packages/client/nuxt.config.ts"]);
const apiAllowList = new Set<string>(["packages/client/nuxt.config.ts"]);
const appRouteLiterals = Object.values(APP_ROUTES).filter((route) => route !== "/");
const hardcodedApiLiteralPattern = /(["'])\/api(?:\/[^"']+)?\1/gu;

const hasAllowedExtension = (pathValue: string): boolean => {
  const normalized = pathValue.toLowerCase();
  for (const extension of allowedExtensions) {
    if (normalized.endsWith(extension)) {
      return true;
    }
  }
  return false;
};

const shouldIgnorePath = (pathValue: string): boolean =>
  pathValue
    .split("/")
    .some((segment) => ignoredDirectoryNames.has(segment) || ignoredPathSegments.has(segment));

const getLineFromOffset = (text: string, offset: number): number => {
  if (offset <= 0) {
    return 1;
  }
  let line = 1;
  for (let index = 0; index < offset; index += 1) {
    if (text.charCodeAt(index) === 10) {
      line += 1;
    }
  }
  return line;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const collectClientFiles = async (): Promise<string[]> => {
  const files: string[] = [];
  const glob = new Bun.Glob(`${clientRoot}/**/*`);
  for await (const relativeFilePath of glob.scan({ cwd: projectRoot, onlyFiles: true })) {
    const normalizedPath = relativeFilePath.replace(/\\/gu, "/");
    if (!hasAllowedExtension(normalizedPath) || shouldIgnorePath(normalizedPath)) {
      continue;
    }
    files.push(normalizedPath);
  }
  return files;
};

const collectRouteViolations = (filePath: string, content: string): Violation[] => {
  if (routeAllowList.has(filePath)) {
    return [];
  }
  const violations: Violation[] = [];
  for (const routeLiteral of appRouteLiterals) {
    const routePattern = new RegExp(`(["'])${escapeRegExp(routeLiteral)}\\1`, "gu");
    for (const match of content.matchAll(routePattern)) {
      violations.push({
        filePath,
        line: getLineFromOffset(content, match.index ?? 0),
        literal: routeLiteral,
        category: "route",
      });
    }
  }
  return violations;
};

const collectApiViolations = (filePath: string, content: string): Violation[] => {
  if (apiAllowList.has(filePath)) {
    return [];
  }
  const violations: Violation[] = [];
  hardcodedApiLiteralPattern.lastIndex = 0;
  for (const match of content.matchAll(hardcodedApiLiteralPattern)) {
    violations.push({
      filePath,
      line: getLineFromOffset(content, match.index ?? 0),
      literal: match[0],
      category: "api",
    });
  }
  return violations;
};

const collectViolations = async (): Promise<Violation[]> => {
  const files = await collectClientFiles();
  const violations: Violation[] = [];
  for (const filePath of files) {
    const fileContent = await Bun.file(filePath).text();
    violations.push(...collectRouteViolations(filePath, fileContent));
    violations.push(...collectApiViolations(filePath, fileContent));
  }
  return violations;
};

const main = async (): Promise<void> => {
  const violations = await collectViolations();
  if (violations.length === 0) {
    process.stdout.write(
      "Hardcoded path validation passed: client routes and API endpoints use shared constants.\n",
    );
    return;
  }

  process.stderr.write("Hardcoded path validation failed:\n");
  for (const violation of violations) {
    const reason =
      violation.category === "route"
        ? "Use APP_ROUTES/APP_ROUTE_BUILDERS instead of a route literal."
        : "Use API_ENDPOINTS/builders instead of a hardcoded /api path literal.";
    process.stderr.write(
      `- ${violation.filePath}:${violation.line} ${violation.literal} ${reason}\n`,
    );
  }
  process.exit(1);
};

await main();
