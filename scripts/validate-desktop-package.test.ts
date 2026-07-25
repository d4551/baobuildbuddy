import { describe, expect, it } from "bun:test";
import { collectDesktopPackageViolations } from "./validate-desktop-package";

describe("validate-desktop-package", () => {
  it("passes for the repo desktop package layout", async () => {
    const violations = await collectDesktopPackageViolations();
    expect(violations).toEqual([]);
  });
});
