import { describe, expect, test } from "bun:test";
import {
  collectAllowlistIntegrityViolations,
  collectUnderscoreEvasionViolationsForContent,
} from "./validate-no-underscore-evasion";

const SAMPLE_FILE = "packages/client/components/sample.vue";
const SAMPLE_TS = "packages/client/composables/sample.ts";

describe("validate-no-underscore-evasion", () => {
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

  test("useSpeech.ts is allowlisted pending MAS guard contract resolution (ledger exists)", () => {
    const content = "const _micStart = Promise.resolve();\n";
    const violations = collectUnderscoreEvasionViolationsForContent(
      "packages/client/composables/useSpeech.ts",
      content,
    );
    expect(violations).toEqual([]);
  });

  test("allowlist integrity: dangling ledger reference is flagged", () => {
    const original = collectUnderscoreEvasionViolationsForContent(
      "packages/client/composables/useSpeech.ts",
      "const _micStart = 1;\n",
    );
    expect(original).toEqual([]);

    const tempFile = "packages/client/composables/__bogus_allowlist_target.ts";
    const violations = collectUnderscoreEvasionViolationsForContent(tempFile, "const _x = 1;\n");
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("_x");
  });

  test("allowlist integrity: every entry references a real on-disk ledger file", () => {
    const integrityViolations = collectAllowlistIntegrityViolations();
    expect(integrityViolations).toEqual([]);
  });

  test("clean Vue <script setup> source passes", () => {
    const content = "<script setup>\nconst props = defineProps<{ msg: string }>();\n</script>\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_FILE, content);
    expect(violations).toEqual([]);
  });

  test("reports correct line number", () => {
    const content = "line1\nline2\nconst _broken = 1;\nline4\n";
    const violations = collectUnderscoreEvasionViolationsForContent(SAMPLE_TS, content);
    expect(violations.length).toBe(1);
    expect(violations[0]?.line).toBe(3);
  });
});
