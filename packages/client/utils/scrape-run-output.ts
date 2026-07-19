import { isRecord } from "@bao/shared/utils/type-guards";

const readNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

/**
 * Reads scrape pipeline error strings from an automation run output payload.
 * Supports both RPA `error` string fields and scrape aggregator `errors[]`.
 */
export function readScrapeOutputErrors(output: unknown): readonly string[] {
  if (!isRecord(output)) {
    return [];
  }

  const collected: string[] = [];
  const singular = readNonEmptyString(output.error);
  if (singular) {
    collected.push(singular);
  }

  if (Array.isArray(output.errors)) {
    for (const entry of output.errors) {
      const message = readNonEmptyString(entry);
      if (message) {
        collected.push(message);
      }
    }
  }

  return collected;
}

/**
 * Reads scraped/upserted counts when present on scrape output.
 */
export function readScrapeOutputCounts(output: unknown): {
  readonly scraped: number | null;
  readonly upserted: number | null;
} {
  if (!isRecord(output)) {
    return { scraped: null, upserted: null };
  }
  return {
    scraped: typeof output.scraped === "number" ? output.scraped : null,
    upserted: typeof output.upserted === "number" ? output.upserted : null,
  };
}

/**
 * True when the completed scrape should surface as an error in the hub UI:
 * non-zero exit, aborted/timed out, or output errors with zero scraped rows.
 */
export function isFailedScrapeRun(input: {
  readonly aborted?: boolean | null;
  readonly exitCode?: number | null;
  readonly output: unknown;
  readonly timedOut?: boolean | null;
}): boolean {
  if (input.aborted === true || input.timedOut === true) {
    return true;
  }
  if (typeof input.exitCode === "number" && input.exitCode !== 0) {
    return true;
  }
  const errors = readScrapeOutputErrors(input.output);
  if (errors.length === 0) {
    return false;
  }
  const counts = readScrapeOutputCounts(input.output);
  if (counts.scraped === null && counts.upserted === null) {
    return true;
  }
  return (counts.scraped ?? 0) === 0 && (counts.upserted ?? 0) === 0;
}
