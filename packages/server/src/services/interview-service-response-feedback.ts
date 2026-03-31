import {
  AI_DEFAULT_TEMPERATURE_INTERVIEW,
  AI_MAX_TOKENS_FEEDBACK,
  API_ERROR_AI_OPERATION_TIMEOUT,
  type InterviewConfig,
  type InterviewQuestion,
  type InterviewResponse,
} from "@bao/shared";
import { interviewFeedbackPrompt, interviewPersonaPrompt } from "./ai/prompts-interview";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
import {
  buildCandidatePromptContext,
  buildInterviewerPersona,
  buildJobPromptContext,
  buildStudioPromptContext,
} from "./interview-service-prompt-context";
import { createAIService, resolveCandidateInterviewContext } from "./interview-service-context";
import { normalizeScore } from "./interview-service-normalizers";
import { isRecord, parseStringArray, safeParseJSON } from "./interview-service-value-parsers";
import { withAiOperationTimeout } from "./interview-service-ai";
import { settle } from "@bao/shared";

function fallbackResponseScore(transcript: string): number {
  const normalizedTranscript = transcript.trim().toLowerCase();
  const base = Math.min(90, 20 + Math.floor(normalizedTranscript.length / 7));
  if (normalizedTranscript.length < 80) {
    return Math.max(35, base - 25);
  }
  if (normalizedTranscript.includes("example") || normalizedTranscript.includes("result")) {
    return base + 12;
  }
  if (normalizedTranscript.includes("metric") || normalizedTranscript.includes("kpi")) {
    return base + 8;
  }
  return base;
}

function fallbackResponseFeedback(
  transcript: string,
): NonNullable<InterviewResponse["aiAnalysis"]> {
  return {
    score: fallbackResponseScore(transcript),
    feedback:
      transcript.length >= 140
        ? "Response shows useful depth and relevant structure."
        : "Add measurable outcomes and a clearer step-by-step breakdown.",
    strengths: ["Clear attempt to answer the asked question.", "Shows structured thinking."],
    improvements:
      transcript.length < 140
        ? ["Add specific examples and impact metrics."]
        : ["Keep responses concise and concrete."],
  };
}

function buildResponseFeedbackPrompt(input: {
  studio: StudioContext;
  config: InterviewConfig;
  candidateContext: CandidateInterviewContext;
  question: InterviewQuestion;
  responseText: string;
  priorResponses: InterviewResponse[];
}): string {
  const { studio, config, candidateContext, question, responseText, priorResponses } = input;
  const persona = buildInterviewerPersona(studio, config);

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

Prior answers:
${priorResponses.length > 0 ? priorResponses.map((response) => `- ${response.questionId}: ${response.transcript}`).join("\n") : "- None yet"}

Question asked:
${question.question}

Candidate response:
${responseText}

Return strict JSON only:
{
  "score": 0-100,
  "feedback": "One paragraph feedback",
  "strengths": ["..."],
  "improvements": ["..."]
}
Use the existing structure as baseline:
${interviewFeedbackPrompt(question.question, responseText)}
`;
}

function normalizeQuestionFeedback(
  raw: unknown,
): NonNullable<InterviewResponse["aiAnalysis"]> | null {
  if (!isRecord(raw)) {
    return null;
  }

  const parsedScore =
    typeof raw.score === "number"
      ? raw.score
      : typeof raw.score === "string"
        ? Number.parseInt(raw.score, 10)
        : Number.NaN;
  if (!Number.isFinite(parsedScore)) {
    return null;
  }

  return {
    score: normalizeScore(parsedScore),
    feedback: typeof raw.feedback === "string" && raw.feedback.trim() ? raw.feedback.trim() : "",
    strengths: parseStringArray(raw.strengths),
    improvements: parseStringArray(raw.improvements),
  };
}

export async function generateResponseFeedback(
  session: { config: InterviewConfig; responses: InterviewResponse[] },
  studio: StudioContext,
  question: InterviewQuestion,
  transcript: string,
): Promise<NonNullable<InterviewResponse["aiAnalysis"]>> {
  if (transcript.trim().length === 0) {
    return {
      score: 0,
      feedback: "Response is empty and cannot be assessed.",
      strengths: [],
      improvements: ["Provide a complete and structured response."],
    };
  }

  const candidateContext = await resolveCandidateInterviewContext(session.config);
  const prompt = buildResponseFeedbackPrompt({
    studio,
    config: session.config,
    candidateContext,
    question,
    responseText: transcript,
    priorResponses: session.responses,
  });
  const aiServiceResult = await settle(createAIService());
  if (aiServiceResult.status === "rejected") {
    return fallbackResponseFeedback(transcript);
  }

  const response = (await withAiOperationTimeout(() =>
    aiServiceResult.value.generate(prompt, {
      purpose: "interviewFeedback",
      temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW,
      maxTokens: AI_MAX_TOKENS_FEEDBACK,
    }),
  )) ?? {
    error: API_ERROR_AI_OPERATION_TIMEOUT,
    content: "",
    provider: "none",
    id: "",
    timing: { startedAt: 0, completedAt: 0, totalTime: 0 },
  };

  if (response.error) {
    return fallbackResponseFeedback(transcript);
  }

  const parsedPayload = safeParseJSON(response.content) ?? {
    score: Number.NaN,
    feedback: "",
    strengths: [],
    improvements: [],
  };
  const parsed = normalizeQuestionFeedback(parsedPayload);
  if (!parsed) {
    return fallbackResponseFeedback(transcript);
  }
  if (parsed.feedback === "") {
    parsed.feedback = "Good response with room for greater specificity.";
  }

  return parsed;
}
