import { describe, expect, test } from "bun:test";
import { resolveJobApplyAdapter } from "./adapters";

describe("resolveJobApplyAdapter", () => {
  test("detects Greenhouse-hosted forms", () => {
    expect(resolveJobApplyAdapter("https://boards.greenhouse.io/example/jobs/1").id).toBe(
      "greenhouse",
    );
  });

  test("detects Lever-hosted forms", () => {
    expect(resolveJobApplyAdapter("https://jobs.lever.co/example/123").id).toBe("lever");
  });

  test("falls back to generic selectors", () => {
    expect(resolveJobApplyAdapter("https://careers.example.com/open-role").id).toBe("generic");
  });
});
