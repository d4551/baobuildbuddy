import enUSCatalog from "../packages/client/locales/en-US";
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";
import { safeParseJson, type JsonValue } from "../packages/shared/src/utils/json";

/**
 * Dead i18n key detector — flags en-US catalog leaf keys that are never
 * referenced as string literals in any consumer (components, pages,
 * composables, utils, layouts, middleware, plugins, constants, app/error).
 *
 * Root cause this locks forward: an orphan catalog block
 * (`resumeComponentPersonalInfo`) with placeholder values ("John Doe",
 * "john@example.com", ...) shipped undetected because the parity validator
 * only checks cross-locale structure (and all locales merge the en-US base,
 * inheriting every key). This gate fails closed on dead base keys.
 *
 * Dynamic-key consumers (e.g. `t(\`apiDocs.state.${state}\`)`) are allowlisted
 * via `scripts/no-dead-i18n-keys-allowlist.json` (SSOT-declared, with the
 * dynamic prefix that is actually consumed and a justification reason).
 */

type CatalogNode =
  | string
  | number
  | boolean
  | readonly CatalogNode[]
  | { readonly [key: string]: CatalogNode };

const CONSUMER_SCAN_ROOTS = ["packages/client"] as const;

/**
 * Definition directory for the en-US base + override catalogs — these DEFINE
 * keys, they do not consume them, so they are excluded from the consumer
 * corpus to avoid self-reference false negatives.
 */
const LOCALE_DEFINITION_DIR = "packages/client/locales/";

const isLocaleDefinition = (filePath: string): boolean =>
  filePath.startsWith(LOCALE_DEFINITION_DIR);

const ALLOWLIST_PATH = "scripts/no-dead-i18n-keys-allowlist.json";

const collectLeafPaths = (value: CatalogNode, prefix = ""): string[] => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return prefix.length > 0 ? [prefix] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectLeafPaths(entry as CatalogNode, prefix.length > 0 ? `${prefix}.${index}` : `${index}`),
    );
  }
  return Object.entries(value).flatMap(([key, nestedValue]) =>
    collectLeafPaths(nestedValue, prefix.length > 0 ? `${prefix}.${key}` : key),
  );
};

type AllowlistEntry = {
  readonly key: string;
  readonly reason: string;
};

const isAllowlistEntry = (value: JsonValue): value is AllowlistEntry => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value;
  return typeof record.key === "string" && typeof record.reason === "string";
};

const loadAllowlist = async (): Promise<AllowlistEntry[]> => {
  const file = Bun.file(ALLOWLIST_PATH);
  if (!(await file.exists())) {
    return [];
  }
  const parsed = safeParseJson(await file.text());
  if (parsed === null || !Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(isAllowlistEntry);
};

const matchesAllowlist = (keyPath: string, allowlist: readonly AllowlistEntry[]): boolean => {
  for (const entry of allowlist) {
    if (entry.key === keyPath) {
      return true;
    }
    if (entry.key.endsWith(".*")) {
      const prefix = entry.key.slice(0, -2);
      if (keyPath.startsWith(`${prefix}.`)) {
        return true;
      }
    }
  }
  return false;
};

const DYNAMIC_PREFIX_PATTERNS = [
  /`([a-zA-Z0-9_.]+)\.\$\{/gu,
  /["']([a-zA-Z0-9_.]+)\.["']\s*\+\s*[a-zA-Z_]/gu,
] as const;

const collectDynamicPrefixes = (corpus: string): Set<string> => {
  const prefixes = new Set<string>();
  for (const pattern of DYNAMIC_PREFIX_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of corpus.matchAll(pattern)) {
      const prefix = match[1];
      if (prefix) {
        prefixes.add(prefix);
      }
    }
  }
  return prefixes;
};

const startsWithDynamicPrefix = (
  keyPath: string,
  dynamicPrefixes: ReadonlySet<string>,
): boolean => {
  for (const prefix of dynamicPrefixes) {
    if (keyPath.startsWith(`${prefix}.`)) {
      return true;
    }
  }
  return false;
};

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const referenceKeys = collectLeafPaths(enUSCatalog);
  const allowlist = await loadAllowlist();

  const consumerFiles = (
    await collectProjectFileEntries({
      scanRoots: [...CONSUMER_SCAN_ROOTS],
    })
  ).filter((entry) => !isLocaleDefinition(entry.filePath));

  // Single concatenated corpus: a key is "consumed" if its dotted path appears
  // as a string literal, OR its prefix is dynamically interpolated. `t("a.b.c")`
  // and a constants file holding `c: "a.b.c"` surface the literal path string;
  // `t(`a.b.${x}`)` surfaces a dynamic prefix `a.b`.
  const corpus = consumerFiles.map((entry) => entry.content).join("\n");
  return findDeadKeys(referenceKeys, corpus, allowlist);
};

/**
 * Pure dead-key detector — given key paths, a consumer corpus, and an
 * allowlist, returns violations for keys that are neither literally
 * consumed, dynamically prefixed, nor allowlisted. Extracted for testing.
 */
const findDeadKeys = (
  keyPaths: readonly string[],
  corpus: string,
  allowlist: readonly AllowlistEntry[],
): ValidationViolation[] => {
  const dynamicPrefixes = collectDynamicPrefixes(corpus);
  const violations: ValidationViolation[] = [];
  for (const keyPath of keyPaths) {
    if (matchesAllowlist(keyPath, allowlist)) {
      continue;
    }
    if (corpus.includes(keyPath)) {
      continue;
    }
    if (startsWithDynamicPrefix(keyPath, dynamicPrefixes)) {
      continue;
    }
    violations.push({
      filePath: "packages/client/locales/en-US/catalog.ts",
      line: 1,
      message: `Dead i18n key "${keyPath}" has no consumer. If consumed dynamically, add to ${ALLOWLIST_PATH} with a reason.`,
    });
  }
  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Dead i18n key validation failed:",
    await collectViolations(),
    "Dead i18n key validation passed.",
  );
}

export { collectLeafPaths, collectViolations, findDeadKeys };
