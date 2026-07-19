import { describe, expect, test } from "bun:test";
import { collectSsotAuthorityMetaViolationsForContent } from "./validate-ui-ssot-authority";

describe("collectSsotAuthorityMetaViolationsForContent", () => {
  test("flags feature-tree startsWith waivers", () => {
    const violations = collectSsotAuthorityMetaViolationsForContent(
      "scripts/validate-ui-typography.ts",
      [
        "const isSsotSourceFile = (filePath: string): boolean =>",
        '  filePath.startsWith("packages/client/components/ai/") ||',
        '  filePath.startsWith("packages/client/components/interview/");',
      ].join("\n"),
    );
    expect(violations.length).toBeGreaterThanOrEqual(2);
    expect(violations.some((v) => v.message.includes("components/ai/"))).toBe(true);
  });

  test("flags consumer paths inside SSOT_ALLOWLIST_PATHS", () => {
    const violations = collectSsotAuthorityMetaViolationsForContent(
      "scripts/validate-no-raw-design-tokens.ts",
      [
        "const SSOT_ALLOWLIST_PATHS = new Set<string>([",
        '  "packages/client/components/ai/AIChatSidebar.vue",',
        '  "packages/client/constants/layout.ts",',
        "]);",
      ].join("\n"),
    );
    expect(violations.some((v) => v.message.includes("AIChatSidebar.vue"))).toBe(true);
    expect(violations.some((v) => v.message.includes("constants/layout.ts"))).toBe(false);
  });

  test("allows ui/ primitive owners in allowlist Sets", () => {
    const violations = collectSsotAuthorityMetaViolationsForContent(
      "scripts/validate-ui-glass-materials.ts",
      [
        "const SSOT_ALLOWLIST_PATHS = new Set<string>([",
        '  "packages/client/components/ui/EmptyState.vue",',
        '  "packages/client/assets/css/main.css",',
        "]);",
      ].join("\n"),
    );
    expect(violations).toHaveLength(0);
  });

  test("ignores non-validator scripts", () => {
    const violations = collectSsotAuthorityMetaViolationsForContent(
      "scripts/something-else.ts",
      'filePath.startsWith("packages/client/components/ai/")',
    );
    expect(violations).toHaveLength(0);
  });
});
