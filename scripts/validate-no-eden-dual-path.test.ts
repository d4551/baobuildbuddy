import { describe, expect, test } from "bun:test";
import { collectEdenDualPathViolationsForContent } from "./validate-no-eden-dual-path";

describe("validate-no-eden-dual-path", () => {
  test("requestApi automation endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useAutomation.ts",
      `requestApi(runtime.api, API_ENDPOINTS.automationJobApply, { method: "POST" });`,
    );
    expect(violations.length).toBe(1);
  });

  test("Eden automation path passes", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useAutomation.ts",
      `await api.automation["job-apply"].post(body);`,
    );
    expect(violations.length).toBe(0);
  });

  test("requestApi coverLetters endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/other.ts",
      `requestApi(runtime.api, API_ENDPOINTS.coverLetters, { method: "GET" });`,
    );
    expect(violations.length).toBe(1);
  });

  test("requestApi resumes endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/other.ts",
      `requestApi(runtime.api, API_ENDPOINTS.resumes, { method: "GET" });`,
    );
    expect(violations.length).toBe(1);
  });

  test("useJobs buildJobDetailEndpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useJobs.ts",
      `requestApi(runtime, buildJobDetailEndpoint(id), { method: "GET" });`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });

  test("useResume Eden path passes export helper", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useResume.ts",
      `await downloadApiFile(runtime, buildResumeExportEndpoint(id), { method: "POST" }, "resume.pdf");`,
    );
    expect(violations.length).toBe(0);
  });
});
