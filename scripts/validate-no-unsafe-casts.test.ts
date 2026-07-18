import { describe, expect, test } from "bun:test";
import { collectUnsafeCastViolationsForContent } from "./validate-no-unsafe-casts";

const TS_PATH = "packages/server/src/routes/example.ts";

describe("collectUnsafeCastViolationsForContent", () => {
  test("flags as any casts", () => {
    const violations = collectUnsafeCastViolationsForContent(
      TS_PATH,
      'const value = input as any;',
    );
    expect(violations.some((v) => v.castType === "any")).toBe(true);
  });

  test("flags as unknown casts", () => {
    const violations = collectUnsafeCastViolationsForContent(
      TS_PATH,
      'const value = input as unknown;',
    );
    expect(violations.some((v) => v.castType === "unknown")).toBe(true);
  });

  test("passes safe code", () => {
    const violations = collectUnsafeCastViolationsForContent(
      TS_PATH,
      'const value = Number(input);',
    );
    expect(violations).toHaveLength(0);
  });

  test("softening regression: flags multiple as-any on the same line", () => {
    const violations = collectUnsafeCastViolationsForContent(
      TS_PATH,
      'const a = x as any; const b = y as unknown;',
    );
    expect(violations.length).toBe(2);
  });
});
