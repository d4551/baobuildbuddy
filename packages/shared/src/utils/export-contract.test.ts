import { describe, expect, test } from "bun:test";
import {
  collectDefinedStringValues,
  formatExportDate,
  resolveResumeExportTemplate,
  toCoverLetterParagraphs,
} from "./export-contract";

describe("export contract", () => {
  test("collects only defined non-empty string values", () => {
    expect(collectDefinedStringValues(["alpha", undefined, "", " beta ", "   "])).toEqual([
      "alpha",
      " beta ",
    ]);
  });

  test("resolves the explicit resume template first", () => {
    expect(resolveResumeExportTemplate("creative", "modern")).toBe("creative");
    expect(resolveResumeExportTemplate(undefined, "modern")).toBe("modern");
    expect(resolveResumeExportTemplate("not-a-template", "modern")).toBe("modern");
    expect(resolveResumeExportTemplate("not-a-template", "also-invalid")).toBe("modern");
  });

  test("formats export dates with the shared locale contract", () => {
    expect(formatExportDate(new Date("2026-03-25T00:00:00.000Z"))).toBe("March 25, 2026");
  });

  test("normalizes canonical cover-letter content sections", () => {
    expect(
      toCoverLetterParagraphs({
        opening: "Intro",
        body: ["Impact one", "Impact two"],
        closing: "Close",
      }),
    ).toEqual(["Intro", "Impact one", "Impact two", "Close"]);
  });

  test("falls back to alternate cover-letter section names", () => {
    expect(
      toCoverLetterParagraphs({
        introduction: "Intro",
        main: ["Body"],
        conclusion: "Close",
      }),
    ).toEqual(["Intro", "Body", "Close"]);
  });

  test("splits raw text cover letters into paragraphs", () => {
    expect(toCoverLetterParagraphs("First paragraph\n\nSecond paragraph")).toEqual([
      "First paragraph",
      "Second paragraph",
    ]);
  });
});
