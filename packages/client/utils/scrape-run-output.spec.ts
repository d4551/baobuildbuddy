import { describe, expect, it } from "vitest";
import {
  isFailedScrapeRun,
  readScrapeOutputCounts,
  readScrapeOutputErrors,
} from "./scrape-run-output";

describe("scrape-run-output", () => {
  it("reads aggregator errors and counts", () => {
    const output = {
      target: "jobs_grackle",
      scraped: 0,
      upserted: 0,
      errors: ["Script exited 137: "],
    };
    expect(readScrapeOutputErrors(output)).toEqual(["Script exited 137:"]);
    expect(readScrapeOutputCounts(output)).toEqual({ scraped: 0, upserted: 0 });
    expect(isFailedScrapeRun({ output, exitCode: 0 })).toBe(true);
  });

  it("treats non-zero exit as failure", () => {
    expect(isFailedScrapeRun({ output: { scraped: 5 }, exitCode: 137 })).toBe(true);
  });

  it("allows successful scrapes with no errors", () => {
    expect(
      isFailedScrapeRun({
        output: { scraped: 12, upserted: 12, errors: [] },
        exitCode: 0,
      }),
    ).toBe(false);
  });
});
