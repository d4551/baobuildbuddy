import type {
  InterviewConfig,
  InterviewMode,
  InterviewSession,
  InterviewTargetJob,
} from "@bao/shared";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  INTERVIEW_FALLBACK_STUDIO_ID,
  isRecord,
  STATE_KEYS,
} from "@bao/shared";
import { useI18n } from "vue-i18n";
import { assertApiResponse, requireValue, withLoadingState } from "./async-flow";

const INTERVIEW_STATUS_VALUES = [
  "preparing",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

const INTERVIEW_QUESTION_TYPES = [
  "behavioral",
  "technical",
  "studio-specific",
  "intro",
  "closing",
] as const;

const INTERVIEW_QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;

type InterviewStatus = InterviewSession["status"];
type InterviewQuestionType = InterviewSession["questions"][number]["type"];
type InterviewQuestionDifficulty = InterviewSession["questions"][number]["difficulty"];

interface SubmitResponseInput {
  questionId?: string;
  questionIndex?: number;
  response: string;
}

interface InterviewState {
  sessions: ReturnType<typeof useState<InterviewSession[]>>;
  currentSession: ReturnType<typeof useState<InterviewSession | null>>;
  stats: ReturnType<typeof useState<Record<string, number> | null>>;
  loading: ReturnType<typeof useState<boolean>>;
}

interface InterviewContext extends InterviewState {
  api: ReturnType<typeof useApi>;
  t: ReturnType<typeof useI18n>["t"];
}

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === "string" && values.some((entry) => entry === value);

const asInterviewStatus = (value: unknown): InterviewStatus =>
  isOneOf(INTERVIEW_STATUS_VALUES, value) ? value : "active";

const asQuestionType = (value: unknown): InterviewQuestionType =>
  isOneOf(INTERVIEW_QUESTION_TYPES, value) ? value : "behavioral";

const asQuestionDifficulty = (value: unknown): InterviewQuestionDifficulty =>
  isOneOf(INTERVIEW_QUESTION_DIFFICULTIES, value) ? value : "medium";

const asInterviewMode = (value: unknown): InterviewMode => (value === "job" ? "job" : "studio");

const asInterviewTargetJob = (value: unknown): InterviewTargetJob | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const id = asString(value.id);
  const title = asString(value.title);
  const company = asString(value.company);
  const location = asString(value.location);
  if (!(id && title && company && location)) {
    return;
  }

  return {
    id,
    title,
    company,
    location,
    description: asString(value.description),
    requirements: asStringArray(value.requirements),
    technologies: asStringArray(value.technologies),
    source: asString(value.source),
    postedDate: asString(value.postedDate),
    url: asString(value.url),
  };
};

const toInterviewQuestion = (value: unknown): InterviewSession["questions"][number] | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const question = asString(value.question);
  if (!(id && question)) {
    return null;
  }

  const nextQuestion: InterviewSession["questions"][number] = {
    id,
    type: asQuestionType(value.type),
    question,
    followUps: asStringArray(value.followUps),
    expectedDuration: asNumber(value.expectedDuration) ?? 60,
    difficulty: asQuestionDifficulty(value.difficulty),
    tags: asStringArray(value.tags),
  };
  const score = asNumber(value.score);
  const feedback = asString(value.feedback);
  const response = asString(value.response);
  if (score !== undefined) {
    nextQuestion.score = score;
  }
  if (feedback !== undefined) {
    nextQuestion.feedback = feedback;
  }
  if (response !== undefined) {
    nextQuestion.response = response;
  }
  return nextQuestion;
};

const toInterviewQuestions = (value: unknown): InterviewSession["questions"] =>
  Array.isArray(value)
    ? value
        .map((entry) => toInterviewQuestion(entry))
        .filter((entry): entry is InterviewSession["questions"][number] => entry !== null)
    : [];

const toResponseAnalysis = (
  value: unknown,
): InterviewSession["responses"][number]["aiAnalysis"] | undefined => {
  if (!isRecord(value)) {
    return;
  }
  return {
    score: asNumber(value.score) ?? 0,
    feedback: asString(value.feedback) ?? "",
    strengths: asStringArray(value.strengths),
    improvements: asStringArray(value.improvements),
  };
};

const toInterviewResponse = (value: unknown): InterviewSession["responses"][number] | null => {
  if (!isRecord(value)) {
    return null;
  }

  const questionId = asString(value.questionId);
  const transcript = asString(value.transcript);
  if (!(questionId && transcript)) {
    return null;
  }

  const response: InterviewSession["responses"][number] = {
    questionId,
    transcript,
    duration: asNumber(value.duration) ?? 0,
    timestamp: asNumber(value.timestamp) ?? Date.now(),
    confidence: asNumber(value.confidence) ?? 0,
  };
  const analysis = toResponseAnalysis(value.aiAnalysis);
  if (analysis) {
    response.aiAnalysis = analysis;
  }
  return response;
};

const toInterviewResponses = (value: unknown): InterviewSession["responses"] =>
  Array.isArray(value)
    ? value
        .map((entry) => toInterviewResponse(entry))
        .filter((entry): entry is InterviewSession["responses"][number] => entry !== null)
    : [];

const toVoiceSettings = (value: unknown): InterviewConfig["voiceSettings"] | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const rate = asNumber(value.rate);
  const pitch = asNumber(value.pitch);
  const volume = asNumber(value.volume);
  const language = asString(value.language);
  if (rate === undefined || pitch === undefined || volume === undefined || !language) {
    return;
  }

  return {
    microphoneId: asString(value.microphoneId),
    speakerId: asString(value.speakerId),
    voiceId: asString(value.voiceId),
    rate,
    pitch,
    volume,
    language,
  };
};

const toInterviewConfig = (value: unknown, questionCount: number): InterviewSession["config"] => {
  const configRecord = isRecord(value) ? value : {};
  const config: InterviewSession["config"] = {
    roleType: asString(configRecord.roleType) ?? "Generalist",
    roleCategory: asString(configRecord.roleCategory),
    experienceLevel: asString(configRecord.experienceLevel) ?? "mid",
    focusAreas: asStringArray(configRecord.focusAreas),
    duration: asNumber(configRecord.duration) ?? 30,
    questionCount: asNumber(configRecord.questionCount) ?? questionCount,
    includeTechnical: asBoolean(configRecord.includeTechnical) ?? true,
    includeBehavioral: asBoolean(configRecord.includeBehavioral) ?? true,
    includeStudioSpecific: asBoolean(configRecord.includeStudioSpecific) ?? true,
    enableVoiceMode: asBoolean(configRecord.enableVoiceMode),
    technologies: asStringArray(configRecord.technologies),
    interviewMode: asInterviewMode(configRecord.interviewMode),
  };

  const voiceSettings = toVoiceSettings(configRecord.voiceSettings);
  if (voiceSettings) {
    config.voiceSettings = voiceSettings;
  }

  const targetJob = asInterviewTargetJob(configRecord.targetJob);
  if (targetJob) {
    config.targetJob = targetJob;
  }

  return config;
};

const toFinalAnalysis = (value: unknown): InterviewSession["finalAnalysis"] | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const feedback = asString(value.feedback);
  const analysis: NonNullable<InterviewSession["finalAnalysis"]> = {
    overallScore: asNumber(value.overallScore) ?? 0,
    strengths: asStringArray(value.strengths),
    improvements: asStringArray(value.improvements),
    recommendations: asStringArray(value.recommendations),
  };
  if (feedback !== undefined) {
    analysis.feedback = feedback;
  }
  return analysis;
};

const toInterviewerPersona = (
  value: unknown,
): InterviewSession["interviewerPersona"] | undefined => {
  if (!isRecord(value)) {
    return;
  }

  return {
    name: asString(value.name) ?? "",
    role: asString(value.role) ?? "",
    studioName: asString(value.studioName) ?? "",
    background: asString(value.background) ?? "",
    style: asString(value.style) ?? "",
    experience: asString(value.experience) ?? "",
  };
};

const toInterviewSession = (value: unknown): InterviewSession | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const studioId = asString(value.studioId);
  if (!(id && studioId)) {
    return null;
  }

  const questions = toInterviewQuestions(value.questions);
  const session: InterviewSession = {
    id,
    studioId,
    config: toInterviewConfig(value.config, questions.length),
    questions,
    currentQuestionIndex: asNumber(value.currentQuestionIndex) ?? 0,
    totalQuestions: asNumber(value.totalQuestions) ?? questions.length,
    startTime: asNumber(value.startTime) ?? Date.now(),
    endTime: asNumber(value.endTime),
    status: asInterviewStatus(value.status),
    responses: toInterviewResponses(value.responses),
    role: asString(value.role),
    studioName: asString(value.studioName),
    score: asNumber(value.score),
    duration: asString(value.duration),
    overallFeedback: asString(value.overallFeedback),
    totalResponses: asNumber(value.totalResponses),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };

  const finalAnalysis = toFinalAnalysis(value.finalAnalysis);
  if (finalAnalysis) {
    session.finalAnalysis = finalAnalysis;
  }

  const interviewerPersona = toInterviewerPersona(value.interviewerPersona);
  if (interviewerPersona) {
    session.interviewerPersona = interviewerPersona;
  }
  return session;
};

const toInterviewSessions = (value: unknown): InterviewSession[] =>
  Array.isArray(value)
    ? value
        .map((entry) => toInterviewSession(entry))
        .filter((entry): entry is InterviewSession => entry !== null)
    : [];

const toNumericRecord = (value: unknown): Record<string, number> | null => {
  if (!isRecord(value)) {
    return null;
  }
  const normalized: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      normalized[key] = entry;
    }
  }
  return normalized;
};

const requireSession = (value: unknown, invalidMessage: string): InterviewSession =>
  requireValue(toInterviewSession(value), invalidMessage);

const createInterviewState = (): InterviewState => ({
  sessions: useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []),
  currentSession: useState<InterviewSession | null>(
    STATE_KEYS.INTERVIEW_CURRENT_SESSION,
    () => null,
  ),
  stats: useState<Record<string, number> | null>(STATE_KEYS.INTERVIEW_STATS, () => null),
  loading: useState(STATE_KEYS.INTERVIEW_LOADING, () => false),
});

const createFetchSessionsAction = (context: InterviewContext) => async () =>
  withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.interview.sessions.get();
    assertApiResponse(error, context.t("apiErrors.interview.fetchSessionsFailed"));
    context.sessions.value = toInterviewSessions(data);
  });

const createFetchStatsAction = (context: InterviewContext) => async () =>
  withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.interview.stats.get();
    assertApiResponse(error, context.t("apiErrors.interview.fetchStatsFailed"));
    context.stats.value = toNumericRecord(data);
  });

const createStartSessionAction =
  (context: InterviewContext, fetchSessions: () => Promise<void>) =>
  async (studioId?: string, config?: Partial<InterviewConfig>) =>
    withLoadingState(context.loading, async () => {
      const resolvedStudioId = studioId?.trim().length ? studioId : INTERVIEW_FALLBACK_STUDIO_ID;
      const { data, error } = await context.api.interview.sessions.post({
        studioId: resolvedStudioId,
        config,
      });
      assertApiResponse(error, context.t("apiErrors.interview.startFailed"));
      const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
      context.currentSession.value = normalized;
      await fetchSessions();
      return normalized;
    });

const createGetSessionAction = (context: InterviewContext) => async (id: string) =>
  withLoadingState(context.loading, async () => {
    const { data, error } = await context.api.interview.sessions({ id }).get();
    assertApiResponse(error, context.t("apiErrors.interview.fetchSessionFailed"));
    const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
    context.currentSession.value = normalized;
    return normalized;
  });

const createSubmitResponseAction =
  (context: InterviewContext) => async (sessionId: string, response: SubmitResponseInput) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.interview
        .sessions({ id: sessionId })
        .response.post(response);
      assertApiResponse(error, context.t("apiErrors.interview.submitResponseFailed"));
      const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
      context.currentSession.value = normalized;
      return normalized;
    });

const createCompleteSessionAction =
  (
    context: InterviewContext,
    fetchSessions: () => Promise<void>,
    fetchStats: () => Promise<void>,
  ) =>
  async (id: string) =>
    withLoadingState(context.loading, async () => {
      const { data, error } = await context.api.interview.sessions({ id }).complete.post();
      assertApiResponse(error, context.t("apiErrors.interview.completeFailed"));
      const normalized = requireSession(data, context.t("apiErrors.interview.invalidPayload"));
      context.currentSession.value = normalized;
      await fetchSessions();
      await fetchStats();
      return normalized;
    });

/**
 * Interview practice session management composable.
 */
export function useInterview() {
  const state = createInterviewState();
  const context: InterviewContext = {
    ...state,
    api: useApi(),
    t: useI18n().t,
  };

  const fetchSessions = createFetchSessionsAction(context);
  const fetchStats = createFetchStatsAction(context);
  const actions = {
    startSession: createStartSessionAction(context, fetchSessions),
    fetchSessions,
    getSession: createGetSessionAction(context),
    submitResponse: createSubmitResponseAction(context),
    completeSession: createCompleteSessionAction(context, fetchSessions, fetchStats),
    fetchStats,
  };

  return {
    sessions: readonly(state.sessions),
    currentSession: readonly(state.currentSession),
    stats: readonly(state.stats),
    loading: readonly(state.loading),
    ...actions,
  };
}
