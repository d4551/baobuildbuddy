import { describe, expect, test } from "bun:test";
import type { ScraperOperationResult } from "@bao/shared/types/jobs";
import { resolveScrapeRunOutcome } from "./automation-scrape-run";

/**
 * Regression cover for a false green found by running the real scrape endpoint: a
 * `jobs_hitmarker` run returned `scraped: 0` with
 * `errors: ["Missing enabled hitmarker portal fallbackUrl."]` and was still recorded
 * as `status: "success"`, `exitCode: 0`. Run history showed a misconfigured target as
 * a clean success, and no test asserted the recorded status at all.
 */

const buildResult = (overrides: Partial<ScraperOperationResult>): ScraperOperationResult => ({
  scraped: 0,
  upserted: 0,
  errors: [],
  enrichment: { enabled: true, enrichedRecords: 0, warnings: [] },
  ...overrides,
});

describe("resolveScrapeRunOutcome", () => {
  test("fails a run that collected nothing and reported errors", () => {
    const outcome = resolveScrapeRunOutcome(
      buildResult({ errors: ["Missing enabled hitmarker portal fallbackUrl."] }),
    );
    expect(outcome.status).toBe("error");
    expect(outcome.exitCode).toBe(1);
    expect(outcome.error).toBe("Missing enabled hitmarker portal fallbackUrl.");
  });

  test("joins multiple errors into the recorded reason", () => {
    const outcome = resolveScrapeRunOutcome(buildResult({ errors: ["first", "second"] }));
    expect(outcome.error).toBe("first; second");
  });

  test("succeeds a clean run", () => {
    const outcome = resolveScrapeRunOutcome(buildResult({ scraped: 12, upserted: 12 }));
    expect(outcome.status).toBe("success");
    expect(outcome.exitCode).toBe(0);
    expect(outcome.error).toBe(null);
  });

  test("keeps a partial harvest successful so one bad page does not discard the rest", () => {
    const outcome = resolveScrapeRunOutcome(
      buildResult({ scraped: 9, upserted: 9, errors: ["one listing page timed out"] }),
    );
    expect(outcome.status).toBe("success");
    expect(outcome.error).toBe(null);
  });

  test("succeeds an empty-but-clean run, which is a real no-new-results outcome", () => {
    const outcome = resolveScrapeRunOutcome(buildResult({}));
    expect(outcome.status).toBe("success");
  });
});
