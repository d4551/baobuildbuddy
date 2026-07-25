import { describe, expect, test } from "bun:test";
import { collectSoftTestSkipViolations } from "./validate-no-soft-test-skips";

describe("validate-no-soft-test-skips", () => {
  test("flags test.skip", () => {
    const violations = collectSoftTestSkipViolations([
      { filePath: "packages/server/src/foo.test.ts", content: `test.skip("x", () => {});` },
    ]);
    expect(violations.length).toBe(1);
  });

  test("flags hardcoded STT BLOCKED in honest proof", () => {
    const violations = collectSoftTestSkipViolations([
      {
        filePath: "scripts/browser-honest-capabilities-proof.ts",
        content: `stt: { status: "BLOCKED", reason: "no mic" },`,
      },
    ]);
    expect(violations.length).toBe(1);
  });

  test("passes clean file", () => {
    const violations = collectSoftTestSkipViolations([
      {
        filePath: "packages/server/src/foo.test.ts",
        content: `test("x", () => { expect(1).toBe(1); });`,
      },
    ]);
    expect(violations.length).toBe(0);
  });
});
