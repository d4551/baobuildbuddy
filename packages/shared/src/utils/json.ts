import type { z } from "zod";

/**
 * JSON parsing utilities. Uses a minimal try-catch only in this shared utility
 * so application code can avoid try-catch blocks.
 */

/**
 * Safely parses JSON without throwing. Returns null on invalid input.
 */
export function safeParseJson<T = unknown>(json: string): T | null {
  if (typeof json !== "string" || json.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Parses JSON and validates with a Zod schema. Returns null on parse or validation failure.
 */
export function parseJson<T>(json: string, schema: z.ZodType<T>): T | null {
  const parsed = safeParseJson(json);
  if (parsed === null) return null;
  const result = schema.safeParse(parsed);
  return result.success ? result.data : null;
}
