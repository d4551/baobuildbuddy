import type {
  InterviewConfig,
  InterviewMode,
  InterviewSession,
  InterviewTargetJob,
} from "@bao/shared";
import {
  INTERVIEW_FALLBACK_STUDIO_ID,
  STATE_KEYS,
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  isRecord,
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
  if (!isRecord(value)) return undefined;
  const id = asString(value.id);
  const title = asString(value.title);
  const company = asString(value.company);
  const location = asString(value.location);
  if (!id || !title || !company || !location) return undefined;

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

const toInterviewSession = (value: unknown): InterviewSession | null => {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const studioId = asString(value.studioId);
  if (!id || !studioId) return null;

  const configRecord = isRecord(value.config) ? value.config : {};
  const voiceSettingsRecord = isRecord(configRecord.voiceSettings)
    ? configRecord.voiceSettings
    : null;

  const questions: InterviewSession["questions"] = [];
  if (Array.isArray(value.questions)) {
    for (const entry of value.questions) {
      if (!isRecord(entry)) continue;
      const questionId = asString(entry.id);
      const questionText = asString(entry.question);
      if (!questionId || !questionText) continue;

      const nextQuestion: InterviewSession["questions"][number] = {
        id: questionId,
        type: asQuestionType(entry.type),
        question: questionText,
        followUps: asStringArray(entry.followUps),
        expectedDuration: asNumber(entry.expectedDuration) ?? 60,
        difficulty: asQuestionDifficulty(entry.difficulty),
        tags: asStringArray(entry.tags),
      };

      const score = asNumber(entry.score);
      const feedback = asString(entry.feedback);
      const response = asString(entry.response);
      if (score !== undefined) nextQuestion.score = score;
      if (feedback !== undefined) nextQuestion.feedback = feedback;
      if (response !== undefined) nextQuestion.response = response;

      questions.push(nextQuestion);
    }
  }

  const responses: InterviewSession["responses"] = [];
  if (Array.isArray(value.responses)) {
    for (const entry of value.responses) {
      if (!isRecord(entry)) continue;
      const questionId = asString(entry.questionId);
      const transcript = asString(entry.transcript);
      if (!questionId || !transcript) continue;

      const nextResponse: InterviewSession["responses"][number] = {
        questionId,
        transcript,
        duration: asNumber(entry.duration) ?? 0,
        timestamp: asNumber(entry.timestamp) ?? Date.now(),
        confidence: asNumber(entry.confidence) ?? 0,
      };

      const analysisRecord = isRecord(entry.aiAnalysis) ? entry.aiAnalysis : null;
      if (analysisRecord) {
        nextResponse.aiAnalysis = {
          score: asNumber(analysisRecord.score) ?? 0,
          feedback: asString(analysisRecord.feedback) ?? "",
          strengths: asStringArray(analysisRecord.strengths),
          improvements: asStringArray(analysisRecord.improvements),
        };
      }

      responses.push(nextResponse);
    }
  }

  const finalAnalysisRecord = isRecord(value.finalAnalysis) ? value.finalAnalysis : null;
  const interviewerPersonaRecord = isRecord(value.interviewerPersona)
    ? value.interviewerPersona
    : null;

  const normalizedConfig: InterviewSession["config"] = {
    roleType: asString(configRecord.roleType) ?? "Generalist",
    roleCategory: asString(configRecord.roleCategory),
    experienceLevel: asString(configRecord.experienceLevel) ?? "mid",
    focusAreas: asStringArray(configRecord.focusAreas),
    duration: asNumber(configRecord.duration) ?? 30,
    questionCount: asNumber(configRecord.questionCount) ?? questions.length,
    includeTechnical: asBoolean(configRecord.includeTechnical) ?? true,
    includeBehavioral: asBoolean(configRecord.includeBehavioral) ?? true,
    includeStudioSpecific: asBoolean(configRecord.includeStudioSpecific) ?? true,
    enableVoiceMode: asBoolean(configRecord.enableVoiceMode),
    technologies: asStringArray(configRecord.technologies),
    interviewMode: asInterviewMode(configRecord.interviewMode),
    targetJob: asInterviewTargetJob(configRecord.targetJob),
  };
  if (
    voiceSettingsRecord &&
    typeof voiceSettingsRecord.rate === "number" &&
    typeof voiceSettingsRecord.pitch === "number" &&
    typeof voiceSettingsRecord.volume === "number" &&
    typeof voiceSettingsRecord.language === "string"
  ) {
    normalizedConfig.voiceSettings = {
      microphoneId: asString(voiceSettingsRecord.microphoneId),
      speakerId: asString(voiceSettingsRecord.speakerId),
      voiceId: asString(voiceSettingsRecord.voiceId),
      rate: voiceSettingsRecord.rate,
      pitch: voiceSettingsRecord.pitch,
      volume: voiceSettingsRecord.volume,
      language: voiceSettingsRecord.language,
    };
  }

  const finalAnalysis = finalAnalysisRecord
    ? (() => {
        const feedback = asString(finalAnalysisRecord.feedback);
        return {
          overallScore: asNumber(finalAnalysisRecord.overallScore) ?? 0,
          strengths: asStringArray(finalAnalysisRecord.strengths),
          improvements: asStringArray(finalAnalysisRecord.improvements),
          recommendations: asStringArray(finalAnalysisRecord.recommendations),
          ...(feedback ? { feedback } : {}),
        };
      })()
    : null;
  const interviewerPersona = interviewerPersonaRecord
    ? {
        name: asString(interviewerPersonaRecord.name) ?? "",
        role: asString(interviewerPersonaRecord.role) ?? "",
        studioName: asString(interviewerPersonaRecord.studioName) ?? "",
        background: asString(interviewerPersonaRecord.background) ?? "",
        style: asString(interviewerPersonaRecord.style) ?? "",
        experience: asString(interviewerPersonaRecord.experience) ?? "",
      }
    : null;

  return {
    id,
    studioId,
    config: normalizedConfig,
    questions,
    currentQuestionIndex: asNumber(value.currentQuestionIndex) ?? 0,
    totalQuestions: asNumber(value.totalQuestions) ?? questions.length,
    startTime: asNumber(value.startTime) ?? Date.now(),
    endTime: asNumber(value.endTime),
    status: asInterviewStatus(value.status),
    responses,
    ...(finalAnalysis ? { finalAnalysis } : {}),
    ...(interviewerPersona ? { interviewerPersona } : {}),
    role: asString(value.role),
    studioName: asString(value.studioName),
    score: asNumber(value.score),
    duration: asString(value.duration),
    overallFeedback: asString(value.overallFeedback),
    totalResponses: asNumber(value.totalResponses),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

const toInterviewSessions = (value: unknown): InterviewSession[] =>
  Array.isArray(value)
    ? value
        .map((entry) => toInterviewSession(entry))
        .filter((entry): entry is InterviewSession => entry !== null)
    : [];

const toNumericRecord = (value: unknown): Record<string, number> | null => {
  if (!isRecord(value)) return null;
  const normalized: Record<string, number> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      normalized[key] = entry;
    }
  }
  return normalized;
};

/**
 * Interview practice session management composable.
 */
export function useInterview() {
  const api = useApi();
  const { t } = useI18n();
  const sessions = useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []);
  const currentSession = useState<InterviewSession | null>(
    STATE_KEYS.INTERVIEW_CURRENT_SESSION,
    () => null,
  );
  const stats = useState<Record<string, number> | null>(STATE_KEYS.INTERVIEW_STATS, () => null);
  const loading = useState(STATE_KEYS.INTERVIEW_LOADING, () => false);

  async function startSession(studioId?: string, config?: Partial<InterviewConfig>) {
    return withLoadingState(loading, async () => {
      const resolvedStudioId = studioId?.trim().length ? studioId : INTERVIEW_FALLBACK_STUDIO_ID;
      const { data, error } = await api.interview.sessions.post({
        studioId: resolvedStudioId,
        config,
      });
      assertApiResponse(error, t("apiErrors.interview.startFailed"));
      const normalized = requireValue(
        toInterviewSession(data),
        t("apiErrors.interview.invalidPayload"),
      );
      currentSession.value = normalized;
      await fetchSessions();
      return normalized;
    });
  }

  async function fetchSessions() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.interview.sessions.get();
      assertApiResponse(error, t("apiErrors.interview.fetchSessionsFailed"));
      sessions.value = toInterviewSessions(data);
    });
  }

  async function getSession(id: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.interview.sessions({ id }).get();
      assertApiResponse(error, t("apiErrors.interview.fetchSessionFailed"));
      const normalized = requireValue(
        toInterviewSession(data),
        t("apiErrors.interview.invalidPayload"),
      );
      currentSession.value = normalized;
      return normalized;
    });
  }

  async function submitResponse(sessionId: string, response: SubmitResponseInput) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.interview
        .sessions({ id: sessionId })
        .response.post(response);
      assertApiResponse(error, t("apiErrors.interview.submitResponseFailed"));
      const normalized = requireValue(
        toInterviewSession(data),
        t("apiErrors.interview.invalidPayload"),
      );
      currentSession.value = normalized;
      return normalized;
    });
  }

  async function completeSession(id: string) {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.interview.sessions({ id }).complete.post();
      assertApiResponse(error, t("apiErrors.interview.completeFailed"));
      const normalized = requireValue(
        toInterviewSession(data),
        t("apiErrors.interview.invalidPayload"),
      );
      currentSession.value = normalized;
      await fetchSessions();
      await fetchStats();
      return normalized;
    });
  }

  async function fetchStats() {
    return withLoadingState(loading, async () => {
      const { data, error } = await api.interview.stats.get();
      assertApiResponse(error, t("apiErrors.interview.fetchStatsFailed"));
      stats.value = toNumericRecord(data);
    });
  }

  return {
    sessions: readonly(sessions),
    currentSession: readonly(currentSession),
    stats: readonly(stats),
    loading: readonly(loading),
    startSession,
    fetchSessions,
    getSession,
    submitResponse,
    completeSession,
    fetchStats,
  };
}
