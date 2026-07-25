import { describe, expect, it } from "bun:test";
import { collectSoftPackageScriptViolations } from "./validate-no-soft-package-scripts";

describe("validate-no-soft-package-scripts", () => {
  it("flags echo lint stubs", () => {
    const violations = collectSoftPackageScriptViolations(
      "packages/desktop/package.json",
      JSON.stringify({
        scripts: { lint: 'echo "No separate desktop lint task"' },
      }),
    );
    expect(violations.length).toBe(1);
  });

  it("flags echo typecheck stubs", () => {
    const violations = collectSoftPackageScriptViolations(
      "packages/desktop/package.json",
      JSON.stringify({
        scripts: { typecheck: 'echo "No JS/TS typecheck"' },
      }),
    );
    expect(violations.length).toBe(1);
  });

  it("allows real lint scripts", () => {
    const violations = collectSoftPackageScriptViolations(
      "packages/client/package.json",
      JSON.stringify({
        scripts: { lint: "bun run eslint ." },
      }),
    );
    expect(violations).toEqual([]);
  });
});
