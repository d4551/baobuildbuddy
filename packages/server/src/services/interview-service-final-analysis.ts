import {
  AI_DEFAULT_TEMPERATURE_INTERVIEW,
  AI_MAX_TOKENS_QUESTION,
} from "@bao/shared/constants/ai-generation";
import { API_ERROR_AI_OPERATION_TIMEOUT } from "@bao/shared/constants/api-errors";
import {
  SCORE_PASS_THRESHOLD,
  SCORE_WARNING_THRESHOLD,
} from "@bao/shared/constants/score-thresholds";
import type {
  InterviewAnalysis,
  InterviewConfig,
  InterviewResponse,
} from "@bao/shared/types/interview";
import { settle } from "@bao/shared/utils/promise";
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
import { isRecord, parseStringArray, safeParseJSON } from "./interview-service-value-parsers";

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
    strengths: strengths.slice(0, 5),
    improvements: improvements.slice(0, 5),
    recommendations: resolveFinalRecommendations(average),
    feedback:
      average >= SCORE_PASS_THRESHOLD
        ? "Strong session across technical and behavioral areas."
        : "Good foundation; improve depth, metrics, and real project examples.",
  };
}

function resolveFinalRecommendations(average: number): string[] {
  if (average >= SCORE_PASS_THRESHOLD) {
    return ["Sustain your structured communication and add extra quantification."];
  }
  if (average >= SCORE_WARNING_THRESHOLD) {
    return ["Work on measurable examples and deeper technical justification."];
  }
  return ["Practice response structure using situation, action, result examples."];
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
    return calculateDefaultAnalysis(session.responses);
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
    return calculateDefaultAnalysis(session.responses);
  }

  const parsed = normalizeFinalFromAI(response.content);
  if (parsed) {
    return parsed;
  }
  return calculateDefaultAnalysis(session.responses);
}
