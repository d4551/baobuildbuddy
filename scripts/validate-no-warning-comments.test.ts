import { describe, expect, test } from "bun:test";
import {
  collectWarningCommentViolationsForContent,
  listWarningKinds,
} from "./validate-no-warning-comments";

const SAMPLE_FILE = "packages/client/components/sample.vue";

const kindNames = (): readonly string[] => listWarningKinds().map((kind) => kind.name);

describe("validate-no-warning-comments", () => {
  test("VACUOUS_GATE: every registered warning token is flagged when injected", () => {
    const names = kindNames();
    expect(names.length).toBe(6);
    for (const name of names) {
      const content = `// ${name}: fix this later`;
      const violations = collectWarningCommentViolationsForContent(SAMPLE_FILE, content);
      expect(violations.length).toBe(1);
      expect(violations[0]?.line).toBe(1);
    }
  });

  test("clean source produces zero violations", () => {
    const content = "const greeting = 'hello';\nexport { greeting };\n";
    const violations = collectWarningCommentViolationsForContent(SAMPLE_FILE, content);
    expect(violations).toEqual([]);
  });

  test("self-scan exemption applies to the validator and exempt peers", () => {
    const firstName = kindNames()[0] ?? "";
    expect(firstName.length).toBeGreaterThan(0);
    const selfContent = `const marker = '${firstName}';`;
    const selfViolations = collectWarningCommentViolationsForContent(
      "scripts/validate-no-warning-comments.ts",
      selfContent,
    );
    expect(selfViolations).toEqual([]);
    const peerViolations = collectWarningCommentViolationsForContent(
      "scripts/validate-ui-stubs-noops.ts",
      selfContent,
    );
    expect(peerViolations).toEqual([]);
  });

  test("reports correct line number for inline markers", () => {
    const firstName = kindNames()[0] ?? "";
    expect(firstName.length).toBeGreaterThan(0);
    const content = `line1\nline2\n// ${firstName}: bypass auth\nline4`;
    const violations = collectWarningCommentViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(1);
    expect(violations[0]?.line).toBe(3);
  });

  test("word-boundary prevents false positives on legitimate identifiers", () => {
    const content = "const deprecated = true;\nconst placeholderName = 'x';\n";
    const violations = collectWarningCommentViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(0);
  });

  test("case-sensitive — lowercase markers are not flagged", () => {
    const content = "const todo = 'task';\n";
    const violations = collectWarningCommentViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(0);
  });

  test("multiple distinct markers in one file each produce a violation", () => {
    const names = kindNames();
    const lines = names.map((name) => `// ${name}: x`);
    const content = lines.join("\n");
    const violations = collectWarningCommentViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(names.length);
  });

  test("uppercase name appears at least once in lowercase source — boundary holds", () => {
    const firstName = kindNames()[0] ?? "";
    expect(firstName.length).toBeGreaterThan(0);
    const lowercased = firstName.toLowerCase();
    const content = `const ${lowercased} = 1;`;
    const violations = collectWarningCommentViolationsForContent(SAMPLE_FILE, content);
    expect(violations.length).toBe(0);
  });
});
