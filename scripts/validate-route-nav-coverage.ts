import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APP_ROUTES } from "../packages/shared/src/constants/routes";
import { safeParseJson, type JsonValue } from "../packages/shared/src/utils/json";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";

/**
 * Route ↔ nav coverage gate — every static page must have an **exact** nav registry
 * entry (primary or secondary) or an explicit headless allowlist decl.
 *
 * Soft parent-prefix coverage is banned: child workflows must be registered so
 * breadcrumbs and discoverability stay honest.
 *
 * Exceptions (headless by design):
 * - `definePageMeta({ redirect })` — redirect-only, no own surface
 * - Dynamic children (`[id].vue`, `[slug].vue`) — reached via parent list + builders
 * - Explicit allowlist `scripts/route-nav-coverage-allowlist.json` with reason
 */

const PAGES_DIR = "packages/client/pages";
const NAV_FILES = [
  "packages/client/constants/navigation.ts",
  "packages/client/constants/navigation-secondary.ts",
] as const;
const ALLOWLIST_PATH = "scripts/route-nav-coverage-allowlist.json";

const DYNAMIC_SEGMENT_PATTERN = /\[([a-zA-Z0-9_-]+)\]/u;
const REDIRECT_PATTERN = /definePageMeta\s*\(\s*\{[^}]*redirect\b/su;
const TO_PATTERN = /to:\s*APP_ROUTES\.(\w+)/gu;
const VUE_EXTENSION_PATTERN = /\.vue$/u;
const MULTIPLE_SLASH_PATTERN = /\/{2,}/gu;
const TRAILING_SLASH_PATTERN = /\/$/u;

type RouteAllowlistEntry = {
  readonly route: string;
  readonly reason: string;
};

const isRouteAllowlistEntry = (value: JsonValue): value is RouteAllowlistEntry => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const route = value.route;
  const reason = value.reason;
  return typeof route === "string" && typeof reason === "string";
};

const loadAllowlist = async (): Promise<RouteAllowlistEntry[]> => {
  const file = Bun.file(ALLOWLIST_PATH);
  if (!(await file.exists())) {
    return [];
  }
  const parsed = safeParseJson(await file.text());
  if (parsed === null || !Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isRouteAllowlistEntry);
};

const collectNavPaths = (): Set<string> => {
  const paths = new Set<string>();
  for (const navFile of NAV_FILES) {
    const content = readFileSync(resolve(process.cwd(), navFile), "utf-8");
    TO_PATTERN.lastIndex = 0;
    for (const match of content.matchAll(TO_PATTERN)) {
      const key = match[1];
      if (key && key in APP_ROUTES) {
        const value = APP_ROUTES[key as keyof typeof APP_ROUTES];
        if (typeof value === "string") {
          paths.add(value);
        }
      }
    }
  }
  return paths;
};

const collectPageRoutes = async (): Promise<
  Array<{ filePath: string; route: string; isRedirect: boolean; isDynamic: boolean }>
> => {
  const glob = new Bun.Glob(`${PAGES_DIR}/**/*.vue`);
  const files = await Array.fromAsync(glob.scan({ cwd: process.cwd(), onlyFiles: true }));
  return files.map((filePath) => {
    const normalized = filePath.replace(/\\/gu, "/");
    const relative = normalized.slice(PAGES_DIR.length + 1);
    const withoutExt = relative.replace(VUE_EXTENSION_PATTERN, "");
    const segments = withoutExt.split("/").map((segment) => {
      const dynamicMatch = segment.match(DYNAMIC_SEGMENT_PATTERN);
      if (dynamicMatch) {
        return `:${dynamicMatch[1]}`;
      }
      if (segment === "index") {
        return "";
      }
      return segment;
    });
    const route = `/${segments.filter((s) => s.length > 0).join("/")}`;
    const normalizedRoute =
      route === "/"
        ? "/"
        : route.replace(MULTIPLE_SLASH_PATTERN, "/").replace(TRAILING_SLASH_PATTERN, "");
    const content = readFileSync(resolve(process.cwd(), normalized), "utf-8");
    const isRedirect = REDIRECT_PATTERN.test(content);
    const isDynamic = DYNAMIC_SEGMENT_PATTERN.test(relative);
    return { filePath: normalized, route: normalizedRoute, isRedirect, isDynamic };
  });
};

const hasExactNavEntry = (pageRoute: string, navPaths: ReadonlySet<string>): boolean =>
  navPaths.has(pageRoute);

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const navPaths = collectNavPaths();
  const pages = await collectPageRoutes();
  const allowlist = await loadAllowlist();
  const allowlistRoutes = new Set(allowlist.map((entry) => entry.route));
  return findOrphanRoutes(pages, navPaths, allowlistRoutes);
};

/**
 * Pure orphan-route detector — exact nav match required for static pages.
 */
const findOrphanRoutes = (
  pages: readonly { filePath: string; route: string; isRedirect: boolean; isDynamic: boolean }[],
  navPaths: ReadonlySet<string>,
  allowlistRoutes: ReadonlySet<string>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const page of pages) {
    if (page.isRedirect) {
      continue;
    }
    if (page.isDynamic) {
      continue;
    }
    if (hasExactNavEntry(page.route, navPaths)) {
      continue;
    }
    if (allowlistRoutes.has(page.route)) {
      continue;
    }
    violations.push({
      filePath: page.filePath,
      line: 1,
      message: `Page route "${page.route}" has no exact nav registry entry, no redirect, no dynamic parent, and no allowlist decl. Register a NAVIGATION_ITEMS entry (secondary ok) or declare headless in ${ALLOWLIST_PATH}.`,
    });
  }
  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Route nav coverage validation failed:",
    await collectViolations(),
    "Route nav coverage validation passed.",
  );
}

export {
  collectNavPaths,
  collectPageRoutes,
  collectViolations,
  findOrphanRoutes,
  hasExactNavEntry,
};
