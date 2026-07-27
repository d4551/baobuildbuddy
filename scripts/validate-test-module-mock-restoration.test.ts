import { describe, expect, test } from "bun:test";
import {
  collectAfterAllRanges,
  collectModuleMockRestorationViolations,
} from "./validate-test-module-mock-restoration";

const MOCK_CALL = 'mock.module("../utils/logger", () => ({ createServerLogger: () => logger }));';
const RESTORE_CALL =
  'await mock.module("../utils/logger", () => ({ createServerLogger: realCreateServerLogger }));';
const TEST_FILE_PATH = "packages/server/src/a.test.ts";
/** The unrestored mock sits on the third line of the fixture below. */
const UNRESTORED_MOCK_LINE = 3;

const violationsFor = (content: string, filePath: string = TEST_FILE_PATH) =>
  collectModuleMockRestorationViolations([{ filePath, content }]);

const buildSource = (...lines: string[]): string => `${lines.join("\n")}\n`;

describe("validate-test-module-mock-restoration violations", () => {
  test("flags a module mock that is never handed back", () => {
    const violations = violationsFor(buildSource(`await ${MOCK_CALL}`));
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("../utils/logger");
  });

  test("accepts a module mock re-mocked inside afterAll", () => {
    const content = buildSource(
      `await ${MOCK_CALL}`,
      "",
      "afterAll(async () => {",
      `  ${RESTORE_CALL}`,
      "});",
    );
    expect(violationsFor(content).length).toBe(0);
  });

  test("mock.restore() alone does not count as restoration", () => {
    const content = buildSource(
      `await ${MOCK_CALL}`,
      "",
      "afterAll(() => {",
      "  mock.restore();",
      "});",
    );
    expect(violationsFor(content).length).toBe(1);
  });

  test("restoring one specifier does not excuse another", () => {
    const content = buildSource(
      `await ${MOCK_CALL}`,
      'await mock.module("../db/client", () => ({ db }));',
      "afterAll(async () => {",
      `  ${RESTORE_CALL}`,
      "});",
    );
    const violations = violationsFor(content);
    expect(violations.length).toBe(1);
    expect(violations[0]?.message).toContain("../db/client");
  });
});

describe("validate-test-module-mock-restoration scope and parsing", () => {
  test("non-test files are out of scope", () => {
    expect(
      violationsFor(buildSource(`await ${MOCK_CALL}`), "packages/server/src/a.ts").length,
    ).toBe(0);
  });

  test("a closing paren inside a string does not end the afterAll range early", () => {
    const content = buildSource(
      `await ${MOCK_CALL}`,
      "afterAll(async () => {",
      '  logger.info("done)");',
      `  ${RESTORE_CALL}`,
      "});",
    );
    expect(violationsFor(content).length).toBe(0);
  });

  test("reports the line of the unrestored mock", () => {
    const content = buildSource("const a = 1;", "const b = 2;", `await ${MOCK_CALL}`);
    expect(violationsFor(content)[0]?.line).toBe(UNRESTORED_MOCK_LINE);
  });

  test("collectAfterAllRanges spans the whole callback", () => {
    const content = "afterAll(() => {\n  reset();\n});\n";
    const ranges = collectAfterAllRanges(content);
    expect(ranges.length).toBe(1);
    expect(content.slice(ranges[0]?.start, (ranges[0]?.end ?? 0) + 1)).toContain("reset()");
  });
});
