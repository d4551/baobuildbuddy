import { describe, expect, test } from "bun:test";
import type { InterviewResponse } from "../types/interview";
import {
  resolveInterviewAnalysisAttributions,
  resolveInterviewAnalysisProvenance,
  resolveInterviewAnalysisSource,
} from "./interview-analysis-provenance";

type Analysis = NonNullable<InterviewResponse["aiAnalysis"]>;

const analyzed = (analysis: Partial<Analysis>): Pick<InterviewResponse, "aiAnalysis"> => ({
  aiAnalysis: {
    score: 0,
    feedback: "",
    strengths: [],
    improvements: [],
    source: "unknown",
    ...analysis,
  },
});

/** Averages asserted below, named so the arithmetic under test is explicit. */
const AI_AVERAGE_OF_EIGHTY_AND_NINETY = 85;
const AI_AVERAGE_OF_SINGLE_PERFECT_SCORE = 100;

describe("resolveInterviewAnalysisSource normalizes persisted markers", () => {
  test("keeps the two real markers", () => {
    expect(resolveInterviewAnalysisSource("ai")).toBe("ai");
    expect(resolveInterviewAnalysisSource("heuristic")).toBe("heuristic");
  });

  test("legacy rows without a marker never claim AI", () => {
    expect(resolveInterviewAnalysisSource(undefined)).toBe("unknown");
    expect(resolveInterviewAnalysisSource(null)).toBe("unknown");
    expect(resolveInterviewAnalysisSource("AI")).toBe("unknown");
    expect(resolveInterviewAnalysisSource(1)).toBe("unknown");
  });
});

describe("resolveInterviewAnalysisProvenance aggregates a session", () => {
  test("all-AI responses report an ai aggregate and an AI-only average", () => {
    const result = resolveInterviewAnalysisProvenance([
      analyzed({ source: "ai", score: 80 }),
      analyzed({ source: "ai", score: 90 }),
    ]);
    expect(result.analysisSource).toBe("ai");
    expect(result.aiAverageScore).toBe(AI_AVERAGE_OF_EIGHTY_AND_NINETY);
    expect(result.provenanceCounts).toEqual({ ai: 2, heuristic: 0, unknown: 0 });
  });

  test("all-heuristic responses report heuristic with no AI average", () => {
    const result = resolveInterviewAnalysisProvenance([
      analyzed({ source: "heuristic", score: 40 }),
    ]);
    expect(result.analysisSource).toBe("heuristic");
    expect(result.aiAverageScore).toBe(null);
    expect(result.provenanceCounts).toEqual({ ai: 0, heuristic: 1, unknown: 0 });
  });

  test("a mix reports mixed and averages only the AI-sourced scores", () => {
    const result = resolveInterviewAnalysisProvenance([
      analyzed({ source: "ai", score: 100 }),
      analyzed({ source: "heuristic", score: 0 }),
    ]);
    expect(result.analysisSource).toBe("mixed");
    expect(result.aiAverageScore).toBe(AI_AVERAGE_OF_SINGLE_PERFECT_SCORE);
    expect(result.provenanceCounts).toEqual({ ai: 1, heuristic: 1, unknown: 0 });
  });

  test("unattributed responses alone stay unknown, not AI", () => {
    const result = resolveInterviewAnalysisProvenance([analyzed({ score: 70 })]);
    expect(result.analysisSource).toBe("unknown");
    expect(result.aiAverageScore).toBe(null);
    expect(result.provenanceCounts).toEqual({ ai: 0, heuristic: 0, unknown: 1 });
  });

  test("an empty session is unknown with zeroed counts", () => {
    const result = resolveInterviewAnalysisProvenance([]);
    expect(result.analysisSource).toBe("unknown");
    expect(result.aiAverageScore).toBe(null);
    expect(result.provenanceCounts).toEqual({ ai: 0, heuristic: 0, unknown: 0 });
  });

  test("responses with no analysis at all are ignored entirely", () => {
    const result = resolveInterviewAnalysisProvenance([{}, analyzed({ source: "ai", score: 60 })]);
    expect(result.analysisSource).toBe("ai");
    expect(result.provenanceCounts).toEqual({ ai: 1, heuristic: 0, unknown: 0 });
  });
});

describe("resolveInterviewAnalysisAttributions names only real AI calls", () => {
  test("returns distinct provider/model pairs in first-seen order", () => {
    expect(
      resolveInterviewAnalysisAttributions([
        analyzed({ source: "ai", provider: "claude", model: "claude-opus-5" }),
        analyzed({ source: "ai", provider: "claude", model: "claude-opus-5" }),
        analyzed({ source: "ai", provider: "openai", model: "gpt-x" }),
      ]),
    ).toEqual([
      { provider: "claude", model: "claude-opus-5" },
      { provider: "openai", model: "gpt-x" },
    ]);
  });

  test("heuristic responses never contribute an attribution", () => {
    expect(
      resolveInterviewAnalysisAttributions([
        analyzed({ source: "heuristic", provider: "claude", model: "claude-opus-5" }),
      ]),
    ).toEqual([]);
  });

  test("AI responses with no recorded provider or model are omitted", () => {
    expect(resolveInterviewAnalysisAttributions([analyzed({ source: "ai" })])).toEqual([]);
  });

  test("a partial attribution still surfaces what is known", () => {
    expect(
      resolveInterviewAnalysisAttributions([analyzed({ source: "ai", provider: "local" })]),
    ).toEqual([{ provider: "local", model: "" }]);
  });

  test("an empty session yields no attributions", () => {
    expect(resolveInterviewAnalysisAttributions([])).toEqual([]);
  });
});
