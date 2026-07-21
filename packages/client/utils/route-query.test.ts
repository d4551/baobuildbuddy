import { describe, expect, test } from "vitest";
import {
  queryValueToOptionalString,
  queryValueToString,
  resolveRouteSectionId,
} from "./route-query";

const isSection = (value: string): value is "a" | "b" => value === "a" || value === "b";

describe("route-query SSOT", () => {
  test("queryValueToString handles string, array, and empty", () => {
    expect(queryValueToString("profile")).toBe("profile");
    expect(queryValueToString(["profile", "other"])).toBe("profile");
    expect(queryValueToString([null])).toBe("");
    expect(queryValueToString(undefined)).toBe("");
    expect(queryValueToString(null)).toBe("");
  });

  test("queryValueToOptionalString nulls empty", () => {
    expect(queryValueToOptionalString("x")).toBe("x");
    expect(queryValueToOptionalString("")).toBeNull();
    expect(queryValueToOptionalString(undefined)).toBeNull();
  });

  test("resolveRouteSectionId uses allowlist + default", () => {
    expect(resolveRouteSectionId("b", isSection, "a")).toBe("b");
    expect(resolveRouteSectionId("z", isSection, "a")).toBe("a");
    expect(resolveRouteSectionId(["b"], isSection, "a")).toBe("b");
    expect(resolveRouteSectionId(undefined, isSection, "a")).toBe("a");
  });
});
