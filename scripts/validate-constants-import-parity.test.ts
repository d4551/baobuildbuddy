import { describe, expect, test } from "bun:test";
import {
  collectConstantsImportViolationsForContent,
  collectExportedNames,
  type ModuleExportIndex,
} from "./validate-constants-import-parity";

const COMPONENT_PATH = "packages/client/components/ui/PageHeroHeader.vue";

const indexOf = (exports: Record<string, readonly string[] | null>): ModuleExportIndex =>
  new Map(
    Object.entries(exports).map(([moduleName, names]) => [
      moduleName,
      names === null ? null : new Set(names),
    ]),
  );

describe("collectExportedNames", () => {
  test("collects assignment re-exports like the layout mirror uses", () => {
    const names = collectExportedNames(
      ["import * as chrome from './layout-chrome';", "export const A_CLASS = chrome.A_CLASS;"].join(
        "\n",
      ),
    );

    expect(names?.has("A_CLASS")).toBe(true);
  });

  test("collects exported types alongside values", () => {
    const names = collectExportedNames("export type IconToken = string;\nexport const B = 1;");

    expect(names?.has("IconToken")).toBe(true);
    expect(names?.has("B")).toBe(true);
  });

  test("reads the published alias from an export list", () => {
    const names = collectExportedNames("const inner = 1;\nexport { inner as OUTER };");

    expect(names?.has("OUTER")).toBe(true);
    expect(names?.has("inner")).toBe(false);
  });

  test("returns null for a module widened by a star re-export", () => {
    expect(collectExportedNames("export * from './layout-chrome';")).toBeNull();
  });
});

describe("collectConstantsImportViolationsForContent", () => {
  test("flags a name the target module never publishes", () => {
    const content = [
      "<script setup lang='ts'>",
      "import { PAGE_HERO_LEAD_CLASS } from '~/constants/layout';",
      "</script>",
    ].join("\n");

    const violations = collectConstantsImportViolationsForContent(
      COMPONENT_PATH,
      content,
      indexOf({ layout: ["PAGE_HERO_ASIDE_CLASS"] }),
    );

    expect(violations).toHaveLength(1);
    expect(violations[0]?.message).toContain("PAGE_HERO_LEAD_CLASS");
    expect(violations[0]?.line).toBe(2);
  });

  test("accepts a name the target module publishes", () => {
    const violations = collectConstantsImportViolationsForContent(
      COMPONENT_PATH,
      "import { PAGE_HERO_ASIDE_CLASS } from '~/constants/layout';",
      indexOf({ layout: ["PAGE_HERO_ASIDE_CLASS"] }),
    );

    expect(violations).toHaveLength(0);
  });

  test("resolves a multi-name import block independently", () => {
    const violations = collectConstantsImportViolationsForContent(
      COMPONENT_PATH,
      "import { GOOD_CLASS, MISSING_CLASS } from '~/constants/layout';",
      indexOf({ layout: ["GOOD_CLASS"] }),
    );

    expect(violations.map((violation) => violation.message.includes("MISSING_CLASS"))).toEqual([
      true,
    ]);
  });
});

describe("collectConstantsImportViolationsForContent specifier forms", () => {
  test("checks the source binding of an aliased import, not the local alias", () => {
    const violations = collectConstantsImportViolationsForContent(
      COMPONENT_PATH,
      "import { MISSING_CLASS as Local } from '~/constants/layout';",
      indexOf({ layout: ["GOOD_CLASS"] }),
    );

    expect(violations[0]?.message).toContain("MISSING_CLASS");
  });

  test("checks type-only imports", () => {
    const violations = collectConstantsImportViolationsForContent(
      COMPONENT_PATH,
      "import type { MissingToken } from '~/constants/layout';",
      indexOf({ layout: ["IconSizeToken"] }),
    );

    expect(violations[0]?.message).toContain("MissingToken");
  });

  test("skips modules widened by a star re-export", () => {
    const violations = collectConstantsImportViolationsForContent(
      COMPONENT_PATH,
      "import { ANYTHING } from '~/constants/layout';",
      indexOf({ layout: null }),
    );

    expect(violations).toHaveLength(0);
  });

  test("ignores imports from outside ~/constants", () => {
    const violations = collectConstantsImportViolationsForContent(
      COMPONENT_PATH,
      "import { MISSING_CLASS } from '~/utils/elsewhere';",
      indexOf({ layout: ["GOOD_CLASS"] }),
    );

    expect(violations).toHaveLength(0);
  });
});
