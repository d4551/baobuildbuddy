import { describe, expect, test } from "bun:test";
import {
  collectSourceSuppressionViolationsForContent,
  listSuppressionKinds,
} from "./validate-no-source-suppressions";
const NUM_3 = 3;
const NUM_7 = 7;
const NUM_8 = 8;

const SAMPLE_FILE = "packages/client/components/sample.vue";

const buildExpectedNames = (): readonly string[] => listSuppressionKinds().map((kind) => kind.name);

describe("validate-no-source-suppressions", () => {
  test("VACUOUS_GATE: every registered kind is flagged when injected", () => {
    const names = buildExpectedNames();
    expect(names.length).toBeGreaterThanOrEqual(NUM_7);
    for (const name of names) {
      const content = `const x = 1; // ${name}`;
      const violations = collectSourceSuppressionViolationsForContent(SAMPLE_FILE, content);
      expect(violations.length).toBe(1);
      expect(violations[0]?.line).toBe(1);
    }
  });

  test("clean source produces zero violations", () => {
    const content = "const greeting = 'hello';\nexport { greeting };\n";
    const violations = collectSourceSuppressionViolationsForContent(SAMPLE_FILE, content);
    expect(violations).toEqual([]);
  });

  test("self-scan exemption applies to this validator and its boundary patcher", () => {
    const firstName = buildExpectedNames()[0] ?? "";
    expect(firstName.length).toBeGreaterThan(0);
    const selfContent = `const sample = '${firstName}';`;
    const selfViolations = collectSourceSuppressionViolationsForContent(
      "scripts/validate-no-source-suppressions.ts",
      selfContent,
    );
    expect(selfViolations).toEqual([]);
    const patcherViolations = collectSourceSuppressionViolationsForContent(
      "scripts/patch-upstream-dts-nocheck.ts",
      selfContent,
    );
    expect(patcherViolations).toEqual([]);
  });

  test("HTML comment suppressions are caught (Vue template comments)", () => {
    const firstName = buildExpectedNames()[0] ?? "";
    expect(firstName.length).toBeGreaterThan(0);
    const content = `<template>\n  <!-- ${firstName} -->\n</template>`;
    const violations = collectSourceSuppressionViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(1);
    expect(violations[0]?.line).toBe(2);
  });

  test("reports the correct line number for inline tokens", () => {
    const firstName = buildExpectedNames()[0] ?? "";
    expect(firstName.length).toBeGreaterThan(0);
    const content = `line1\nline2\nconst y = 2; // ${firstName}\nline4`;
    const violations = collectSourceSuppressionViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(1);
    expect(violations[0]?.line).toBe(NUM_3);
  });

  test("multiple tokens in one file each produce a violation", () => {
    const names = buildExpectedNames();
    const lines = names.map((name) => `// ${name}`);
    const content = lines.join("\n");
    const violations = collectSourceSuppressionViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(names.length);
  });

  test("kind registry count is stable and matches the documented set size", () => {
    expect(buildExpectedNames().length).toBe(NUM_8);
  });
});
