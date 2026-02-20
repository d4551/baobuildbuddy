import type { InterviewSession } from "@bao/shared";
import { STATE_KEYS } from "@bao/shared";

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
  answer?: string;
  response?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === "string" && values.some((entry) => entry === value);

const asInterviewStatus = (value: unknown): InterviewStatus =>
  isOneOf(INTERVIEW_STATUS_VALUES, value) ? value : "active";

const asQuestionType = (value: unknown): InterviewQuestionType =>
  isOneOf(INTERVIEW_QUESTION_TYPES, value) ? value : "behavioral";

const asQuestionDifficulty = (value: unknown): InterviewQuestionDifficulty =>
  isOneOf(INTERVIEW_QUESTION_DIFFICULTIES, value) ? value : "medium";

const toInterviewSession = (value: unknown): InterviewSession | null => {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const studioId = asString(value.studioId);
  if (!id || !studioId) return null;

  const configRecord = isRecord(value.config) ? value.config : {};
  const voiceSettingsRecord = isRecord(configRecord.voiceSettings)
    ? configRecord.voiceSettings
    : null;

  const questions = Array.isArray(value.questions)
    ? value.questions
        .map((entry) => {
          if (!isRecord(entry)) return null;
          const questionId = asString(entry.id);
          const questionText = asString(entry.question);
          if (!questionId || !questionText) return null;
          return {
            id: questionId,
            type: asQuestionType(entry.type),
            question: questionText,
            followUps: asStringArray(entry.followUps),
            expectedDuration: asNumber(entry.expectedDuration) ?? 60,
            difficulty: asQuestionDifficulty(entry.difficulty),
            tags: asStringArray(entry.tags),
          };
        })
        .filter((entry): entry is InterviewSession["questions"][number] => entry !== null)
    : [];

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

  return {
    id,
    studioId,
    config: {
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
      voiceSettings:
        voiceSettingsRecord &&
        typeof voiceSettingsRecord.rate === "number" &&
        typeof voiceSettingsRecord.pitch === "number" &&
        typeof voiceSettingsRecord.volume === "number" &&
        typeof voiceSettingsRecord.language === "string"
          ? {
              microphoneId: asString(voiceSettingsRecord.microphoneId),
              speakerId: asString(voiceSettingsRecord.speakerId),
              voiceId: asString(voiceSettingsRecord.voiceId),
              rate: voiceSettingsRecord.rate,
              pitch: voiceSettingsRecord.pitch,
              volume: voiceSettingsRecord.volume,
              language: voiceSettingsRecord.language,
            }
          : undefined,
    },
    questions,
    currentQuestionIndex: asNumber(value.currentQuestionIndex) ?? 0,
    totalQuestions: asNumber(value.totalQuestions) ?? questions.length,
    startTime: asNumber(value.startTime) ?? Date.now(),
    endTime: asNumber(value.endTime),
    status: asInterviewStatus(value.status),
    responses,
    finalAnalysis: finalAnalysisRecord
      ? {
          overallScore: asNumber(finalAnalysisRecord.overallScore) ?? 0,
          strengths: asStringArray(finalAnalysisRecord.strengths),
          improvements: asStringArray(finalAnalysisRecord.improvements),
          recommendations: asStringArray(finalAnalysisRecord.recommendations),
          feedback: asString(finalAnalysisRecord.feedback),
        }
      : undefined,
    interviewerPersona: interviewerPersonaRecord
      ? {
          name: asString(interviewerPersonaRecord.name) ?? "",
          role: asString(interviewerPersonaRecord.role) ?? "",
          studioName: asString(interviewerPersonaRecord.studioName) ?? "",
          background: asString(interviewerPersonaRecord.background) ?? "",
          style: asString(interviewerPersonaRecord.style) ?? "",
          experience: asString(interviewerPersonaRecord.experience) ?? "",
        }
      : undefined,
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
  const sessions = useState<InterviewSession[]>(STATE_KEYS.INTERVIEW_SESSIONS, () => []);
  const currentSession = useState<InterviewSession | null>(
    STATE_KEYS.INTERVIEW_CURRENT_SESSION,
    () => null,
  );
  const stats = useState<Record<string, number> | null>(STATE_KEYS.INTERVIEW_STATS, () => null);
  const loading = useState(STATE_KEYS.INTERVIEW_LOADING, () => false);

  async function startSession(studioId: string, config?: Record<string, unknown>) {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions.post({ studioId, config });
      if (error) throw new Error("Failed to start interview session");
      const normalized = toInterviewSession(data);
      if (!normalized) throw new Error("Invalid interview session payload");
      currentSession.value = normalized;
      await fetchSessions();
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function fetchSessions() {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions.get();
      if (error) throw new Error("Failed to fetch interview sessions");
      sessions.value = toInterviewSessions(data);
    } finally {
      loading.value = false;
    }
  }

  async function getSession(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions({ id }).get();
      if (error) throw new Error("Failed to fetch interview session");
      const normalized = toInterviewSession(data);
      if (!normalized) throw new Error("Invalid interview session payload");
      currentSession.value = normalized;
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function submitResponse(sessionId: string, response: SubmitResponseInput) {
    loading.value = true;
    try {
      const { data, error } = await api.interview
        .sessions({ id: sessionId })
        .response.post(response);
      if (error) throw new Error("Failed to submit response");
      const normalized = toInterviewSession(data);
      if (!normalized) throw new Error("Invalid interview session payload");
      currentSession.value = normalized;
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function completeSession(id: string) {
    loading.value = true;
    try {
      const { data, error } = await api.interview.sessions({ id }).complete.post();
      if (error) throw new Error("Failed to complete session");
      const normalized = toInterviewSession(data);
      if (!normalized) throw new Error("Invalid interview session payload");
      currentSession.value = normalized;
      await fetchSessions();
      await fetchStats();
      return normalized;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    loading.value = true;
    try {
      const { data, error } = await api.interview.stats.get();
      if (error) throw new Error("Failed to fetch interview stats");
      stats.value = toNumericRecord(data);
    } finally {
      loading.value = false;
    }
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
