import { INTERVIEW_DEFAULT_DURATION_MINUTES } from "@bao/shared/constants/interview";
import type {
  InterviewAnalysisAggregateSource,
  InterviewAnalysisProvenanceCounts,
  InterviewCandidateContext,
  InterviewConfig,
  InterviewConversationStyle,
  InterviewMode,
  InterviewSession,
  InterviewTargetJob,
} from "@bao/shared/types/interview";
import { resolveInterviewAnalysisSource } from "@bao/shared/utils/interview-analysis-provenance";
import type { JsonValue } from "@bao/shared/utils/json";
import { normalizeScrapePersonaEnrichment } from "@bao/shared/utils/scrape-enrichment";
import {
  asBoolean,
  asNumber,
  asString,
  asStringArray,
  isRecord,
} from "@bao/shared/utils/type-guards";

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

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === "string" && values.some((entry) => entry === value);

const asInterviewStatus = (value: unknown): InterviewStatus =>
  isOneOf(INTERVIEW_STATUS_VALUES, value) ? value : "active";

const asQuestionType = (value: unknown): InterviewQuestionType =>
  isOneOf(INTERVIEW_QUESTION_TYPES, value) ? value : "behavioral";

const asQuestionDifficulty = (value: unknown): InterviewQuestionDifficulty =>
  isOneOf(INTERVIEW_QUESTION_DIFFICULTIES, value) ? value : "medium";

const asInterviewMode = (value: unknown): InterviewMode => (value === "job" ? "job" : "studio");
const asInterviewConversationStyle = (value: unknown): InterviewConversationStyle =>
  value === "structured" ? "structured" : "natural";

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
    enrichment: normalizeScrapePersonaEnrichment(value.enrichment),
  };
};

const asInterviewCandidateContext = (value: unknown): InterviewCandidateContext | undefined => {
  if (!isRecord(value)) {
    return;
  }

  const resumeId = asString(value.resumeId);
  const coverLetterId = asString(value.coverLetterId);
  const portfolioId = asString(value.portfolioId);
  if (!(resumeId || coverLetterId || portfolioId)) {
    return;
  }

  return {
    ...(resumeId ? { resumeId } : {}),
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(portfolioId ? { portfolioId } : {}),
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
    // Sessions stored before provenance tracking carry no marker, so the
    // analysis is reported as "unknown" rather than claimed as AI-generated.
    source: resolveInterviewAnalysisSource(value.source),
    ...(asString(value.provider) === undefined ? {} : { provider: asString(value.provider) }),
    ...(asString(value.model) === undefined ? {} : { model: asString(value.model) }),
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
    duration: asNumber(configRecord.duration) ?? INTERVIEW_DEFAULT_DURATION_MINUTES,
    questionCount: asNumber(configRecord.questionCount) ?? questionCount,
    includeTechnical: asBoolean(configRecord.includeTechnical) ?? true,
    includeBehavioral: asBoolean(configRecord.includeBehavioral) ?? true,
    includeStudioSpecific: asBoolean(configRecord.includeStudioSpecific) ?? true,
    enableVoiceMode: asBoolean(configRecord.enableVoiceMode),
    technologies: asStringArray(configRecord.technologies),
    interviewMode: asInterviewMode(configRecord.interviewMode),
    conversationStyle: asInterviewConversationStyle(configRecord.conversationStyle),
  };

  const voiceSettings = toVoiceSettings(configRecord.voiceSettings);
  if (voiceSettings) {
    config.voiceSettings = voiceSettings;
  }

  const targetJob = asInterviewTargetJob(configRecord.targetJob);
  if (targetJob) {
    config.targetJob = targetJob;
  }
  const candidateContext = asInterviewCandidateContext(configRecord.candidateContext);
  if (candidateContext) {
    config.candidateContext = candidateContext;
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
    // Provenance drives the "assessed by" attribution the score card renders;
    // dropping it here would leave the UI unable to distinguish AI from heuristic.
    analysisSource: toAnalysisAggregateSource(value.analysisSource),
  };
  if (feedback !== undefined) {
    analysis.feedback = feedback;
  }
  const aiAverageScore = asNumber(value.aiAverageScore);
  analysis.aiAverageScore = aiAverageScore === undefined ? null : aiAverageScore;
  const counts = toProvenanceCounts(value.provenanceCounts);
  if (counts) {
    analysis.provenanceCounts = counts;
  }
  return analysis;
};

const toAnalysisAggregateSource = (value: JsonValue | undefined): InterviewAnalysisAggregateSource =>
  value === "ai" || value === "heuristic" || value === "mixed" ? value : "unknown";

const toProvenanceCounts = (value: JsonValue | undefined): InterviewAnalysisProvenanceCounts | undefined => {
  if (!isRecord(value)) {
    return;
  }
  const aiCount = asNumber(value.ai);
  const heuristicCount = asNumber(value.heuristic);
  const unknownCount = asNumber(value.unknown);
  if (aiCount === undefined || heuristicCount === undefined || unknownCount === undefined) {
    return;
  }
  return { ai: aiCount, heuristic: heuristicCount, unknown: unknownCount };
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

export const toInterviewSession = (value: unknown): InterviewSession | null => {
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

export const toInterviewSessions = (value: unknown): InterviewSession[] =>
  Array.isArray(value)
    ? value
        .map((entry) => toInterviewSession(entry))
        .filter((entry): entry is InterviewSession => entry !== null)
    : [];

export const toNumericRecord = (value: unknown): Record<string, number> | null => {
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
