import {
  API_ERROR_START_INTERVIEW,
  API_ERROR_STUDIO_ID_REQUIRED,
  DECIMAL_RADIX,
  INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
  INTERVIEW_DEFAULT_FOCUS_AREAS,
  INTERVIEW_DEFAULT_QUESTION_COUNT,
  INTERVIEW_DEFAULT_ROLE_TYPE,
  INTERVIEW_MAX_QUESTION_COUNT,
  INTERVIEW_UNKNOWN_STUDIO_NAME,
  resolveBrandSettings,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MESSAGE,
  settle,
  toApiScopedPath,
  WS_ENDPOINTS,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { interviewService } from "../services/interview-service";

type InterviewSocket = { send: (data: string) => void };

type InterviewMessage = {
  type: string;
  sessionId?: string;
  content?: string;
  studioId?: string;
  config?: Record<string, unknown>;
};

type WsQuestion = {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
};

type InterviewFeedback = {
  score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
};

type WsCandidateContext = {
  resumeId?: string;
  coverLetterId?: string;
  portfolioId?: string;
};

function toWsConfigRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return Object.fromEntries(Object.entries(value));
}

function resolveWsConfigText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function resolveWsQuestionCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.min(Math.floor(value), INTERVIEW_MAX_QUESTION_COUNT));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, DECIMAL_RADIX);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(parsed, INTERVIEW_MAX_QUESTION_COUNT));
    }
  }

  return INTERVIEW_DEFAULT_QUESTION_COUNT;
}

function resolveWsCandidateContext(value: unknown): WsCandidateContext | undefined {
  const candidateContextValue = toWsConfigRecord(value);
  if (!candidateContextValue) {
    return;
  }

  const candidateContext: WsCandidateContext = {
    ...(typeof candidateContextValue.resumeId === "string"
      ? { resumeId: candidateContextValue.resumeId }
      : {}),
    ...(typeof candidateContextValue.coverLetterId === "string"
      ? { coverLetterId: candidateContextValue.coverLetterId }
      : {}),
    ...(typeof candidateContextValue.portfolioId === "string"
      ? { portfolioId: candidateContextValue.portfolioId }
      : {}),
  };

  return candidateContext.resumeId || candidateContext.coverLetterId || candidateContext.portfolioId
    ? candidateContext
    : undefined;
}

export const interviewWebSocket = new Elysia().ws(toApiScopedPath(WS_ENDPOINTS.interview), {
  body: t.Object({
    type: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
    sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    content: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE })),
    studioId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    config: t.Optional(t.Record(t.String(), t.Unknown())),
  }),
  async open(ws) {
    const settingsRows = await db
      .select()
      .from(settings)
      .where(eq(settings.id, DEFAULT_SETTINGS_ID));
    const runtimeBrand = resolveBrandSettings(settingsRows[0]?.brandSettings);
    ws.send(
      JSON.stringify({
        type: "connected",
        message: `Connected to ${runtimeBrand.assistantName} interview coaching`,
      }),
    );
  },
  async message(ws, data) {
    switch (data.type) {
      case "start_session": {
        await handleStartSession(ws, data);
        break;
      }
      case "submit_response": {
        await handleSubmitResponse(ws, data);
        break;
      }
      case "end_session": {
        await handleEndSession(ws, data);
        break;
      }
      default: {
        ws.send(
          JSON.stringify({
            type: "error",
            message: `Unknown message type: ${data.type}`,
          }),
        );
      }
    }
  },
  close() {
    // Connection closed
  },
});

function mapWsConfigToInterviewConfig(config: Record<string, unknown>): Record<string, unknown> {
  const role = resolveWsConfigText(config.role, INTERVIEW_DEFAULT_ROLE_TYPE);
  const level = resolveWsConfigText(config.level, INTERVIEW_DEFAULT_EXPERIENCE_LEVEL);
  const questionCount = resolveWsQuestionCount(config.questionCount);
  const candidateContext = resolveWsCandidateContext(config.candidateContext);

  return {
    roleType: role,
    role,
    experienceLevel: level,
    level,
    questionCount,
    conversationStyle: config.conversationStyle === "structured" ? "structured" : "natural",
    ...(candidateContext ? { candidateContext } : {}),
    includeTechnical: true,
    includeBehavioral: true,
    includeStudioSpecific: true,
    focusAreas: [...INTERVIEW_DEFAULT_FOCUS_AREAS],
  };
}

function toWsQuestions(
  questions: Array<{ id: string; question: string; type: string; difficulty: string }>,
): WsQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    question: q.question,
    category: q.type === "studio-specific" ? "cultural" : q.type,
    difficulty:
      q.difficulty === "easy" || q.difficulty === "medium" || q.difficulty === "hard"
        ? q.difficulty
        : "medium",
  }));
}

function sendInterviewError(socket: InterviewSocket, message: string): void {
  socket.send(JSON.stringify({ type: "error", message }));
}

function getAiFallbackFeedback(): InterviewFeedback {
  return {
    score: 65,
    strengths: ["Attempted answer"],
    improvements: ["More detail needed"],
    summary: "Response recorded.",
  };
}

async function handleStartSession(socket: InterviewSocket, data: InterviewMessage) {
  const studioId = data.studioId;
  if (!studioId) {
    socket.send(JSON.stringify({ type: "error", message: API_ERROR_STUDIO_ID_REQUIRED }));
    return;
  }

  const config = mapWsConfigToInterviewConfig(data.config || {});
  const sessionResult = await settle(interviewService.startSession(studioId, config));
  if (sessionResult.status === "rejected") {
    socket.send(
      JSON.stringify({
        type: "error",
        message:
          sessionResult.reason instanceof Error
            ? sessionResult.reason.message
            : API_ERROR_START_INTERVIEW,
      }),
    );
    return;
  }

  const session = sessionResult.value;
  const studioName = session.interviewerPersona?.studioName ?? INTERVIEW_UNKNOWN_STUDIO_NAME;
  const role = session.config.roleType ?? INTERVIEW_DEFAULT_ROLE_TYPE;
  const level = session.config.experienceLevel ?? INTERVIEW_DEFAULT_EXPERIENCE_LEVEL;
  const questionCount = session.config.questionCount ?? INTERVIEW_DEFAULT_QUESTION_COUNT;
  const wsQuestions = toWsQuestions(session.questions);

  socket.send(
    JSON.stringify({
      type: "session_started",
      sessionId: session.id,
      studioName,
      questions: wsQuestions,
      config: { role, level, questionCount },
    }),
  );
}

async function handleSubmitResponse(socket: InterviewSocket, data: InterviewMessage) {
  const sessionId = data.sessionId;
  const content = data.content;

  if (!(sessionId && content)) {
    sendInterviewError(socket, "sessionId and content are required");
    return;
  }

  const updatedSession = await interviewService.addResponse(sessionId, {
    questionId: "",
    transcript: content,
    duration: Math.max(1, content.length * 150),
    timestamp: Date.now(),
    confidence: 0.8,
  });
  if (!updatedSession) {
    sendInterviewError(socket, "Session not found");
    return;
  }
  const latestResponse = updatedSession.responses.at(-1);
  const questionIndex = Math.max(0, updatedSession.responses.length - 1);
  const feedback = latestResponse?.aiAnalysis
    ? {
        score: latestResponse.aiAnalysis.score,
        strengths: latestResponse.aiAnalysis.strengths,
        improvements: latestResponse.aiAnalysis.improvements,
        summary: latestResponse.aiAnalysis.feedback,
      }
    : getAiFallbackFeedback();
  const nextQuestion = updatedSession.questions[updatedSession.currentQuestionIndex] ?? null;
  const responseIndex = updatedSession.responses.length;
  const isComplete = updatedSession.status === "completed";

  socket.send(
    JSON.stringify({
      type: "response_feedback",
      sessionId,
      feedback,
      questionIndex,
      isComplete,
      nextQuestion: isComplete ? null : nextQuestion,
      responseIndex,
    }),
  );
}

async function handleEndSession(socket: InterviewSocket, data: InterviewMessage) {
  const sessionId = data.sessionId;
  if (!sessionId) {
    sendInterviewError(socket, "sessionId is required");
    return;
  }

  const session = await interviewService.completeSession(sessionId);
  if (!session) {
    sendInterviewError(socket, "Session not found");
    return;
  }
  const finalAnalysis = session.finalAnalysis ?? {
    overallScore: 0,
    strengths: [],
    improvements: [],
    recommendations: [],
  };

  socket.send(
    JSON.stringify({
      type: "session_complete",
      sessionId,
      finalAnalysis,
    }),
  );
}
