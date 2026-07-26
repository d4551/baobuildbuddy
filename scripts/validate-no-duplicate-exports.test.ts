import { describe, expect, test } from "bun:test";
import {
  collectDuplicateExportViolations,
  collectExportDefinitions,
} from "./validate-no-duplicate-exports";

/** Line the second (duplicate) declaration sits on in the fixture below. */
const DUPLICATE_DECLARATION_LINE = 9;

describe("collectExportDefinitions", () => {
  test("collects named definitions with line numbers", () => {
    const definitions = collectExportDefinitions([
      {
        filePath: "packages/shared/src/constants/example.ts",
        content: "export const FIRST = 1;\n\nexport function second(): void {}\n",
      },
    ]);

    expect(definitions).toEqual([
      { name: "FIRST", filePath: "packages/shared/src/constants/example.ts", line: 1 },
      { name: "second", filePath: "packages/shared/src/constants/example.ts", line: 3 },
    ]);
  });

  test("ignores declaration files, test fixtures, and re-export aliases", () => {
    const definitions = collectExportDefinitions([
      {
        filePath: "packages/server/dist-types/services/stale.d.ts",
        content: "export declare const STALE: number;",
      },
      {
        filePath: "scripts/validate-example.test.ts",
        content: 'export const FIXTURE_CLASS = "btn btn-primary";',
      },
      {
        filePath: "packages/shared/src/constants/barrel.ts",
        content: 'export { APP_ROUTES } from "./routes";',
      },
    ]);

    expect(definitions).toEqual([]);
  });

  test("exempts namespace-assignment facades but keeps literal definitions", () => {
    const definitions = collectExportDefinitions([
      {
        filePath: "packages/client/constants/layout.ts",
        content:
          "import * as chrome from './layout-chrome';\n" +
          "export const APP_DRAWER_ID = chrome.APP_DRAWER_ID;\n" +
          "export type IconSizeToken = chrome.IconSizeToken;\n" +
          'export const LAYOUT_PUBLIC_SURFACE = "layout" as const;\n',
      },
    ]);

    expect(definitions).toEqual([
      {
        name: "LAYOUT_PUBLIC_SURFACE",
        filePath: "packages/client/constants/layout.ts",
        line: 4,
      },
    ]);
  });
});

describe("collectDuplicateExportViolations", () => {
  test("flags a symbol defined in two modules and points at the duplicate", () => {
    const violations = collectDuplicateExportViolations([
      {
        name: "RESUME_EXPORT_THEME_CONFIGS",
        filePath: "packages/shared/src/constants/a.ts",
        line: 5,
      },
      {
        name: "RESUME_EXPORT_THEME_CONFIGS",
        filePath: "packages/shared/src/constants/b.ts",
        line: DUPLICATE_DECLARATION_LINE,
      },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0]?.filePath).toBe("packages/shared/src/constants/b.ts");
    expect(violations[0]?.line).toBe(DUPLICATE_DECLARATION_LINE);
    expect(violations[0]?.message).toContain("RESUME_EXPORT_THEME_CONFIGS");
    expect(violations[0]?.message).toContain("packages/shared/src/constants/a.ts");
  });

  test("allows type/value pairs inside a single module", () => {
    const violations = collectDuplicateExportViolations([
      { name: "Job", filePath: "packages/shared/src/types/jobs.ts", line: 3 },
      { name: "Job", filePath: "packages/shared/src/types/jobs.ts", line: 40 },
    ]);

    expect(violations).toHaveLength(0);
  });

  test("passes when every symbol has exactly one defining module", () => {
    const violations = collectDuplicateExportViolations([
      {
        name: "A4_PAGE_SIZE",
        filePath: "packages/shared/src/constants/export-layout.ts",
        line: 15,
      },
      { name: "APP_ROUTES", filePath: "packages/shared/src/constants/routes.ts", line: 10 },
    ]);

    expect(violations).toHaveLength(0);
  });
});
