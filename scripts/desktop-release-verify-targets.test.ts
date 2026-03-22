import { describe, expect, test } from "bun:test";
import { orderTargetsPresentInProvenance } from "./utils/desktop-release-verify-targets";

describe("orderTargetsPresentInProvenance", () => {
  test("preserves DESKTOP_RELEASE_TARGETS order for a subset", () => {
    expect(orderTargetsPresentInProvenance(new Set(["windows", "macos"]))).toEqual([
      "macos",
      "windows",
    ]);
  });

  test("omits targets missing from the provenance key set", () => {
    expect(orderTargetsPresentInProvenance(new Set(["macos", "linux-arm64", "windows"]))).toEqual([
      "macos",
      "linux-arm64",
      "windows",
    ]);
  });

  test("returns empty when no keys match", () => {
    expect(orderTargetsPresentInProvenance(new Set(["unknown"]))).toEqual([]);
  });
});
