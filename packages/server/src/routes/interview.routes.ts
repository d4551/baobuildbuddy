import type {
  InterviewAnalysis,
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { studios } from "../db/schema";
import { interviewService } from "../services/interview-service";

type CreateSessionConfig = Record<string, unknown>;
type SessionPayload = Record<string, unknown>;
type LegacySubmitResponse = {
  questionId?: unknown;
  questionIndex?: unknown;
  answer?: unknown;
  response?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNonNegativeInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return undefined;
}

function sessionConfigFromUi(config: Record<string, unknown>): CreateSessionConfig {
  const voiceSettings =
    config.voiceSettings && typeof config.voiceSettings === "object"
      ? config.voiceSettings
      : undefined;
  return {
    roleType: asString(config.role) || asString(config.roleType) || "Game Developer",
    roleCategory: asString(config.roleCategory) || "General",
    experienceLevel: asString(config.experienceLevel) || asString(config.level) || "Mid-Level",
    focusAreas: Array.isArray(config.focusAreas)
      ? config.focusAreas.filter((value): value is string => typeof value === "string")
      : ["architecture", "communication", "problem-solving"],
    duration: config.duration,
    questionCount: asNonNegativeInt(config.questionCount) ?? 6,
    includeTechnical: config.includeTechnical,
    includeBehavioral: config.includeBehavioral,
    includeStudioSpecific: config.includeStudioSpecific,
    enableVoiceMode: config.enableVoiceMode,
    technologies: Array.isArray(config.technologies)
      ? config.technologies.filter((value): value is string => typeof value === "string")
      : [],
    voiceSettings,
  };
}

function parseResponsePayload(body: LegacySubmitResponse): {
  questionId: string;
  answer: string;
  questionIndex?: number;
} | null {
  const answer = asString(body.answer) || asString(body.response);
  if (!answer) {
    return null;
  }

  const questionId = asString(body.questionId);
  const questionIndex = asNonNegativeInt(body.questionIndex);
  return {
    questionId: questionId ?? `index:${questionIndex ?? 0}`,
    questionIndex,
    answer,
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
  const studioRows = await db.select().from(studios).where(eq(studios.id, session.studioId));
  const studioName = studioRows[0]?.name || session.studioId;
  const questions = session.questions.map((question, index) =>
    buildQuestionCard(question, session.responses[index]),
  );
  const totalQuestions = questions.length;
  const score = Math.round(session.finalAnalysis?.overallScore || 0);
  const analysis = (session.finalAnalysis as InterviewAnalysis | undefined) ?? null;

  return {
    ...session,
    role: session.config.roleType || "General",
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
      const normalizedConfig = sessionConfigFromUi(isRecord(config) ? config : {});
      const created = await interviewService.startSession(studioId, normalizedConfig);
      const response = await sessionWithDerivedFields(created);
      set.status = 201;
      return {
        ...response,
        message: "Interview session created",
      };
    },
    {
      body: t.Object({
        studioId: t.String({ maxLength: 100 }),
        config: t.Optional(t.Record(t.String(), t.Any())),
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

      const response = buildDefaultResponse(resolvedQuestionId, payload.answer);
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
        answer: t.Optional(t.String({ minLength: 1, maxLength: 10000 })),
        response: t.Optional(t.String({ minLength: 1, maxLength: 10000 })),
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
