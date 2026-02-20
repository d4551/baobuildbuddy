/**
 * Shared type guards for runtime validation of unknown values.
 * Single source of truth — do not duplicate in composables or services.
 */

export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const asString = (v: unknown): string | undefined =>
  typeof v === "string" && v.trim().length > 0 ? v : undefined;

export const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((e): e is string => typeof e === "string") : [];

export const asNumber = (v: unknown): number | undefined =>
  typeof v === "number" && !Number.isNaN(v) ? v : undefined;

export const asBoolean = (v: unknown): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;

export const asRecord = (v: unknown): Record<string, unknown> | undefined =>
  isRecord(v) ? v : undefined;

export const asUnknownArray = (v: unknown): unknown[] | undefined =>
  Array.isArray(v) ? v : undefined;
