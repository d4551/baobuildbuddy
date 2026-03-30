import {
  AI_DEFAULT_TEMPERATURE_INTERVIEW,
  AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS,
  AI_MAX_TOKENS_ANALYSIS,
  AI_MAX_TOKENS_QUESTION,
  API_ERROR_AI_NO_QUESTIONS,
  API_ERROR_AI_OPERATION_TIMEOUT,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  settle,
  toErrorMessage,
  type InterviewConfig,
  type InterviewQuestion,
  type InterviewResponse,
} from "@bao/shared";
import { createServerLogger } from "../utils/logger";
import type { CandidateInterviewContext, StudioContext } from "./interview-service-contracts";
import { createAIService, resolveCandidateInterviewContext } from "./interview-service-context";
import {
  buildFallbackNaturalQuestion,
  buildFallbackQuestions,
} from "./interview-service-fallback-questions";
import {
  buildNaturalNextQuestionPrompt,
  buildQuestionGenerationPrompt,
  buildSimpleQuestionPrompt,
} from "./interview-service-question-prompts";
import { withAiOperationTimeout } from "./interview-service-ai";
import { normalizeQuestions } from "./interview-service-normalizers";
import { safeParseJSON } from "./interview-service-value-parsers";

const interviewServiceQuestionsLogger = createServerLogger("interview-service-questions");

const mapQuestionSetToConfig = (raw: unknown): InterviewQuestion[] => {
  const parsed = safeParseJSON(raw);
  return normalizeQuestions(Array.isArray(parsed) ? parsed : []);
};

const normalizeSingleQuestion = (raw: unknown): InterviewQuestion | null =>
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

const createTimedOutQuestionResponse = () => ({
  error: API_ERROR_AI_OPERATION_TIMEOUT,
  content: "",
  provider: "none",
  id: "",
  timing: { startedAt: 0, completedAt: 0, totalTime: 0 },
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
  const response =
    (await withAiOperationTimeout(() =>
      input.aiService.generate(input.prompt, {
        purpose: "interviewQuestions",
        temperature: AI_DEFAULT_TEMPERATURE_INTERVIEW_QUESTIONS,
        maxTokens: AI_MAX_TOKENS_ANALYSIS,
      }),
    )) ?? createTimedOutQuestionResponse();

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
  const aiServiceResult = await settle(createAIService());
  if (aiServiceResult.status === "rejected") {
    return buildFallbackNaturalQuestion(session, studio, candidateContext);
  }

  const prompt = buildNaturalNextQuestionPrompt({
    studio,
    config: session.config,
    candidateContext,
    previousQuestion,
    latestResponse,
    responses: [...session.responses, latestResponse],
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
    return buildFallbackNaturalQuestion(session, studio, candidateContext);
  }

  const parsed = normalizeSingleQuestion(safeParseJSON(response.content));
  if (parsed) {
    return {
      ...parsed,
      id: `natural-${session.responses.length + 2}`,
    };
  }

  return buildFallbackNaturalQuestion(session, studio, candidateContext);
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
