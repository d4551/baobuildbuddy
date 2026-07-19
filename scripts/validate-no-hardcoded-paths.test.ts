import { describe, expect, test } from "bun:test";
import { collectHardcodedPathViolationsForContent } from "./validate-no-hardcoded-paths";

const CONSUMER_PATH = "packages/client/components/example/ExampleWidget.vue";

describe("collectHardcodedPathViolationsForContent", () => {
  test("flags hardcoded /api path literals", () => {
    const violations = collectHardcodedPathViolationsForContent(
      CONSUMER_PATH,
      'const url = "/api/jobs";',
    );
    expect(violations.some((v) => v.literal.includes("/api/jobs"))).toBe(true);
  });

  test("flags app route literals", () => {
    const violations = collectHardcodedPathViolationsForContent(
      CONSUMER_PATH,
      'const to = "/jobs";',
    );
    expect(violations.some((v) => v.category === "route")).toBe(true);
  });

  test("softening regression: flags /api/ with trailing path segments", () => {
    const violations = collectHardcodedPathViolationsForContent(
      CONSUMER_PATH,
      'const url = "/api/settings/ai-providers";',
    );
    expect(violations.some((v) => v.literal.includes("/api/settings/ai-providers"))).toBe(true);
  });
});
