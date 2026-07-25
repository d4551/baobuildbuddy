import { describe, expect, test } from "bun:test";
import { collectViolations } from "./validate-i18n-parity";

describe("validate-i18n-parity", () => {
  test("raw critical + coverage ratchet passes on current catalogs", () => {
    const violations = collectViolations();
    expect(violations).toEqual([]);
  });
});
