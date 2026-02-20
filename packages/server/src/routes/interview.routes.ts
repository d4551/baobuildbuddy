import type {
  InterviewAnalysis,
  InterviewConfig,
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
  InterviewTargetJob,
  VoiceSettings,
} from "@bao/shared";
import {
  INTERVIEW_DEFAULT_VOICE_SETTINGS,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_FOCUS_AREAS,
  INTERVIEW_DEFAULT_ROLE_CATEGORY,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_FALLBACK_STUDIO_ID,
  asString,
  asStringArray,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { studios } from "../db/schema";
import { interviewService } from "../services/interview-service";

type CreateSessionConfigInput = Omit<Partial<InterviewConfig>, "voiceSettings"> & {
  voiceSettings?: Partial<VoiceSettings>;
};
type SessionPayload = Record<string, unknown>;
type SubmitResponseBody = {
  questionId?: string;
  questionIndex?: number;
  response: string;
};

const interviewModeSchema = t.Union([t.Literal("studio"), t.Literal("job")]);
const voiceSettingsSchema = t.Object({
  microphoneId: t.Optional(t.String({ maxLength: 120 })),
  speakerId: t.Optional(t.String({ maxLength: 120 })),
  voiceId: t.Optional(t.String({ maxLength: 120 })),
  rate: t.Optional(t.Number({ minimum: 0.25, maximum: 3 })),
  pitch: t.Optional(t.Number({ minimum: 0.5, maximum: 2 })),
  volume: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
  language: t.Optional(t.String({ maxLength: 20 })),
});
const targetJobSchema = t.Object({
  id: t.String({ minLength: 1, maxLength: 120 }),
  title: t.String({ minLength: 1, maxLength: 200 }),
  company: t.String({ minLength: 1, maxLength: 200 }),
  location: t.String({ minLength: 1, maxLength: 120 }),
  description: t.Optional(t.String({ maxLength: 20_000 })),
  requirements: t.Optional(t.Array(t.String({ maxLength: 500 }), { maxItems: 60 })),
  technologies: t.Optional(t.Array(t.String({ maxLength: 120 }), { maxItems: 60 })),
  source: t.Optional(t.String({ maxLength: 120 })),
  postedDate: t.Optional(t.String({ maxLength: 120 })),
  url: t.Optional(t.String({ maxLength: 2_000 })),
});
const sessionConfigSchema = t.Object({
  roleType: t.Optional(t.String({ maxLength: 200 })),
  roleCategory: t.Optional(t.String({ maxLength: 120 })),
  experienceLevel: t.Optional(t.String({ maxLength: 120 })),
  focusAreas: t.Optional(t.Array(t.String({ maxLength: 120 }), { maxItems: 30 })),
  duration: t.Optional(t.Integer({ minimum: 5, maximum: 120 })),
  questionCount: t.Optional(t.Integer({ minimum: 1, maximum: 20 })),
  includeTechnical: t.Optional(t.Boolean()),
  includeBehavioral: t.Optional(t.Boolean()),
  includeStudioSpecific: t.Optional(t.Boolean()),
  enableVoiceMode: t.Optional(t.Boolean()),
  technologies: t.Optional(t.Array(t.String({ maxLength: 120 }), { maxItems: 60 })),
  voiceSettings: t.Optional(voiceSettingsSchema),
  interviewMode: t.Optional(interviewModeSchema),
  targetJob: t.Optional(targetJobSchema),
});

function asNonNegativeInt(value: number | undefined): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return undefined;
}

function asStringArrayTrimmed(value: unknown): string[] {
  return asStringArray(value).map((s) => s.trim()).filter((s) => s.length > 0);
}

function parseTargetJob(value: CreateSessionConfigInput["targetJob"]): InterviewTargetJob | undefined {
  if (!value) return undefined;
  const id = asString(value.id);
  const title = asString(value.title);
  const company = asString(value.company);
  const location = asString(value.location);
  if (!id || !title || !company || !location) {
    return undefined;
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
}

function normalizeVoiceSettings(
  value: CreateSessionConfigInput["voiceSettings"],
): VoiceSettings | undefined {
  if (!value) {
    return undefined;
  }

  const microphoneId = asString(value.microphoneId);
  const speakerId = asString(value.speakerId);
  const voiceId = asString(value.voiceId);
  const normalized: VoiceSettings = {
    rate:
      typeof value.rate === "number"
        ? value.rate
        : INTERVIEW_DEFAULT_VOICE_SETTINGS.rate,
    pitch:
      typeof value.pitch === "number"
        ? value.pitch
        : INTERVIEW_DEFAULT_VOICE_SETTINGS.pitch,
    volume:
      typeof value.volume === "number"
        ? value.volume
        : INTERVIEW_DEFAULT_VOICE_SETTINGS.volume,
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
}

function sessionConfigFromUi(config: CreateSessionConfigInput): CreateSessionConfigInput {
  const targetJob = parseTargetJob(config.targetJob);
  const roleTypeFromJob = asString(targetJob?.title);
  const mode = config.interviewMode === "job" ? "job" : "studio";
  const focusAreas = asStringArrayTrimmed(config.focusAreas);

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
    targetJob,
  };
}

function parseResponsePayload(body: SubmitResponseBody): {
  questionId: string;
  response: string;
  questionIndex?: number;
} | null {
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
}

function formatDurationMs(startTime: number, endTime?: number | null): string {
  if (!endTime) return "N/A";
  const elapsedSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function buildQuestionCard(question: InterviewQuestion, response?: InterviewResponse) {
  return {
    ...question,
    score: response?.aiAnalysis?.score ?? 0,
    feedback: response?.aiAnalysis?.feedback ?? "",
    response: response?.transcript ?? "",
  };
}

async function sessionWithDerivedFields(session: InterviewSession): Promise<SessionPayload> {
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
}

function buildDefaultResponse(questionId: string, answer: string): InterviewResponse {
  return {
    questionId,
    transcript: answer,
    duration: Math.max(1, answer.length * 150),
    timestamp: Date.now(),
    confidence: 0.8,
  };
}

function resolveQuestionId(
  session: InterviewSession,
  payload: ReturnType<typeof parseResponsePayload>,
) {
  if (!payload) return null;
  if (payload.questionId && payload.questionId !== "index:0") {
    return payload.questionId;
  }

  const fallbackIndex = payload.questionIndex ?? session.currentQuestionIndex;
  return session.questions[fallbackIndex]?.id;
}

export const interviewRoutes = new Elysia({ prefix: "/interview" })
  .post(
    "/sessions",
    async ({ body, set }) => {
      const { studioId, config = {} } = body;
      const normalizedConfig = sessionConfigFromUi(config);
      const resolvedStudioId = asString(studioId) || INTERVIEW_FALLBACK_STUDIO_ID;
      const created = await interviewService.startSession(resolvedStudioId, normalizedConfig);
      const response = await sessionWithDerivedFields(created);
      set.status = 201;
      return {
        ...response,
        message: "Interview session created",
      };
    },
    {
      body: t.Object({
        studioId: t.Optional(t.String({ maxLength: 100 })),
        config: t.Optional(sessionConfigSchema),
      }),
    },
  )
  .get("/sessions", async () => {
    const sessions = await interviewService.getSessions();
    return Promise.all(sessions.map(sessionWithDerivedFields));
  })
  .get(
    "/sessions/:id",
    async ({ params, set }) => {
      const session = await interviewService.getSession(params.id);
      if (!session) {
        set.status = 404;
        return { error: "Interview session not found" };
      }
      return sessionWithDerivedFields(session);
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  )
  .post(
    "/sessions/:id/response",
    async ({ params, body, set }) => {
      const session = await interviewService.getSession(params.id);
      if (!session) {
        set.status = 404;
        return { error: "Interview session not found" };
      }

      const payload = parseResponsePayload(body);
      if (!payload) {
        set.status = 400;
        return { error: "questionId or questionIndex and response are required" };
      }

      const resolvedQuestionId = resolveQuestionId(session, payload);
      if (!resolvedQuestionId) {
        set.status = 400;
        return { error: "Unable to resolve question for this response" };
      }

      const response = buildDefaultResponse(resolvedQuestionId, payload.response);
      const updated = await interviewService.addResponse(params.id, response);
      if (!updated) {
        set.status = 404;
        return { error: "Interview session not found" };
      }

      return {
        ...(await sessionWithDerivedFields(updated)),
        message: "Response recorded",
      };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        questionId: t.Optional(t.String({ maxLength: 100 })),
        questionIndex: t.Optional(t.Integer({ minimum: 0 })),
        response: t.String({ minLength: 1, maxLength: 10000 }),
      }),
    },
  )
  .post(
    "/sessions/:id/complete",
    async ({ params, set }) => {
      const completed = await interviewService.completeSession(params.id);
      if (!completed) {
        set.status = 404;
        return { error: "Interview session not found" };
      }

      return {
        ...(await sessionWithDerivedFields(completed)),
        message: "Interview completed",
      };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  )
  .get("/stats", async () => {
    const sessions = await interviewService.getSessions();
    const completedSessions = sessions.filter((session) => session.status === "completed");

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      inProgressSessions: sessions.filter((session) => session.status === "active").length,
      averageQuestions:
        sessions.length > 0
          ? sessions.reduce((sum, session) => sum + session.questions.length, 0) / sessions.length
          : 0,
      averageResponses:
        sessions.length > 0
          ? sessions.reduce((sum, session) => sum + session.responses.length, 0) / sessions.length
          : 0,
      totalInterviews: sessions.length,
      completedInterviews: completedSessions.length,
      averageScore:
        completedSessions.length > 0
          ? Math.round(
              completedSessions.reduce(
                (sum, session) => sum + (session.finalAnalysis?.overallScore || 0),
                0,
              ) / completedSessions.length,
            )
          : 0,
      improvementTrend: 0,
    };
  });
