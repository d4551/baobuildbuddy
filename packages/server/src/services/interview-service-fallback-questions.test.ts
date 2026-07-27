import type { InterviewConfig, InterviewResponse } from "@bao/shared/types/interview";
import { describe, expect, test } from "bun:test";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
import {
  buildFallbackNaturalQuestion,
  buildFallbackQuestions,
} from "./interview-service-fallback-questions";

const QUESTION_COUNT = 6;

const config: InterviewConfig = {
  roleType: "Game Developer",
  experienceLevel: "mid",
  focusAreas: ["architecture", "collaboration"],
  duration: 30,
  questionCount: QUESTION_COUNT,
  includeTechnical: true,
  includeBehavioral: true,
  includeStudioSpecific: true,
  conversationStyle: "natural",
};

const studio: StudioContext = {
  id: "moon-studios",
  name: "Moon Studios",
  description: "Indie studio",
  interviewStyle: "conversational",
  technologies: [],
  games: [],
  culture: {},
  location: "Remote",
  type: "indie",
  remoteWork: true,
};

const candidateContext: CandidateInterviewContext = {
  conversationStyle: "natural",
  profileSummary: "",
  resumeSummary: "",
  coverLetterSummary: "",
  portfolioSummary: "",
};

const response = (id: string): InterviewResponse =>
  ({
    questionId: id,
    transcript: "An answer long enough to count as a real response.",
  }) as InterviewResponse;

describe("buildFallbackQuestions", () => {
  test("never asks the same question twice, even when seeds share a type", () => {
    const questions = buildFallbackQuestions(config, studio, candidateContext);
    expect(questions).toHaveLength(QUESTION_COUNT);
    const texts = questions.map((question) => question.question);
    expect(new Set(texts).size).toBe(texts.length);
  });

  test("does not emit the malformed 'a system from a ...' phrasing", () => {
    const questions = buildFallbackQuestions(config, studio, candidateContext);
    expect(questions.some((question) => question.question.includes("a system from a"))).toBe(false);
  });
});

describe("buildFallbackNaturalQuestion", () => {
  test("advances past the answered question instead of repeating it", () => {
    const asked = buildFallbackQuestions(config, studio, candidateContext);
    // Callers pass the session with the just-submitted answer already appended.
    const next = buildFallbackNaturalQuestion(
      { config, responses: [response(asked[0].id)] },
      studio,
      candidateContext,
    );
    expect(next).not.toBeNull();
    expect(next?.question).not.toBe(asked[0].question);
  });
});
