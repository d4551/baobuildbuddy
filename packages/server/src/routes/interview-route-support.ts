import type {
  InterviewAnalysis,
  InterviewCandidateContext,
  InterviewConversationStyle,
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
  InterviewTargetJob,
  VoiceSettings,
} from "@bao/shared";
import {
  API_ERROR_INTERVIEW_QUESTION_UNRESOLVED,
  API_ERROR_INTERVIEW_RESPONSE_REQUIRED,
  API_ERROR_INTERVIEW_SESSION_NOT_FOUND,
  API_MESSAGE_INTERVIEW_COMPLETED,
  API_MESSAGE_INTERVIEW_SESSION_CREATED,
  API_MESSAGE_RESPONSE_RECORDED,
  asString,
  asStringArray,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_NOT_FOUND,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_FOCUS_AREAS,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_CATEGORY,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
  INTERVIEW_FALLBACK_STUDIO_ID,
  ROUTE_GAMIFICATION_XP,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { studios } from "../db/schema/schema-modules";
import { gamificationService } from "../services/gamification-service";
import { interviewService } from "../services/interview-service";
import type {
  CreateSessionConfigInput,
  SessionPayload,
  SubmitResponseBody,
} from "./interview-route-contracts";

const asNonNegativeInt = (value: number | undefined): number | undefined => {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return;
};

const asStringArrayTrimmed = (value: unknown): string[] =>
  asStringArray(value)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const parseTargetJob = (
  value: CreateSessionConfigInput["targetJob"],
): InterviewTargetJob | undefined => {
  if (!value) return;
  const id = asString(value.id);
  const title = asString(value.title);
  const company = asString(value.company);
  const location = asString(value.location);
  if (!(id && title && company && location)) {
    return;
  }

  const requirements = asStringArrayTrimmed(value.requirements);
  const technologies = asStringArrayTrimmed(value.technologies);
  const description = asString(value.description);
  const source = asString(value.source);
  const postedDate = asString(value.postedDate);
  const url = asString(value.url);

  const targetJob: InterviewTargetJob = {
    id,
    title,
    company,
    location,
  };
  if (description) {
    targetJob.description = description;
  }
  if (requirements.length > 0) {
    targetJob.requirements = requirements;
  }
  if (technologies.length > 0) {
    targetJob.technologies = technologies;
  }
  if (source) {
    targetJob.source = source;
  }
  if (postedDate) {
    targetJob.postedDate = postedDate;
  }
  if (url) {
    targetJob.url = url;
  }

  return targetJob;
};

const normalizeVoiceSettings = (
  value: CreateSessionConfigInput["voiceSettings"],
): VoiceSettings | undefined => {
  if (!value) {
    return;
  }

  const microphoneId = asString(value.microphoneId);
  const speakerId = asString(value.speakerId);
  const voiceId = asString(value.voiceId);
  const normalized: VoiceSettings = {
    rate: typeof value.rate === "number" ? value.rate : INTERVIEW_DEFAULT_VOICE_SETTINGS.rate,
    pitch: typeof value.pitch === "number" ? value.pitch : INTERVIEW_DEFAULT_VOICE_SETTINGS.pitch,
    volume:
      typeof value.volume === "number" ? value.volume : INTERVIEW_DEFAULT_VOICE_SETTINGS.volume,
    language: asString(value.language) || INTERVIEW_DEFAULT_VOICE_SETTINGS.language,
  };
  if (microphoneId) {
    normalized.microphoneId = microphoneId;
  }
  if (speakerId) {
    normalized.speakerId = speakerId;
  }
  if (voiceId) {
    normalized.voiceId = voiceId;
  }

  return normalized;
};

const parseCandidateContext = (
  value: CreateSessionConfigInput["candidateContext"],
): InterviewCandidateContext | undefined => {
  if (!value) {
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

const parseConversationStyle = (
  value: CreateSessionConfigInput["conversationStyle"],
): InterviewConversationStyle | undefined => {
  if (value === "structured") {
    return "structured";
  }
  if (value === "natural") {
    return "natural";
  }
  return;
};

export const sessionConfigFromUi = (config: CreateSessionConfigInput): CreateSessionConfigInput => {
  const targetJob = parseTargetJob(config.targetJob);
  const roleTypeFromJob = asString(targetJob?.title);
  const mode = config.interviewMode === "job" ? "job" : "studio";
  const focusAreas = asStringArrayTrimmed(config.focusAreas);
  const candidateContext = parseCandidateContext(config.candidateContext);
  const conversationStyle = parseConversationStyle(config.conversationStyle);

  return {
    roleType: asString(config.roleType) || roleTypeFromJob || INTERVIEW_DEFAULT_ROLE_TYPE,
    roleCategory: asString(config.roleCategory) || INTERVIEW_DEFAULT_ROLE_CATEGORY,
    experienceLevel: asString(config.experienceLevel) || INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
    focusAreas: focusAreas.length > 0 ? focusAreas : [...INTERVIEW_DEFAULT_FOCUS_AREAS],
    duration: config.duration,
    questionCount: asNonNegativeInt(config.questionCount) ?? INTERVIEW_DEFAULT_QUESTION_COUNT,
    includeTechnical: config.includeTechnical,
    includeBehavioral: config.includeBehavioral,
    includeStudioSpecific: config.includeStudioSpecific,
    enableVoiceMode: config.enableVoiceMode,
    technologies: asStringArrayTrimmed(config.technologies),
    voiceSettings: normalizeVoiceSettings(config.voiceSettings),
    interviewMode: mode,
    conversationStyle,
    targetJob,
    candidateContext,
  };
};

const parseResponsePayload = (
  body: SubmitResponseBody,
): {
  questionId: string;
  response: string;
  questionIndex?: number;
} | null => {
  const response = asString(body.response);
  if (!response) {
    return null;
  }

  const questionId = asString(body.questionId);
  const questionIndex = asNonNegativeInt(body.questionIndex);
  return {
    questionId: questionId ?? `index:${questionIndex ?? 0}`,
    questionIndex,
    response,
  };
};

const formatDurationMs = (startTime: number, endTime?: number | null): string => {
  if (!endTime) return "N/A";
  const elapsedSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

const buildQuestionCard = (question: InterviewQuestion, response?: InterviewResponse) => ({
  ...question,
  score: response?.aiAnalysis?.score ?? 0,
  feedback: response?.aiAnalysis?.feedback ?? "",
  response: response?.transcript ?? "",
});

export const sessionWithDerivedFields = async (
  session: InterviewSession,
): Promise<SessionPayload> => {
  const targetJob = session.config.targetJob ?? null;
  const targetJobCompany = asString(targetJob?.company);
  const targetJobTitle = asString(targetJob?.title);
  const studioRows = await db.select().from(studios).where(eq(studios.id, session.studioId));
  const studioName =
    session.config.interviewMode === "job"
      ? targetJobCompany || studioRows[0]?.name || session.studioId
      : studioRows[0]?.name || session.studioId;
  const questions = session.questions.map((question, index) =>
    buildQuestionCard(question, session.responses[index]),
  );
  const totalQuestions = questions.length;
  const score = Math.round(session.finalAnalysis?.overallScore || 0);
  const analysis: InterviewAnalysis | null = session.finalAnalysis ?? null;

  return {
    ...session,
    role: targetJobTitle || session.config.roleType || INTERVIEW_DEFAULT_ROLE_CATEGORY,
    studioName,
    questions,
    score,
    duration: formatDurationMs(session.startTime, session.endTime),
    overallFeedback: analysis?.recommendations ? analysis.recommendations.join(" ") : "",
    totalQuestions,
    totalResponses: session.responses.length,
    currentQuestionIndex: Math.min(session.responses.length, totalQuestions),
  };
};

const buildDefaultResponse = (questionId: string, answer: string): InterviewResponse => ({
  questionId,
  transcript: answer,
  duration: Math.max(1, answer.length * 150),
  timestamp: Date.now(),
  confidence: 0.8,
});

const resolveQuestionId = (
  session: InterviewSession,
  payload: ReturnType<typeof parseResponsePayload>,
) => {
  if (!payload) return null;
  if (payload.questionId && payload.questionId !== "index:0") {
    return payload.questionId;
  }

  const fallbackIndex = payload.questionIndex ?? session.currentQuestionIndex;
  return session.questions[fallbackIndex]?.id;
};

export const createInterviewSession = async (
  studioId: string | undefined,
  config: CreateSessionConfigInput | undefined,
) => {
  const normalizedConfig = sessionConfigFromUi(config ?? {});
  const resolvedStudioId = asString(studioId) || INTERVIEW_FALLBACK_STUDIO_ID;
  const created = await interviewService.startSession(resolvedStudioId, normalizedConfig);
  const response = await sessionWithDerivedFields(created);
  return {
    status: 201,
    body: {
      ...response,
      message: API_MESSAGE_INTERVIEW_SESSION_CREATED,
    },
  };
};

export const getInterviewSession = async (id: string) => {
  const session = await interviewService.getSession(id);
  if (!session) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND },
    };
  }
  return {
    status: null,
    body: await sessionWithDerivedFields(session),
  };
};

export const submitInterviewResponse = async (id: string, body: SubmitResponseBody) => {
  const session = await interviewService.getSession(id);
  if (!session) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND },
    };
  }

  const payload = parseResponsePayload(body);
  if (!payload) {
    return {
      status: HTTP_STATUS_BAD_REQUEST,
      body: { error: API_ERROR_INTERVIEW_RESPONSE_REQUIRED },
    };
  }

  const resolvedQuestionId = resolveQuestionId(session, payload);
  if (!resolvedQuestionId) {
    return {
      status: HTTP_STATUS_BAD_REQUEST,
      body: { error: API_ERROR_INTERVIEW_QUESTION_UNRESOLVED },
    };
  }

  const response = buildDefaultResponse(resolvedQuestionId, payload.response);
  const updated = await interviewService.addResponse(id, response);
  if (!updated) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND },
    };
  }

  return {
    status: null,
    body: {
      ...(await sessionWithDerivedFields(updated)),
      message: API_MESSAGE_RESPONSE_RECORDED,
    },
  };
};

export const completeInterviewSession = async (id: string) => {
  const completed = await interviewService.completeSession(id);
  if (!completed) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND },
    };
  }

  gamificationService.trackActionFireAndForget(
    "interviewsCompleted",
    ROUTE_GAMIFICATION_XP.interviewsCompleted,
    "interview_completed",
  );

  return {
    status: null,
    body: {
      ...(await sessionWithDerivedFields(completed)),
      message: API_MESSAGE_INTERVIEW_COMPLETED,
    },
  };
};
