import { describe, expect, test } from "bun:test";
import { collectDomTestRunnerViolationsForContent } from "./validate-dom-test-runner-ownership";

const VITEST_SOURCE = 'import { describe, expect, it } from "vitest";';
const BUN_TEST_SOURCE = 'import { describe, expect, test } from "bun:test";';

describe("collectDomTestRunnerViolationsForContent", () => {
  test("flags a vitest test named .test.ts", () => {
    const violations = collectDomTestRunnerViolationsForContent(
      "packages/client/composables/useThing.test.ts",
      VITEST_SOURCE,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('"*.spec.ts"');
  });

  test("flags a bun:test test named .spec.ts", () => {
    const violations = collectDomTestRunnerViolationsForContent(
      "packages/client/utils/thing.spec.ts",
      BUN_TEST_SOURCE,
    );
    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain('"*.test.ts"');
  });

  test("flags a test importing both runners", () => {
    const violations = collectDomTestRunnerViolationsForContent(
      "packages/client/utils/thing.spec.ts",
      `${VITEST_SOURCE}\n${BUN_TEST_SOURCE}`,
    );
    expect(violations.some((violation) => violation.message.includes("exactly one owner"))).toBe(
      true,
    );
  });

  test("allows the canonical pairings", () => {
    expect(
      collectDomTestRunnerViolationsForContent(
        "packages/client/composables/useThing.spec.ts",
        VITEST_SOURCE,
      ),
    ).toEqual([]);
    expect(
      collectDomTestRunnerViolationsForContent(
        "packages/server/src/routes/thing.test.ts",
        BUN_TEST_SOURCE,
      ),
    ).toEqual([]);
  });

  test("ignores non-test sources", () => {
    expect(
      collectDomTestRunnerViolationsForContent("packages/client/utils/thing.ts", VITEST_SOURCE),
    ).toEqual([]);
  });
});
