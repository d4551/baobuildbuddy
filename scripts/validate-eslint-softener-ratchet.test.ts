import { describe, expect, test } from "bun:test";
import { collectEslintSoftenerRatchetViolations } from "./validate-eslint-softener-ratchet";

describe("collectEslintSoftenerRatchetViolations", () => {
  test("flags off-rule growth beyond ratchet", () => {
    const rules = Array.from({ length: 10 }, (_, index) => `"rule${String(index)}": "off"`).join(
      ", ",
    );
    const violations = collectEslintSoftenerRatchetViolations(`export default [{ rules: { ${rules} } }];`);
    expect(violations.some((v) => v.message.includes('"off"'))).toBe(true);
  });

  test("passes at current off ceiling", () => {
    const rules = Array.from({ length: 9 }, (_, index) => `"rule${String(index)}": "off"`).join(
      ", ",
    );
    expect(
      collectEslintSoftenerRatchetViolations(`export default [{ rules: { ${rules} } }];`),
    ).toHaveLength(0);
  });
});
