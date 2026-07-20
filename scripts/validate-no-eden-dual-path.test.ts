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
});
