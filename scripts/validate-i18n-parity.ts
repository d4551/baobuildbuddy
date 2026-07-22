import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import enUSCatalog from "../packages/client/locales/en-US/catalog";
import esESCatalog from "../packages/client/locales/es-ES/catalog";
import frFRCatalog from "../packages/client/locales/fr-FR/catalog";
import jaJPCatalog from "../packages/client/locales/ja-JP/catalog";
import { safeParseJson, type JsonValue } from "../packages/shared/src/utils/json";
import { reportViolations, type ValidationViolation } from "./utils/validation-helpers";
import { PERCENT_MAX } from "@bao/shared/constants/numeric";
const RATIO_0_05 = 0.05;

/**
 * Locale parity gate (HARDENED):
 * 1. Compares **raw override catalogs** (not merged modules with English fallback).
 * 2. Critical namespaces must be 100% present in every locale catalog.
 * 3. Coverage % must meet-or-beat floors in scripts/i18n-coverage-floors.json (ratchet).
 *
 * Contract: docs/ssot-ledger/contract-escalation-i18n-raw.md (+ STACK-CONTRACT).
 */

type LocaleModule = Record<string, unknown>;

const CRITICAL_NAMESPACES_PATH = "scripts/i18n-critical-namespaces.json";
const COVERAGE_FLOORS_PATH = "scripts/i18n-coverage-floors.json";

const locales: Array<{ filePath: string; localeId: string; value: LocaleModule }> = [
  { filePath: "packages/client/locales/es-ES/catalog.ts", localeId: "es-ES", value: esESCatalog },
  { filePath: "packages/client/locales/fr-FR/catalog.ts", localeId: "fr-FR", value: frFRCatalog },
  { filePath: "packages/client/locales/ja-JP/catalog.ts", localeId: "ja-JP", value: jaJPCatalog },
];

const collectPaths = (value: unknown, prefix: string = ""): string[] => {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return prefix.length > 0 ? [prefix] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectPaths(entry, prefix.length > 0 ? `${prefix}.${index}` : `${index}`),
    );
  }
  if (typeof value !== "object" || value === null) {
    return prefix.length > 0 ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    collectPaths(nestedValue, prefix.length > 0 ? `${prefix}.${key}` : key),
  );
};

const loadCriticalPrefixes = (): string[] => {
  const parsed = safeParseJson(
    readFileSync(resolve(process.cwd(), CRITICAL_NAMESPACES_PATH), "utf-8"),
  );
  if (!Array.isArray(parsed)) {
    throw new Error(`${CRITICAL_NAMESPACES_PATH} must be a JSON array of key prefixes`);
  }
  return parsed.filter((entry): entry is string => typeof entry === "string");
};

type CoverageFloors = {
  readonly floors: Record<string, number>;
};

const isCoverageFloors = (value: JsonValue): value is CoverageFloors => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const floors = value.floors;
  if (typeof floors !== "object" || floors === null || Array.isArray(floors)) {
    return false;
  }
  return Object.values(floors).every((entry) => typeof entry === "number");
};

const loadCoverageFloors = (): CoverageFloors => {
  const parsed = safeParseJson(
    readFileSync(resolve(process.cwd(), COVERAGE_FLOORS_PATH), "utf-8"),
  );
  if (!isCoverageFloors(parsed)) {
    throw new Error(`${COVERAGE_FLOORS_PATH} must declare floors: Record<localeId, number>`);
  }
  return parsed;
};

const referenceKeys = new Set(collectPaths(enUSCatalog));
const criticalPrefixes = loadCriticalPrefixes();
const criticalReferenceKeys = [...referenceKeys].filter((key) =>
  criticalPrefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}.`)),
);

const isCriticalKey = (key: string): boolean =>
  criticalPrefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}.`));

const collectCoverageViolations = (
  filePath: string,
  localeId: string,
  localeKeys: Set<string>,
  floors: CoverageFloors,
): ValidationViolation[] => {
  const violations: ValidationViolation[] = [];
  const coveragePct = Number(((localeKeys.size / referenceKeys.size) * PERCENT_MAX).toFixed(1));
  const floor = floors.floors[localeId];
  if (typeof floor !== "number") {
    violations.push({
      filePath: COVERAGE_FLOORS_PATH,
      line: 1,
      message: `Missing coverage floor for locale "${localeId}".`,
    });
  } else if (coveragePct + RATIO_0_05 < floor) {
    violations.push({
      filePath,
      line: 1,
      message: `Raw catalog coverage ${coveragePct}% is below ratchet floor ${floor}% for ${localeId}.`,
    });
  }
  return violations;
};

const collectMissingCriticalKeyViolations = (
  filePath: string,
  localeKeys: Set<string>,
): ValidationViolation[] =>
  criticalReferenceKeys
    .filter((key) => !localeKeys.has(key))
    .map((key) => ({
      filePath,
      line: 1,
      message: `Missing critical raw locale key "${key}" required by en-US catalog.`,
    }));

const collectOrphanKeyViolations = (
  filePath: string,
  localeKeys: Set<string>,
): ValidationViolation[] =>
  [...localeKeys]
    .filter((key) => !referenceKeys.has(key))
    .map((key) => ({
      filePath,
      line: 1,
      message: `Orphan locale key "${key}" is not present in en-US catalog.`,
    }));

const collectViolations = (): ValidationViolation[] => {
  const floors = loadCoverageFloors();
  const violations: ValidationViolation[] = [];

  for (const { filePath, localeId, value } of locales) {
    const localeKeys = new Set(collectPaths(value));
    violations.push(...collectCoverageViolations(filePath, localeId, localeKeys, floors));
    violations.push(...collectMissingCriticalKeyViolations(filePath, localeKeys));
    violations.push(...collectOrphanKeyViolations(filePath, localeKeys));
  }

  if (criticalReferenceKeys.length === 0) {
    violations.push({
      filePath: CRITICAL_NAMESPACES_PATH,
      line: 1,
      message: "Critical namespace list matched zero en-US keys — gate would be vacuous.",
    });
  }

  return violations;
};

if (import.meta.main) {
  await reportViolations(
    "Locale parity validation failed:",
    collectViolations(),
    "Locale parity validation passed.",
  );
}

export { collectViolations, isCriticalKey };

