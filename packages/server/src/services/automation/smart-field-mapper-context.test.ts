import { describe, expect, test } from "bun:test";
import { getCandidateContextSummary } from "./smart-field-mapper-context";
import type { SmartFieldAnalysisContext } from "./smart-field-mapper-contracts";

type CandidateSummary = {
  personalInfo?: { name?: string; email?: string };
  summary?: string;
  skills?: { technical?: string[] };
  jobContext?: string;
  studioContext?: string;
  skillContext?: string;
  profileContext?: string;
  portfolioContext?: string;
};

const parseSummary = (summary: string): CandidateSummary =>
  JSON.parse(summary) as CandidateSummary;

const buildContext = (
  overrides: Partial<SmartFieldAnalysisContext> = {},
): SmartFieldAnalysisContext => ({
  resume: {
    personalInfo: { name: "Jane Candidate", email: "jane@example.test" },
    summary: "Gameplay engineer",
    skills: { technical: ["C++"] },
  },
  coverLetter: null,
  existingAnswers: {},
  ...overrides,
});

describe("getCandidateContextSummary", () => {
  test("includes resume personal info, summary, and skills by default", () => {
    const summary = getCandidateContextSummary(buildContext());
    const parsed = parseSummary(summary);
    expect(parsed.personalInfo?.name).toBe("Jane Candidate");
    expect(parsed.personalInfo?.email).toBe("jane@example.test");
    expect(parsed.summary).toBe("Gameplay engineer");
    expect(parsed.skills?.technical).toContain("C++");
  });

  test("includes job, studio, skill, profile, and portfolio context when provided", () => {
    const summary = getCandidateContextSummary(
      buildContext({
        jobContext: "Job context:\n- Job title: Senior Gameplay Engineer",
        studioContext: "Studio context:\n- Name: Test Studio",
        skillContext: "Transferable skill context:\n- C++",
        profileContext: "User profile:\nlinkedin: https://linkedin.com/in/jane",
        portfolioContext: "Portfolio:\n- Indie Roguelike | live: https://jane.example/roguelike",
      }),
    );
    const parsed = parseSummary(summary);
    expect(parsed.jobContext).toContain("Senior Gameplay Engineer");
    expect(parsed.studioContext).toContain("Test Studio");
    expect(parsed.skillContext).toContain("C++");
    expect(parsed.profileContext).toContain("linkedin.com/in/jane");
    expect(parsed.portfolioContext).toContain("Indie Roguelike");
  });

  test("omits context fields when not provided so the AI is not handed undefined strings", () => {
    const summary = getCandidateContextSummary(buildContext());
    const parsed = parseSummary(summary);
    expect(parsed.jobContext).toBeUndefined();
    expect(parsed.studioContext).toBeUndefined();
    expect(parsed.skillContext).toBeUndefined();
    expect(parsed.profileContext).toBeUndefined();
    expect(parsed.portfolioContext).toBeUndefined();
  });
});
