import { describe, expect, test } from "bun:test";

describe("validate-desktop-auth-posture patterns", () => {
  test("flags hardcoded BAO_DISABLE_AUTH true (VACUOUS_GATE_TEST)", () => {
    const pattern = /\.env\(\s*"BAO_DISABLE_AUTH"\s*,\s*"true"\s*\)/u;
    expect(pattern.test('.env("BAO_DISABLE_AUTH", "true")')).toBe(true);
    expect(pattern.test('if let Ok(auth_override) = std::env::var("BAO_DISABLE_AUTH")')).toBe(
      false,
    );
  });

  test("flags unsafe-inline script-src", () => {
    const pattern = /script-src[^;]*'unsafe-inline'/u;
    expect(pattern.test("script-src 'self' 'unsafe-inline'; style-src 'self'")).toBe(true);
    expect(pattern.test("script-src 'self'; style-src 'self' 'unsafe-inline'")).toBe(false);
  });
});
