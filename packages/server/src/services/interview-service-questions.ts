import {
  AI_DEFAULT_TEMPERATURE_INTERVIEW,
  AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS,
  AI_MAX_TOKENS_ANALYSIS,
  AI_MAX_TOKENS_QUESTION,
} from "@bao/shared/constants/ai-generation";
import {
  API_ERROR_AI_NO_QUESTIONS,
  API_ERROR_AI_OPERATION_TIMEOUT,
} from "@bao/shared/constants/api-errors";
import { INTERVIEW_DEFAULT_ROLE_TYPE } from "@bao/shared/constants/interview";
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
} from "@bao/shared/types/interview";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import type { JsonValue } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { createServerLogger } from "../utils/logger";
import { withAiOperationTimeout } from "./interview-service-ai";
import { createAIService, resolveCandidateInterviewContext } from "./interview-service-context";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
import {
  buildFallbackNaturalQuestion,
  buildFallbackQuestions,
} from "./interview-service-fallback-questions";
import { normalizeQuestions } from "./interview-service-normalizers";
import {
  buildNaturalNextQuestionPrompt,
  buildQuestionGenerationPrompt,
  buildSimpleQuestionPrompt,
} from "./interview-service-question-prompts";
import { safeParseJSON } from "./interview-service-value-parsers";

const interviewServiceQuestionsLogger = createServerLogger("interview-service-questions");

const mapQuestionSetToConfig = (raw: string): InterviewQuestion[] => {
  const parsed = safeParseJSON(raw);
  return normalizeQuestions(Array.isArray(parsed) ? parsed : []);
};

const normalizeSingleQuestion = (raw: JsonValue | null): InterviewQuestion | null =>
  normalizeQuestions([raw])[0] ?? null;

const filterGeneratedQuestions = (
  questions: InterviewQuestion[],
  config: InterviewConfig,
): InterviewQuestion[] =>
  questions.filter((question) => {
    if (question.type === "technical" && !config.includeTechnical) {
      return false;
    }
    if (question.type === "behavioral" && !config.includeBehavioral) {
      return false;
    }
    if (question.type === "studio-specific" && !config.includeStudioSpecific) {
      return false;
    }
    return true;
  });

const buildGeneratedQuestionSlice = (
  parsedQuestions: InterviewQuestion[],
  config: InterviewConfig,
  candidateContext: CandidateInterviewContext,
) => {
  const filtered = filterGeneratedQuestions(parsedQuestions, config);
  if (filtered.length === 0) {
    throw new Error(API_ERROR_AI_NO_QUESTIONS);
  }

  return filtered.slice(
    0,
    candidateContext.conversationStyle === "natural" ? 1 : config.questionCount,
  );
};

const tryGenerateQuestions = async (input: {
  aiService: Awaited<ReturnType<typeof createAIService>>;
  prompt: string;
  config: InterviewConfig;
  candidateContext: CandidateInterviewContext;
}): Promise<InterviewQuestion[]> => {
  const response = await withAiOperationTimeout(() =>
    input.aiService.generate(input.prompt, {
      purpose: "interviewQuestions",
      temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS,
      maxTokens: AI_MAX_TOKENS_ANALYSIS,
    }),
  );

  if (!response) {
    throw new Error(API_ERROR_AI_OPERATION_TIMEOUT);
  }
  if (response.error) {
    throw new Error(response.error);
  }

  return buildGeneratedQuestionSlice(
    mapQuestionSetToConfig(response.content),
    input.config,
    input.candidateContext,
  );
};

export async function generateNextNaturalQuestion(
  session: { config: InterviewConfig; responses: InterviewResponse[] },
  studio: StudioContext,
  latestResponse: InterviewResponse,
  previousQuestion: InterviewQuestion,
): Promise<InterviewQuestion | null> {
  const candidateContext = await resolveCandidateInterviewContext(session.config);
  // `session.responses` excludes the answer being processed, so indexing the
  // fallback pool by it re-asks the question the candidate just answered.
  const answeredSession = {
    config: session.config,
    responses: [...session.responses, latestResponse],
  };
  const aiServiceResult = await settle(createAIService());
  if (aiServiceResult.status === "rejected") {
    return buildFallbackNaturalQuestion(answeredSession, studio, candidateContext);
  }

  const prompt = buildNaturalNextQuestionPrompt({
    studio,
    config: session.config,
    candidateContext,
    previousQuestion,
    latestResponse,
    responses: answeredSession.responses,
  });

  const response =
    (await withAiOperationTimeout(() =>
      aiServiceResult.value.generate(prompt, {
        purpose: "interviewQuestions",
        temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW,
        maxTokens: AI_MAX_TOKENS_QUESTION,
      }),
    )) ?? null;

  if (!response || response.error) {
    return buildFallbackNaturalQuestion(answeredSession, studio, candidateContext);
  }

  const parsed = normalizeSingleQuestion(safeParseJSON(response.content));
  if (parsed) {
    return {
      ...parsed,
      id: `natural-${session.responses.length + 2}`,
    };
  }

  return buildFallbackNaturalQuestion(answeredSession, studio, candidateContext);
}

export async function generateQuestions(
  config: InterviewConfig,
  studio: StudioContext,
): Promise<InterviewQuestion[]> {
  const aiService = await createAIService();
  const candidateContext = await resolveCandidateInterviewContext(config);
  const fullPrompt = buildQuestionGenerationPrompt(studio, config, candidateContext);
  const role = config.targetJob?.title || config.roleType || INTERVIEW_DEFAULT_ROLE_TYPE;
  const level = config.experienceLevel;

  const primaryResult = await settle(
    tryGenerateQuestions({
      aiService,
      prompt: fullPrompt,
      config,
      candidateContext,
    }),
  );
  if (primaryResult.status === "fulfilled") {
    return primaryResult.value;
  }
  interviewServiceQuestionsLogger.warn(
    "AI question generation failed on primary prompt, attempting fallback prompt.",
    toErrorMessage(primaryResult.reason),
  );

  const fallbackResult = await settle(
    tryGenerateQuestions({
      aiService,
      prompt: buildSimpleQuestionPrompt(role, level, config.questionCount),
      config,
      candidateContext,
    }),
  );
  if (fallbackResult.status === "fulfilled") {
    return fallbackResult.value;
  }
  interviewServiceQuestionsLogger.warn(
    "AI question generation failed on fallback prompt, using deterministic local questions.",
    toErrorMessage(fallbackResult.reason),
  );

  return buildFallbackQuestions(config, studio, candidateContext);
}
