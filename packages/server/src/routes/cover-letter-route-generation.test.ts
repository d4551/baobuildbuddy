import { describe, expect, test } from "bun:test";
import {
  ensureCompleteCoverLetterContent,
  toGeneratedCoverLetterContent,
} from "./cover-letter-route-generation-support";

const testParsesFencedJsonResponses = () => {
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
};

const testFallsBackToLineParsing = () => {
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
};

const testParsesJsonLikeQuotedSegments = () => {
  test("parses JSON-like quoted segments when the model wraps the payload in raw braces", () => {
    const result = toGeneratedCoverLetterContent(
      [
        "{",
        '  "introduction": "Dear Hiring Manager,\\n\\nI am excited to apply.",',
        '  "body": "I build gameplay systems with Bun and TypeScript.\\nI collaborate across design and engineering.",',
        '  "conclusion": "Thank you for your consideration."',
        "}",
      ].join("\n"),
    );

    expect(result).toEqual({
      introduction: "Dear Hiring Manager,\n\nI am excited to apply.",
      body: "I build gameplay systems with Bun and TypeScript.\nI collaborate across design and engineering.",
      conclusion: "Thank you for your consideration.",
    });
  });
};

const testParsesReasoningStyleDraftSections = () => {
  test("parses reasoning-style draft sections when the local model leaves content empty", () => {
    const result = toGeneratedCoverLetterContent(
      [
        "The model drafted the following cover letter:",
        "",
        "*Introduction*: Dear Hiring Manager, I am excited to apply for the AI Gameplay Engineer role at Studio Hash.",
        "",
        "*Body*: I have shipped gameplay systems with Bun and TypeScript, and I collaborate closely with design teams to tune combat feel and live-service progression.",
        "",
        "*Conclusion*: Thank you for your consideration, and I would welcome the chance to discuss the role further.",
      ].join("\n"),
    );

    expect(result).toEqual({
      introduction:
        "Dear Hiring Manager, I am excited to apply for the AI Gameplay Engineer role at Studio Hash.",
      body: "I have shipped gameplay systems with Bun and TypeScript, and I collaborate closely with design teams to tune combat feel and live-service progression.",
      conclusion:
        "Thank you for your consideration, and I would welcome the chance to discuss the role further.",
    });
  });
};

const testStripsReasoningTails = () => {
  test("strips bullet prefixes and numbered reasoning tails from parsed sections", () => {
    const result = toGeneratedCoverLetterContent(
      [
        "*Introduction*: * Dear Hiring Team at Studio Hash, I am excited to apply.",
        "",
        "*Body*: * I build gameplay systems with Bun and TypeScript.",
        "",
        "*Conclusion*: * Thank you for your time and consideration.",
        "",
        "4.  **Review against constraints:**",
        "    * JSON format: Yes.",
      ].join("\n"),
    );

    expect(result).toEqual({
      introduction: "Dear Hiring Team at Studio Hash, I am excited to apply.",
      body: "I build gameplay systems with Bun and TypeScript.",
      conclusion: "Thank you for your time and consideration.",
    });
  });
};

const testParsesPartialFencedJson = () => {
  test("parses partial fenced JSON when the model truncates before closing the block", () => {
    const result = toGeneratedCoverLetterContent(
      [
        "```json",
        "{",
        '  "introduction": "Dear Hiring Manager, I am excited to apply for the AI Gameplay Engineer role at Studio Hash.",',
        '  "body": "I build gameplay systems with Bun and TypeScript for live game teams.',
      ].join("\n"),
    );

    expect(result).toEqual({
      introduction:
        "Dear Hiring Manager, I am excited to apply for the AI Gameplay Engineer role at Studio Hash.",
      body: "I build gameplay systems with Bun and TypeScript for live game teams.",
      conclusion: "",
    });
  });
};

const testStripsEditorialCleanupArtifacts = () => {
  test("strips leading quotes and trailing editorial commentary from generated sections", () => {
    const result = toGeneratedCoverLetterContent(
      [
        '"Introduction": "\\"Dear Hiring Manager, I am excited to apply for the Gameplay Systems Engineer role.\\""',
        '"Body": "I build encounter systems and collaborate across design, engineering, and QA."',
        '"Conclusion": "\\"Joining Studio Hash would let me keep shipping player-focused systems.\\" (Good, covers goals)."',
      ].join("\n"),
    );

    expect(result).toEqual({
      introduction:
        "Dear Hiring Manager, I am excited to apply for the Gameplay Systems Engineer role.",
      body: "I build encounter systems and collaborate across design, engineering, and QA.",
      conclusion: "Joining Studio Hash would let me keep shipping player-focused systems.",
    });
  });
};

describe("toGeneratedCoverLetterContent", () => {
  testParsesFencedJsonResponses();
  testFallsBackToLineParsing();
  testParsesJsonLikeQuotedSegments();
  testParsesReasoningStyleDraftSections();
  testStripsReasoningTails();
  testParsesPartialFencedJson();
  testStripsEditorialCleanupArtifacts();
});

describe("ensureCompleteCoverLetterContent", () => {
  test("replaces planning artifacts with fallback copy", () => {
    const result = ensureCompleteCoverLetterContent(
      {
        introduction: "Dear Hiring Team,",
        body: "Gameplay systems paragraph.",
        conclusion: "~50 words. Total: ~190 words. Well under the 400-word limit.",
      },
      {
        company: "Studio Hash",
        position: "AI Gameplay Engineer",
      },
      {
        promptContext: "",
        summary: "I build combat systems for online action games.",
        experienceHighlight: "Gameplay Programmer at Test Studio",
        skills: ["TypeScript", "Bun"],
      },
    );

    expect(result.conclusion).toBe(
      "Thank you for your consideration. I would welcome the chance to discuss how my background aligns with the AI Gameplay Engineer role at Studio Hash.",
    );
  });

  test("avoids duplicate punctuation in fallback experience copy", () => {
    const result = ensureCompleteCoverLetterContent(
      {
        introduction: "",
        body: "",
        conclusion: "",
      },
      {
        company: "Studio Hash",
        position: "AI Gameplay Engineer",
      },
      {
        promptContext: "",
        summary: "I build combat systems for online action games.",
        experienceHighlight: "Gameplay Programmer at Test Studio, shipped combat systems.",
        skills: ["TypeScript", "Bun"],
      },
    );

    expect(result.body).toContain(
      "Most recently, I worked as Gameplay Programmer at Test Studio, shipped combat systems.",
    );
    expect(result.body).not.toContain("systems..");
  });
});
