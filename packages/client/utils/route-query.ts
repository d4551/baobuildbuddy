/**
 * Canonical route query decoding — one implementation for string/array query values.
 * All pages/composables that read `route.query[...]` must use these helpers (SSOT).
 */
import type { LocationQueryValue } from "vue-router";

export type RouteQueryValue =
  | LocationQueryValue
  | LocationQueryValue[]
  | readonly LocationQueryValue[]
  | undefined;

/** Decode a single query param to a string (first array element when multi). */
export function queryValueToString(value: RouteQueryValue): string {
  if (Array.isArray(value)) {
    const [firstValue] = value;
    return typeof firstValue === "string" ? firstValue : "";
  }
  return typeof value === "string" ? value : "";
}

/** Decode a single query param to string | null when empty/missing. */
export function queryValueToOptionalString(value: RouteQueryValue): string | null {
  const decoded = queryValueToString(value);
  return decoded.length > 0 ? decoded : null;
}

/**
 * Resolve a section query against an allowlist, falling back to the default.
 * Used by Settings / Automation hub / Scraper section rails.
 */
export function resolveRouteSectionId<T extends string>(
  value: RouteQueryValue,
  isValid: (candidate: string) => candidate is T,
  defaultSection: T,
): T {
  const candidate = queryValueToOptionalString(value);
  if (candidate && isValid(candidate)) {
    return candidate;
  }
  return defaultSection;
}
