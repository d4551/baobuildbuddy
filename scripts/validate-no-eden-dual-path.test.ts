import { describe, expect, test } from "bun:test";
import { collectEdenDualPathViolationsForContent } from "./validate-no-eden-dual-path";

describe("validate-no-eden-dual-path: requestApi automation endpoint fails", () => {
  test("requestApi automation endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useAutomation.ts",
      `requestApi(runtime.api, API_ENDPOINTS.automationJobApply, { method: "POST" });`,
    );
    expect(violations.length).toBe(1);
  });
});

describe("validate-no-eden-dual-path: Eden automation path passes", () => {
  test("Eden automation path passes", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useAutomation.ts",
      `await api.automation["job-apply"].post(body);`,
    );
    expect(violations.length).toBe(0);
  });
});

describe("validate-no-eden-dual-path: requestApi coverLetters endpoint fails", () => {
  test("requestApi coverLetters endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/other.ts",
      `requestApi(runtime.api, API_ENDPOINTS.coverLetters, { method: "GET" });`,
    );
    expect(violations.length).toBe(1);
  });
});

describe("validate-no-eden-dual-path: requestApi resumes endpoint fails", () => {
  test("requestApi resumes endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/other.ts",
      `requestApi(runtime.api, API_ENDPOINTS.resumes, { method: "GET" });`,
    );
    expect(violations.length).toBe(1);
  });
});

describe("validate-no-eden-dual-path: requestApi jobs endpoint fails", () => {
  test("requestApi jobs endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/other.ts",
      `requestApi(runtime.api, API_ENDPOINTS.jobs, { method: "GET" });`,
    );
    expect(violations.length).toBe(1);
  });
});

describe("validate-no-eden-dual-path: useJobs buildJobDetailEndpoint fails", () => {
  test("useJobs buildJobDetailEndpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useJobs.ts",
      `requestApi(runtime, buildJobDetailEndpoint(id), { method: "GET" });`,
    );
    expect(violations.length).toBeGreaterThan(0);
  });
});

describe("validate-no-eden-dual-path: useResume Eden path passes export helper", () => {
  test("useResume Eden path passes export helper", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useResume.ts",
      `await downloadApiFile(runtime, buildResumeExportEndpoint(id), { method: "POST" }, "resume.pdf");`,
    );
    expect(violations.length).toBe(0);
  });
});

describe("validate-no-eden-dual-path: api.coverLetters camelCase path fails", () => {
  test("api.coverLetters camelCase path fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useCoverLetter.ts",
      `await api.coverLetters.get();`,
    );
    expect(violations.some((v) => v.message.includes("cover-letters"))).toBe(true);
  });
});

describe("validate-no-eden-dual-path: api cover-letters kebab path passes", () => {
  test('api["cover-letters"] kebab path passes', () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/useCoverLetter.ts",
      `await api["cover-letters"].get();\nawait downloadApiFile(runtime, buildCoverLetterExportEndpoint(id), { method: "POST" }, "x.pdf");`,
    );
    expect(violations.length).toBe(0);
  });
});

describe("validate-no-eden-dual-path: requestApi apiDocs endpoint fails", () => {
  test("requestApi apiDocs endpoint fails", () => {
    const violations = collectEdenDualPathViolationsForContent(
      "packages/client/composables/api-docs-page-data.ts",
      `requestApi(runtime.api, API_ENDPOINTS.apiDocsJson, { method: "GET" });`,
    );
    expect(violations.length).toBe(1);
  });
});
