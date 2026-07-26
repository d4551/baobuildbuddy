import type { z } from "zod";
import { safeParseJson } from "./json";

/** Outcome of {@link parseJsonExplained}: the value, or why it could not be produced. */
export type ExplainedJsonParse<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: string };

/**
 * Validates JSON against a Zod schema and reports why it failed.
 *
 * `parseJson` collapses malformed JSON and schema violations alike to `null`, so a
 * caller can only report "invalid". That is what made a failing job-provider settings
 * save undiagnosable: the toast said "Provider configuration JSON is invalid" without
 * naming the collection or the offending field. Use this wherever the failure is shown
 * to a person.
 */
export function parseJsonExplained<T>(json: string, schema: z.ZodType<T>): ExplainedJsonParse<T> {
  const parsed = safeParseJson(json);
  if (parsed === null) {
    return { ok: false, reason: "not valid JSON" };
  }

  const result = schema.safeParse(parsed);
  if (result.success) {
    return { ok: true, value: result.data };
  }

  const [firstIssue] = result.error.issues;
  if (!firstIssue) {
    return { ok: false, reason: "failed schema validation" };
  }

  const path = firstIssue.path.join(".");
  return {
    ok: false,
    reason: path.length > 0 ? `${path}: ${firstIssue.message}` : firstIssue.message,
  };
}
