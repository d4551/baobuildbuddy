import { describe, expect, test } from "bun:test";
import { collectUnderscoreEvasionViolationsForContent } from "./validate-no-underscore-evasion";

const NUM_3 = 3;

const SAMPLE_FILE = "packages/client/components/sample.vue";
const SAMPLE_TS = "packages/client/composables/sample.ts";

describe("validate-no-underscore-evasion: underscore-prefix declarations", () => {
  test("VACUOUS_GATE: underscore-prefix const declarations are flagged", () => {
    const content = "const _unused = 1;\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_TS, content);
    expect(violations.length).toBe(1);
    expect(violations[0]?.line).toBe(1);
  });

  test("VACUOUS_GATE: underscore-prefix let declarations are flagged", () => {
    const content = "let _counter = 0;\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_TS, content);
    expect(violations.length).toBe(1);
  });

  test("VACUOUS_GATE: multi-character underscore names are flagged", () => {
    const names = ["_a", "_foo", "_counter123", "_micStart"];
    for (const name of names) {
      const content = `const ${name} = 1;\n`;
      const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_TS, content);
      expect(violations.length).toBe(1);
    }
  });

  test("single underscore discard is allowed", () => {
    const content = "const _ = 1;\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_TS, content);
    expect(violations).toEqual([]);
  });

  test("non-underscore identifiers are allowed", () => {
    const content = "const greeting = 'hi';\nlet counter = 0;\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_TS, content);
    expect(violations).toEqual([]);
  });
});

describe("validate-no-underscore-evasion: exemptions", () => {
  test("test files are exempt", () => {
    const content = "const _fixture = { sample: 1 };\n";
    const violations = collectUnderscoreEvasionViolationsForContent(
      "packages/client/composables/sample.test.ts",
      content,
    );
    expect(violations).toEqual([]);
  });

  test("self-scan exemption applies to this validator", () => {
    const content = "const _sample = 1;\n";
    const violations = collectUnderscoreEvasionViolationsForContent(
      "scripts/validate-no-underscore-evasion.ts",
      content,
    );
    expect(violations).toEqual([]);
  });

  test("NO ALLOWLIST: useSpeech.ts is flagged like any other source (no special exemption)", () => {
    const content = "const _micStart = Promise.resolve();\n";
    const violations = collectUnderscoreEvasionViolationsForContent(
      "packages/client/composables/useSpeech.ts",
      content,
    );
    expect(violations.length).toBe(1);
  });

  test("NO ALLOWLIST: arbitrary source files are flagged (no ledger exemption)", () => {
    const tempFile = "packages/client/composables/__bogus_allowlist_target.ts";
    const violations = collectUnderscoreEvasionViolationsForContent(tempFile, "const _x = 1;\n");
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("_x");
  });

  test("NO ALLOWLIST: exemption set is closed to test files + gate source only", () => {
    const flaggedSource = collectUnderscoreEvasionViolationsForContent(
      "packages/client/composables/production.ts",
      "const _leak = 1;\n",
    );
    expect(flaggedSource.length).toBe(1);
    const exemptTest = collectUnderscoreEvasionViolationsForContent(
      "packages/client/composables/production.test.ts",
      "const _fixture = 1;\n",
    );
    expect(exemptTest).toEqual([]);
  });
});

describe("validate-no-underscore-evasion: reporting", () => {
  test("clean Vue <script setup> source passes", () => {
    const content = "<script setup>\nconst props = defineProps<{ msg: string }>();\n</script>\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_FILE, content);
    expect(violations).toEqual([]);
  });

  test("reports correct line number", () => {
    const content = "line1\nline2\nconst _broken = 1;\nline4\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_TS, content);
    expect(violations.length).toBe(1);
    expect(violations[0]?.line).toBe(NUM_3);
  });
});
