import { describe, expect, it } from "bun:test";
import {
  collectDesktopPackageViolations,
  trimCargoFailureDetail,
} from "./validate-desktop-package";

describe("validate-desktop-package", () => {
  it("passes for the repo desktop package layout", async () => {
    const violations = await collectDesktopPackageViolations();
    expect(violations).toEqual([]);
  });

  it("surfaces rustc errors from cargo output tails, not download spam", () => {
    const spam = Array.from({ length: 80 }, (_, i) => `Downloaded crate-${String(i)}`).join("\n");
    const detail = trimCargoFailureDetail(
      `${spam}\nerror: failed to run custom build command for \`webkit2gtk-sys\`\nPackage webkit2gtk-4.1 was not found`,
    );
    expect(detail.includes("webkit2gtk")).toBe(true);
    expect(detail.includes("Downloaded crate-0")).toBe(false);
  });
});
