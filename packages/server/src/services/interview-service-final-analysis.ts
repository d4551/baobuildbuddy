import {
  AI_DEFAULT_TEMPERATURE_INTERVIEW,
  AI_MAX_TOKENS_QUESTION,
} from "@bao/shared/constants/ai-generation";
import { API_ERROR_AI_OPERATION_TIMEOUT } from "@bao/shared/constants/api-errors";
import { COUNT_FIVE } from "@bao/shared/constants/numeric";
import {
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
} from "@bao/shared/constants/score-thresholds";
import type {
  InterviewAnalysis,
  InterviewConfig,
  InterviewResponse,
} from "@bao/shared/types/interview";
import { resolveInterviewAnalysisProvenance } from "@bao/shared/utils/interview-analysis-provenance";
import { settle } from "@bao/shared/utils/promise";
import { isRecord } from "@bao/shared/utils/type-guards";
import { interviewPersonaPrompt } from "./ai/prompts-interview";
import { withAiOperationTimeout } from "./interview-service-ai";
import { createAIService, resolveCandidateInterviewContext } from "./interview-service-context";
import type { FinalAnalysisPromptContext, StudioContext } from "./interview-service-contracts";
import { normalizeScore } from "./interview-service-normalizers";
import {
  buildCandidatePromptContext,
  buildInterviewerPersona,
  buildJobPromptContext,
  buildStudioPromptContext,
} from "./interview-service-prompt-context";
import { parseStringArray, safeParseJSON } from "./interview-service-value-parsers";

function calculateDefaultAnalysis(responses: InterviewResponse[]): InterviewAnalysis {
  if (responses.length === 0) {
    return {
      overallScore: 0,
      strengths: [],
      improvements: ["Complete all responses for a full analysis."],
      recommendations: ["Answer with measurable outcomes and concrete examples."],
      feedback: "No responses were recorded.",
    };
  }

  const validScores = responses
    .map((entry) => entry.aiAnalysis?.score)
    .filter((value): value is number => typeof value === "number");
  const average =
    validScores.length > 0
      ? Math.round(validScores.reduce((sum, value) => sum + value, 0) / validScores.length)
      : 0;

  const strengths = Array.from(
    new Set(responses.flatMap((response) => response.aiAnalysis?.strengths || [])),
  );
  const improvements = Array.from(
    new Set(responses.flatMap((response) => response.aiAnalysis?.improvements || [])),
  );

  return {
    overallScore: average,
    strengths: strengths.slice(0, COUNT_FIVE),
    improvements: improvements.slice(0, COUNT_FIVE),
    recommendations: resolveFinalAnalysisRecommendations(average),
    feedback: resolveFinalAnalysisFeedback(average),
  };
}

function resolveFinalAnalysisRecommendations(average: number): string[] {
  if (average >= SCORE_PASS_THRESHOLD) {
    return ["Sustain your structured communication and add extra quantification."];
  }
  if (average >= SCORE_WARNING_THRESHOLD) {
    return ["Work on measurable examples and deeper technical justification."];
  }
  return ["Practice response structure using situation, action, result examples."];
}

function resolveFinalAnalysisFeedback(average: number): string {
  if (average >= SCORE_PASS_THRESHOLD) {
    return "Strong session across technical and behavioral areas.";
  }
  return "Good foundation; improve depth, metrics, and real project examples.";
}

function buildFinalAnalysisPrompt({
  studio,
  config,
  responses,
  persona,
  candidateContext,
}: FinalAnalysisPromptContext): string {
  const responseLines = responses.map(
    (response, index) =>
      `Q${index + 1}: "${response.questionId}"\nA${index + 1}: ${response.transcript}`,
  );

  return `${interviewPersonaPrompt({
    role: config.targetJob?.title || config.roleType,
    company: config.targetJob?.company || studio.name,
    personality: persona.name,
    interviewStyle: studio.interviewStyle,
    focusAreas: config.focusAreas,
  })}
Interview mode: ${config.interviewMode || "studio"}
Conversation style: ${candidateContext.conversationStyle}
${buildStudioPromptContext(studio)}
${buildJobPromptContext(config)}
${buildCandidatePromptContext(candidateContext)}
You are analyzing the following interview responses.

Responses:
${responseLines.join("\n")}

Return strict JSON only:
{
  "overallScore": 0-100,
  "strengths": ["..."],
  "improvements": ["..."],
  "recommendations": ["..."],
  "feedback": "Short summary"
}
`;
}

function normalizeFinalFromAI(raw: unknown): InterviewAnalysis | null {
  const parsed = safeParseJSON(raw) ?? {
    overallScore: Number.NaN,
    strengths: [],
    improvements: [],
    recommendations: [],
  };

  if (!isRecord(parsed)) {
    return null;
  }
  if (typeof parsed.overallScore !== "number" || !Number.isFinite(parsed.overallScore)) {
    return null;
  }

  const feedback = typeof parsed.feedback === "string" ? parsed.feedback : "";
  return {
    overallScore: normalizeScore(parsed.overallScore),
    strengths: parseStringArray(parsed.strengths),
    improvements: parseStringArray(parsed.improvements),
    recommendations: parseStringArray(parsed.recommendations),
    ...(feedback ? { feedback } : {}),
  };
}

/**
 * Stamp session-level provenance onto an analysis so the UI can state whether
 * the feedback came from a real AI provider, a heuristic fallback, or a mix.
 */
function withAnalysisProvenance(
  analysis: InterviewAnalysis,
  responses: readonly InterviewResponse[],
): InterviewAnalysis {
  const provenance = resolveInterviewAnalysisProvenance(responses);
  return {
    ...analysis,
    analysisSource: provenance.analysisSource,
    aiAverageScore: provenance.aiAverageScore,
    provenanceCounts: provenance.provenanceCounts,
  };
}

export async function generateFinalAnalysis(
  session: { config: InterviewConfig; responses: InterviewResponse[] },
  studio: StudioContext,
): Promise<InterviewAnalysis> {
  const persona = buildInterviewerPersona(studio, session.config);
  const candidateContext = await resolveCandidateInterviewContext(session.config);
  const prompt = buildFinalAnalysisPrompt({
    studio,
    config: session.config,
    responses: session.responses,
    persona,
    candidateContext,
  });
  const aiServiceResult = await settle(createAIService());
  if (aiServiceResult.status === "rejected") {
    return withAnalysisProvenance(calculateDefaultAnalysis(session.responses), session.responses);
  }

  const response = (await withAiOperationTimeout(() =>
    aiServiceResult.value.generate(prompt, {
      purpose: "interviewFeedback",
      temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW,
      maxTokens: AI_MAX_TOKENS_QUESTION,
    }),
  )) ?? {
    error: API_ERROR_AI_OPERATION_TIMEOUT,
    content: "",
    provider: "none",
    id: "",
    timing: { startedAt: 0, completedAt: 0, totalTime: 0 },
  };

  if (response.error) {
    return withAnalysisProvenance(calculateDefaultAnalysis(session.responses), session.responses);
  }

  const parsed = normalizeFinalFromAI(response.content);
  if (parsed) {
    return withAnalysisProvenance(parsed, session.responses);
  }
  return withAnalysisProvenance(calculateDefaultAnalysis(session.responses), session.responses);
}
