import { describe, expect, test } from "bun:test";
import { resolveJobApplyStrategy } from "./adapters";

describe("resolveJobApplyStrategy", () => {
  test("detects Greenhouse-hosted forms", () => {
    expect(resolveJobApplyStrategy("https://boards.greenhouse.io/example/jobs/1").id).toBe(
      "greenhouse",
    );
  });

  test("detects Lever-hosted forms", () => {
    expect(resolveJobApplyStrategy("https://jobs.lever.co/example/123").id).toBe("lever");
  });

  test("falls back to generic selectors", () => {
    expect(resolveJobApplyStrategy("https://careers.example.com/open-role").id).toBe("generic");
  });
});
