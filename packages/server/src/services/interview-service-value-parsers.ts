import { DECIMAL_RADIX } from "@bao/shared/constants/client-config";
import { safeParseJson } from "@bao/shared/utils/json";

const JSON_CODE_FENCE_PATTERN = /```(?:json)?\s*([\s\S]*?)```/i;
const JSON_ARRAY_PATTERN = /\[[\s\S]*\]/;
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;

export const toPersistedRecord = (value: object): Record<string, unknown> => {
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};

export function parseNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(min, Math.min(Math.floor(value), max));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, DECIMAL_RADIX);
    if (Number.isFinite(parsed)) {
      return Math.max(min, Math.min(parsed, max));
    }
  }

  return fallback;
}

export function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }
  return fallback;
}

export function parseString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const strings = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
  return strings.map((entry) => entry.trim());
}

export function extractJSON(text: string): string {
  if (typeof text !== "string") {
    return text;
  }

  const codeFenceMatch = text.match(JSON_CODE_FENCE_PATTERN);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1].trim();
  }

  const arrayMatch = text.match(JSON_ARRAY_PATTERN);
  if (arrayMatch) {
    return arrayMatch[0];
  }

  const objectMatch = text.match(JSON_OBJECT_PATTERN);
  if (objectMatch) {
    return objectMatch[0];
  }

  return text.trim();
}

export function safeParseJSON(payload: unknown): unknown {
  if (typeof payload !== "string") {
    return null;
  }
  return safeParseJson(extractJSON(payload));
}
