import enUSCatalog from "../packages/client/locales/en-US";
import { type JsonValue, safeParseJson } from "../packages/shared/src/utils/json";
import {
  collectProjectFileEntries,
  reportViolations,
  type ValidationViolation,
} from "./utils/validation-helpers";

/**
 * Dead i18n key detector — flags en-US catalog leaf keys that are never
 * referenced as quoted string literals in any consumer (components, pages,
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
 *
 * Allowlist hygiene is gated too: exact-key entries must carry a structured
 * `expires` date, expired entries fail, entries whose key is now literally
 * consumed fail as stale (the consumer got wired — prune the entry), duplicate
 * entries fail, and the total entry count is ratchet-capped at
 * MAX_ALLOWLIST_ENTRIES (may only shrink).
 */

type CatalogNode =
  | string
  | number
  | boolean
  | readonly CatalogNode[]
  | { readonly [key: string]: CatalogNode };

/** Client UI + shared constants that hold i18n key literals (e.g. ai-voice). */
const CONSUMER_SCAN_ROOTS = ["packages/client", "packages/shared"] as const;

/**
 * Definition directory for the en-US base + override catalogs — these DEFINE
 * keys, they do not consume them, so they are excluded from the consumer
 * corpus to avoid self-reference false negatives.
 */
const LOCALE_DEFINITION_DIR = "packages/client/locales/";

const isLocaleDefinition = (filePath: string): boolean =>
  filePath.startsWith(LOCALE_DEFINITION_DIR);

const ALLOWLIST_PATH = "scripts/no-dead-i18n-keys-allowlist.json";

/**
 * Ratchet check for the real on-disk allowlist.
 *
 * Deliberately not part of `lintAllowlist`: that function lints entry *semantics*
 * (expiry, staleness, duplicates) and is the unit-test seam, so tests inject
 * synthetic allowlists. Enforcing a size cap there made every semantics test fail
 * the moment the cap reached zero, which would have pressured the cap back up.
 */
const lintAllowlistSize = (allowlist: readonly AllowlistEntry[]): ValidationViolation[] =>
  allowlist.length > MAX_ALLOWLIST_ENTRIES
    ? [
        allowlistViolation(
          `Allowlist has ${allowlist.length} entries, above the ratchet cap of ${MAX_ALLOWLIST_ENTRIES}. Prune entries; the cap may only shrink.`,
        ),
      ]
    : [];

/**
 * Allowlist size ratchet: the entry count may never exceed this ceiling.
 * Lower the constant whenever entries are pruned; never raise it.
 *
 * Now zero. The allowlist previously held 247 entries sharing one boilerplate
 * reason ("dynamic or deferred consumers"), which disabled this gate wholesale and
 * concealed abandoned namespaces, superseded designs, and genuinely unwired UI —
 * a resume preview that never rendered GitHub links, and unnamed loading regions.
 * Every entry was resolved by wiring the consumer or deleting the copy, so any new
 * entry must now justify itself against an empty baseline.
 */
const MAX_ALLOWLIST_ENTRIES = 0;

const EXPIRES_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

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
  readonly expires?: string;
};

const isAllowlistEntry = (value: JsonValue): value is AllowlistEntry => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value;
  if (typeof record.key !== "string" || typeof record.reason !== "string") {
    return false;
  }
  return record.expires === undefined || typeof record.expires === "string";
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

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

/**
 * A key counts as consumed only when it appears as a complete quoted string
 * literal (single, double, or backtick). Bare substring matches — comments,
 * prose, or prefixes of longer keys — do not count.
 */
const isLiterallyConsumed = (keyPath: string, corpus: string): boolean =>
  new RegExp(`["'\`]${escapeRegExp(keyPath)}["'\`]`, "u").test(corpus);

const allowlistViolation = (message: string): ValidationViolation => ({
  filePath: ALLOWLIST_PATH,
  line: 1,
  message,
});

const lintAllowlistEntry = (
  entry: AllowlistEntry,
  corpus: string,
  today: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const isWildcard = entry.key.endsWith(".*");
  if (!isWildcard && entry.expires === undefined) {
    violations.push(
      allowlistViolation(
        `Allowlist entry "${entry.key}" has no "expires" date. Exact-key debt must be time-boxed (YYYY-MM-DD).`,
      ),
    );
  }
  if (entry.expires !== undefined && !EXPIRES_PATTERN.test(entry.expires)) {
    violations.push(
      allowlistViolation(
        `Allowlist entry "${entry.key}" has malformed "expires" (need YYYY-MM-DD).`,
      ),
    );
  }
  if (entry.expires !== undefined && EXPIRES_PATTERN.test(entry.expires) && entry.expires < today) {
    violations.push(
      allowlistViolation(
        `Allowlist entry "${entry.key}" expired ${entry.expires}. Resolve the key (wire or delete) instead of extending debt.`,
      ),
    );
  }
  if (!isWildcard && isLiterallyConsumed(entry.key, corpus)) {
    violations.push(
      allowlistViolation(
        `Stale allowlist entry "${entry.key}": the key is literally consumed. Remove the entry so the gate protects it.`,
      ),
    );
  }
  return violations;
};

const lintAllowlist = (
  allowlist: readonly AllowlistEntry[],
  corpus: string,
  today: string,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const seen = new Set<string>();
  for (const entry of allowlist) {
    if (seen.has(entry.key)) {
      violations.push(allowlistViolation(`Duplicate allowlist entry "${entry.key}".`));
    }
    seen.add(entry.key);
    violations.push(...lintAllowlistEntry(entry, corpus, today));
  }
  return violations;
};

const collectDeadKeyViolations = (
  keyPaths: readonly string[],
  corpus: string,
  allowlist: readonly AllowlistEntry[],
  dynamicPrefixes: ReadonlySet<string>,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  for (const keyPath of keyPaths) {
    if (matchesAllowlist(keyPath, allowlist)) {
      continue;
    }
    if (isLiterallyConsumed(keyPath, corpus)) {
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

const collectViolations = async (): Promise<ValidationViolation[]> => {
  const referenceKeys = collectLeafPaths(enUSCatalog);
  const allowlist = await loadAllowlist();

  const consumerFiles = (
    await collectProjectFileEntries({
      scanRoots: [...CONSUMER_SCAN_ROOTS],
    })
  ).filter((entry) => !isLocaleDefinition(entry.filePath));

  // Single concatenated corpus: a key is "consumed" if its dotted path appears
  // as a quoted string literal, OR its prefix is dynamically interpolated.
  // `t("a.b.c")` and a constants file holding `c: "a.b.c"` surface the literal
  // path string; `t(`a.b.${x}`)` surfaces a dynamic prefix `a.b`.
  const corpus = consumerFiles.map((entry) => entry.content).join("\n");
  const today = new Date().toISOString().slice(0, 10);
  return [...lintAllowlistSize(allowlist), ...findDeadKeys(referenceKeys, corpus, allowlist, today)];
};

/**
 * Pure dead-key detector — given key paths, a consumer corpus, an allowlist,
 * and today's date (YYYY-MM-DD), returns violations for keys that are neither
 * literally consumed, dynamically prefixed, nor allowlisted, plus violations
 * for allowlist hygiene (oversize, duplicates, missing/malformed/expired
 * `expires`, stale entries). Extracted for testing.
 */
const findDeadKeys = (
  keyPaths: readonly string[],
  corpus: string,
  allowlist: readonly AllowlistEntry[],
  today: string,
): ValidationViolation[] => {
  const dynamicPrefixes = collectDynamicPrefixes(corpus);
  return [
    ...lintAllowlist(allowlist, corpus, today),
    ...collectDeadKeyViolations(keyPaths, corpus, allowlist, dynamicPrefixes),
  ];
};

if (import.meta.main) {
  await reportViolations(
    "Dead i18n key validation failed:",
    await collectViolations(),
    "Dead i18n key validation passed.",
  );
}

export { collectLeafPaths, collectViolations, findDeadKeys };
