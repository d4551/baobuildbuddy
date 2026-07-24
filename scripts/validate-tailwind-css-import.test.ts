import { describe, expect, it } from "bun:test";
import { collectTailwindCssImportViolations } from "./validate-tailwind-css-import";

describe("validate-tailwind-css-import", () => {
  it("passes when index.css import is present", () => {
    expect(
      collectTailwindCssImportViolations('@import "tailwindcss/index.css";\n@plugin "daisyui" {}'),
    ).toEqual([]);
  });

  it("fails when import is missing", () => {
    const violations = collectTailwindCssImportViolations('@plugin "daisyui" {}');
    expect(violations.some((v) => v.message.includes("Missing required"))).toBe(true);
  });

  it("fails on bare tailwindcss import", () => {
    const violations = collectTailwindCssImportViolations('@import "tailwindcss";');
    expect(violations.some((v) => v.message.includes("banned"))).toBe(true);
  });
});
