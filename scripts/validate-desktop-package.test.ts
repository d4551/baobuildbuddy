import { describe, expect, it } from "bun:test";
import {
  collectDesktopPackageViolations,
  trimCargoFailureDetail,
} from "./validate-desktop-package";

/**
 * `collectDesktopPackageViolations` shells out to `cargo check` on the Tauri
 * crate. A warm cargo cache answers in ~2s, but a cold one compiles
 * dependencies and blows past bun's 5s default, which made this test flake by
 * cache state rather than by correctness. The assertion is unchanged; only the
 * time budget reflects a genuine cold compile.
 */
const COLD_CARGO_CHECK_TIMEOUT_MS = 300_000;

describe("validate-desktop-package", () => {
  it(
    "passes for the repo desktop package layout",
    async () => {
      const violations = await collectDesktopPackageViolations();
      expect(violations).toEqual([]);
    },
    COLD_CARGO_CHECK_TIMEOUT_MS,
  );

  it("surfaces rustc errors from cargo output tails, not download spam", () => {
    const spam = Array.from({ length: 80 }, (_, i) => `Downloaded crate-${String(i)}`).join("\n");
    const detail = trimCargoFailureDetail(
      `${spam}\nerror: failed to run custom build command for \`webkit2gtk-sys\`\nPackage webkit2gtk-4.1 was not found`,
    );
    expect(detail.includes("webkit2gtk")).toBe(true);
    expect(detail.includes("Downloaded crate-0")).toBe(false);
  });
});
