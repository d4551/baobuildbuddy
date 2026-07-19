import { describe, expect, test } from "bun:test";
import {
  collectStackVersionViolations,
  readPackageVersionFromJson,
  STACK_VERSION_PINS,
  type StackVersionPin,
} from "./validate-stack-versions";

describe("readPackageVersionFromJson", () => {
  test("reads matching package name/version", () => {
    expect(
      readPackageVersionFromJson("elysia", JSON.stringify({ name: "elysia", version: "2.0.0-exp.45" })),
    ).toBe("2.0.0-exp.45");
  });

  test("rejects name mismatch", () => {
    expect(
      readPackageVersionFromJson("elysia", JSON.stringify({ name: "other", version: "2.0.0-exp.45" })),
    ).toBeNull();
  });
});

describe("collectStackVersionViolations", () => {
  const pins: readonly StackVersionPin[] = [
    {
      packageName: "elysia",
      requiredInstalled: "2.0.0-exp.45",
      requiredPrefix: "2.0.0-exp.",
      resolveFromPackage: "packages/server",
    },
  ];

  test("passes when installed matches pin and override", () => {
    const violations = collectStackVersionViolations(
      pins,
      [
        {
          packageName: "elysia",
          installedVersion: "2.0.0-exp.45",
          packageJsonPath: "node_modules/elysia/package.json",
        },
      ],
      { elysia: "2.0.0-exp.45" },
    );
    expect(violations).toHaveLength(0);
  });

  test("fails when installed drifts to Elysia 1.x", () => {
    const violations = collectStackVersionViolations(
      pins,
      [
        {
          packageName: "elysia",
          installedVersion: "1.4.29",
          packageJsonPath: "node_modules/elysia/package.json",
        },
      ],
      { elysia: "2.0.0-exp.45" },
    );
    expect(violations.some((v) => v.message.includes("1.4.29"))).toBe(true);
  });

  test("fails when root override drifts from pin", () => {
    const violations = collectStackVersionViolations(
      pins,
      [
        {
          packageName: "elysia",
          installedVersion: "2.0.0-exp.45",
          packageJsonPath: "node_modules/elysia/package.json",
        },
      ],
      { elysia: "1.4.29" },
    );
    expect(violations.some((v) => v.message.includes("Root override"))).toBe(true);
  });

  test("softening regression: workspace pins include elysia 2 and eden 1.4.9", () => {
    expect(STACK_VERSION_PINS.some((pin) => pin.packageName === "elysia")).toBe(true);
    expect(STACK_VERSION_PINS.some((pin) => pin.packageName === "@elysiajs/eden")).toBe(true);
  });
});
