import type {
  InterviewAnalysisAggregateSource,
  InterviewAnalysisProvenanceCounts,
  InterviewAnalysisSource,
  InterviewResponse,
} from "../types/interview";

/**
 * Aggregated provenance for a set of analyzed interview responses.
 */
export interface InterviewAnalysisProvenance {
  analysisSource: InterviewAnalysisAggregateSource;
  aiAverageScore: number | null;
  provenanceCounts: InterviewAnalysisProvenanceCounts;
}

type AnalyzableResponse = Pick<InterviewResponse, "aiAnalysis">;

/**
 * Normalizes a persisted analysis source tag; legacy rows without a stored
 * source read as "unknown".
 */
export const resolveInterviewAnalysisSource = (value: unknown): InterviewAnalysisSource =>
  value === "ai" || value === "heuristic" ? value : "unknown";

const resolveAggregateSource = (
  counts: InterviewAnalysisProvenanceCounts,
): InterviewAnalysisAggregateSource => {
  if (counts.ai > 0 && counts.heuristic === 0 && counts.unknown === 0) {
    return "ai";
  }
  if (counts.ai === 0 && counts.heuristic > 0 && counts.unknown === 0) {
    return "heuristic";
  }
  if (counts.ai === 0 && counts.heuristic === 0) {
    return "unknown";
  }
  return "mixed";
};

/**
 * Aggregates per-response analysis provenance into session-level fields.
 * `aiAverageScore` is the mean of AI-sourced response scores only, or null
 * when no response was analyzed by a real AI provider.
 */
export const resolveInterviewAnalysisProvenance = (
  responses: readonly AnalyzableResponse[],
): InterviewAnalysisProvenance => {
  const provenanceCounts: InterviewAnalysisProvenanceCounts = {
    ai: 0,
    heuristic: 0,
    unknown: 0,
  };
  let aiScoreTotal = 0;

  for (const response of responses) {
    const analysis = response.aiAnalysis;
    if (!analysis) {
      continue;
    }
    const source = resolveInterviewAnalysisSource(analysis.source);
    provenanceCounts[source] += 1;
    if (source === "ai") {
      aiScoreTotal += analysis.score;
    }
  }

  return {
    analysisSource: resolveAggregateSource(provenanceCounts),
    aiAverageScore:
      provenanceCounts.ai > 0 ? Math.round(aiScoreTotal / provenanceCounts.ai) : null,
    provenanceCounts,
  };
};
