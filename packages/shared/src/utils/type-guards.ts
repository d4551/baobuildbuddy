/**
 * Shared type guards for runtime validation of boundary values.
 * Single source of truth — do not duplicate in composables or services.
 */
import type { JsonObject, JsonValue } from "./json";
import { safeParseJson } from "./json";

export const isRecord = <T>(v: T): v is T & JsonObject =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const asString = <T>(v: T): string | undefined =>
  typeof v === "string" && v.trim().length > 0 ? v : undefined;

export const asStringArray = <T>(v: T): string[] =>
  Array.isArray(v) ? v.filter((e): e is string => typeof e === "string") : [];

export const asNumber = <T>(v: T): number | undefined =>
  typeof v === "number" && !Number.isNaN(v) ? v : undefined;

export const asBoolean = <T>(v: T): boolean | undefined => (typeof v === "boolean" ? v : undefined);

export const asRecord = <T>(v: T): JsonObject | undefined => {
  if (typeof v !== "object" || v === null || Array.isArray(v)) {
    return undefined;
  }
  const parsed = safeParseJson(JSON.stringify(v));
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return undefined;
  }
  return parsed;
};

export const asJsonArray = <T>(v: T): JsonValue[] | undefined => {
  if (!Array.isArray(v)) {
    return undefined;
  }
  const parsed = safeParseJson(JSON.stringify(v));
  return Array.isArray(parsed) ? parsed : undefined;
};
