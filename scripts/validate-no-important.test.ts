import { describe, expect, it } from "bun:test";
import { collectNoImportantViolations } from "./validate-no-important";

describe("validate-no-important", () => {
  it("flags !important usage", () => {
    const violations = collectNoImportantViolations([
      { filePath: "packages/client/assets/css/x.css", content: ".x { color: red !important; }" },
    ]);
    expect(violations.length).toBe(1);
  });

  it("passes clean CSS", () => {
    expect(
      collectNoImportantViolations([
        { filePath: "packages/client/assets/css/x.css", content: ".x { color: red; }" },
      ]),
    ).toEqual([]);
  });
});
