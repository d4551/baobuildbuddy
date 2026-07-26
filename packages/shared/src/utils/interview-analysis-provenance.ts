/**
 * Interview analysis provenance.
 *
 * Every per-response analysis records whether it came from a real AI provider
 * or a heuristic fallback, so session summaries can state their source instead
 * of implying AI review the product never performed.
 */
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
 * Normalizes a persisted analysis source tag. Rows written before provenance
 * tracking carry no marker and read as "unknown" rather than claiming AI.
 * Generic rather than taking a wide escape-hatch type so callers keep theirs.
 *
 * @param value Raw stored source value.
 * @returns Canonical analysis source.
 */
export const resolveInterviewAnalysisSource = <T>(value: T): InterviewAnalysisSource => {
  if (value === "ai") {
    return "ai";
  }
  if (value === "heuristic") {
    return "heuristic";
  }
  return "unknown";
};

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
 *
 * @param responses Responses whose analyses should be summarized.
 * @returns Session-level provenance summary.
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
    aiAverageScore: provenanceCounts.ai > 0 ? Math.round(aiScoreTotal / provenanceCounts.ai) : null,
    provenanceCounts,
  };
};
