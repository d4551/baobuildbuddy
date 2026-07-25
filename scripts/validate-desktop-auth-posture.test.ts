import { describe, expect, test } from "bun:test";
import { collectViolations } from "./validate-desktop-auth-posture";

const BAO_DISABLE_AUTH_TRUE_PATTERN = /\.env\(\s*"BAO_DISABLE_AUTH"\s*,\s*"true"\s*\)/u;
const UNSAFE_INLINE_SCRIPT_SRC_PATTERN = /script-src[^;]*'unsafe-inline'/u;

describe("validate-desktop-auth-posture", () => {
  test("live scan passes on current desktop posture", async () => {
    const violations = await collectViolations();
    expect(violations).toEqual([]);
  });

  test("flags hardcoded BAO_DISABLE_AUTH true (VACUOUS_GATE_TEST)", () => {
    expect(BAO_DISABLE_AUTH_TRUE_PATTERN.test('.env("BAO_DISABLE_AUTH", "true")')).toBe(true);
    expect(
      BAO_DISABLE_AUTH_TRUE_PATTERN.test(
        'if let Ok(auth_override) = std::env::var("BAO_DISABLE_AUTH")',
      ),
    ).toBe(false);
  });

  test("flags unsafe-inline script-src", () => {
    expect(
      UNSAFE_INLINE_SCRIPT_SRC_PATTERN.test("script-src 'self' 'unsafe-inline'; style-src 'self'"),
    ).toBe(true);
    expect(
      UNSAFE_INLINE_SCRIPT_SRC_PATTERN.test("script-src 'self'; style-src 'self' 'unsafe-inline'"),
    ).toBe(false);
  });
});
