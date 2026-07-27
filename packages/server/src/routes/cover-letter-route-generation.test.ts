import { afterEach, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { API_ERROR_COVER_LETTER_GENERATION_FAILED } from "@bao/shared/constants/api-errors";
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from "@bao/shared/constants/http";
import type { AIResponse } from "@bao/shared/types/ai";
import { REDACTED_SECRET_PLACEHOLDER } from "@bao/shared/utils/secret-redaction";
import { db, sqlite } from "../db/client";
import { initializeDatabase } from "../db/init";
import { jobs } from "../db/schema/jobs";
import { seedDatabase } from "../db/seed";
import { AIService } from "../services/ai/ai-service";
import type { RouteSetState } from "../types/route-state";
import { handleGenerateCoverLetter } from "./cover-letter-route-generation";
import {
  toGeneratedCoverLetterContent,
  validateGeneratedCoverLetterContent,
} from "./cover-letter-route-generation-support";

/** Minimal well-formed provider response; only `content` matters to these tests. */
const buildStubAiResponse = (): AIResponse => ({
  id: "stub-response",
  provider: "openai",
  model: "stub-model",
  content: '{"introduction":"a","body":"b","conclusion":"c"}',
});

const activeSpies: Array<{ mockRestore: () => void }> = [];
const trackSpy = <T extends { mockRestore: () => void }>(spy: T): T => {
  activeSpies.push(spy);
  return spy;
};

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

const testParsesPlainLineSegments = () => {
  test("parses plain multi-line content into introduction, body, and conclusion", () => {
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
  testParsesPlainLineSegments();
  testParsesJsonLikeQuotedSegments();
  testParsesReasoningStyleDraftSections();
  testStripsReasoningTails();
  testParsesPartialFencedJson();
  testStripsEditorialCleanupArtifacts();
});

describe("handleGenerateCoverLetter secret hygiene", () => {
  beforeAll(() => {
    initializeDatabase(sqlite);
    seedDatabase(db);
  });

  afterEach(() => {
    while (activeSpies.length > 0) {
      activeSpies.pop()?.mockRestore();
    }
  });

  test("AI generation failures omit provider secrets from the client response", async () => {
    const leakedSecret = "sk-proj-LEAKED_PROVIDER_SECRET_VALUE";
    const service = AIService.fromSettings(undefined);
    trackSpy(spyOn(service, "generate")).mockRejectedValue(
      new Error(`All providers failed to generate: openai: Invalid API key ${leakedSecret}`),
    );
    trackSpy(spyOn(AIService, "fromSettings")).mockReturnValue(service);

    const set: RouteSetState = { status: 200 };
    const result = await handleGenerateCoverLetter(
      { company: "Studio Hash", position: "Gameplay Engineer" },
      set,
    );

    expect(set.status).toBe(HTTP_STATUS_INTERNAL_SERVER_ERROR);
    expect(result).toEqual({ error: API_ERROR_COVER_LETTER_GENERATION_FAILED });
    expect(JSON.stringify(result)).not.toContain(leakedSecret);
    expect(JSON.stringify(result)).not.toContain("Invalid API key");
  });

  /**
   * The client response was already scrubbed, but the structured log kept the raw
   * provider message — so a rejected generation wrote a live key to stdout at
   * error level. Asserting the response alone let that through, so the log stream
   * is captured and asserted here too.
   */
  test("AI generation failures omit provider secrets from the structured log", async () => {
    const leakedSecret = "sk-proj-LEAKED_PROVIDER_SECRET_VALUE";
    const service = AIService.fromSettings(undefined);
    trackSpy(spyOn(service, "generate")).mockRejectedValue(
      new Error(`All providers failed to generate: openai: Invalid API key ${leakedSecret}`),
    );
    trackSpy(spyOn(AIService, "fromSettings")).mockReturnValue(service);

    const captured: string[] = [];
    const stdoutSpy = spyOn(process.stdout, "write").mockImplementation((chunk) => {
      captured.push(typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk));
      return true;
    });

    const set: RouteSetState = { status: 200 };
    await handleGenerateCoverLetter({ company: "Studio Hash", position: "Gameplay Engineer" }, set);
    stdoutSpy.mockRestore();

    const logStream = captured.join("");
    expect(logStream).toContain("Cover letter AI generation rejected");
    expect(logStream).not.toContain(leakedSecret);
    expect(logStream).toContain(REDACTED_SECRET_PLACEHOLDER);
  });

  registerPromptContextTests();
});

/**
 * The defect these cover: generation only ever saw `company`, `position` and a
 * caller-supplied `jobInfo` blob, so the scraped posting and the studio record in
 * the database never reached the prompt. Nothing asserted the prompt's contents, so
 * the suite stayed green while the model was context-blind.
 */
function registerPromptContextTests(): void {
  test("prompt carries the scraped job and its studio when jobId is supplied", async () => {
    const jobId = "cover-letter-context-job";
    await db.insert(jobs).values({
      id: jobId,
      title: "Senior Gameplay Engineer",
      company: "Riot Games",
      location: "Los Angeles, CA",
      description: "Own gameplay systems for a live-service title.",
      requirements: ["5+ years C++", "Multiplayer netcode"],
      technologies: ["C++", "Perforce"],
      source: "greenhouse",
    });

    const service = AIService.fromSettings(undefined);
    const generateSpy = trackSpy(spyOn(service, "generate")).mockResolvedValue(
      buildStubAiResponse(),
    );
    trackSpy(spyOn(AIService, "fromSettings")).mockReturnValue(service);

    const set: RouteSetState = { status: 200 };
    await handleGenerateCoverLetter(
      { company: "Riot Games", position: "Senior Gameplay Engineer", jobId },
      set,
    );

    const prompt = generateSpy.mock.calls[0]?.[0] ?? "";
    // Scraped posting facts.
    expect(prompt).toContain("Own gameplay systems for a live-service title.");
    expect(prompt).toContain("Multiplayer netcode");
    expect(prompt).toContain("greenhouse");
    // Studio resolved from the posting's company, carrying its real stack.
    expect(prompt).toContain("Studio context:");
    expect(prompt).toContain("Proprietary Engine");
  });

  test("prompt states job context is absent when no jobId is supplied", async () => {
    const service = AIService.fromSettings(undefined);
    const generateSpy = trackSpy(spyOn(service, "generate")).mockResolvedValue(
      buildStubAiResponse(),
    );
    trackSpy(spyOn(AIService, "fromSettings")).mockReturnValue(service);

    const set: RouteSetState = { status: 200 };
    await handleGenerateCoverLetter({ company: "Nowhere Co", position: "Designer" }, set);

    const prompt = generateSpy.mock.calls[0]?.[0] ?? "";
    expect(prompt).toContain("Nowhere Co");
    expect(prompt).not.toContain("Job context:");
    expect(prompt).not.toContain("Studio context:");
  });
}

describe("validateGeneratedCoverLetterContent", () => {
  test("fails loud when conclusion contains planning artifacts", () => {
    const result = validateGeneratedCoverLetterContent({
      introduction: "Dear Hiring Team, I am excited to apply for the AI Gameplay Engineer role.",
      body: "I build gameplay systems for live service titles.",
      conclusion: "~50 words. Total: ~190 words. Well under the 400-word limit.",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected incomplete cover letter content to fail validation");
    }
    expect(result.error.code).toBe("COVER_LETTER_INCOMPLETE_CONTENT");
    expect(result.error.missingSections).toContain("conclusion");
    expect(result.error.reasons.some((reason) => reason.includes("planning artifacts"))).toBe(true);
  });

  test("fails loud when generated sections are empty", () => {
    const result = validateGeneratedCoverLetterContent({
      introduction: "",
      body: "",
      conclusion: "",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected empty cover letter content to fail validation");
    }
    expect(result.error.missingSections).toEqual(["introduction", "body", "conclusion"]);
  });

  test("accepts complete generated letter sections", () => {
    const result = validateGeneratedCoverLetterContent({
      introduction:
        "Dear Studio Hash Team, I am excited to apply for the AI Gameplay Engineer role.",
      body: "I build combat systems for online action games. Most recently, I worked as Gameplay Programmer at Test Studio.",
      conclusion:
        "Thank you for your consideration. I would welcome the chance to discuss the role further.",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      throw new Error("Expected complete cover letter content to pass validation");
    }
    expect(result.data.introduction.length).toBeGreaterThan(0);
    expect(result.data.body.length).toBeGreaterThan(0);
    expect(result.data.conclusion.length).toBeGreaterThan(0);
  });
});
