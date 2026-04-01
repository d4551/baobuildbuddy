import { describe, expect, test } from "bun:test";
import { toGeneratedCoverLetterContent } from "./cover-letter-route-generation";

describe("toGeneratedCoverLetterContent", () => {
  test("parses fenced JSON responses into clean letter segments", () => {
    const result = toGeneratedCoverLetterContent(
      [
        "```json",
        "{",
        '  "introduction": "Intro paragraph.",',
        '  "body": "Body paragraph.",',
        '  "conclusion": "Closing paragraph."',
        "}",
        "```",
      ].join("\n"),
    );

    expect(result).toEqual({
      introduction: "Intro paragraph.",
      body: "Body paragraph.",
      conclusion: "Closing paragraph.",
    });
  });

  test("falls back to line parsing for non-JSON content", () => {
    const result = toGeneratedCoverLetterContent(
      "Intro paragraph.\nBody paragraph one.\nClosing paragraph.",
    );

    expect(result).toEqual({
      introduction: "Intro paragraph.",
      body: "Body paragraph one.",
      conclusion: "Closing paragraph.",
    });
  });
});
