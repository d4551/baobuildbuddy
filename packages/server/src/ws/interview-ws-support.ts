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
  settle,
} from "@bao/shared";
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

const toWsConfigRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return Object.fromEntries(Object.entries(value));
};

const resolveWsConfigText = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;

const resolveWsQuestionCount = (value: unknown): number => {
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
};

const resolveWsCandidateContext = (value: unknown): WsCandidateContext | undefined => {
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
};

const mapWsConfigToInterviewConfig = (config: Record<string, unknown>): Record<string, unknown> => {
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
};

const toWsQuestions = (
  questions: Array<{ id: string; question: string; type: string; difficulty: string }>,
): WsQuestion[] =>
  questions.map((question) => ({
    id: question.id,
    question: question.question,
    category: question.type === "studio-specific" ? "cultural" : question.type,
    difficulty:
      question.difficulty === "easy" ||
      question.difficulty === "medium" ||
      question.difficulty === "hard"
        ? question.difficulty
        : "medium",
  }));

const sendInterviewError = (socket: InterviewSocket, message: string): void => {
  socket.send(JSON.stringify({ type: "error", message }));
};

const getAiFallbackFeedback = (): InterviewFeedback => ({
  score: 65,
  strengths: ["Attempted answer"],
  improvements: ["More detail needed"],
  summary: "Response recorded.",
});

export async function handleStartSession(socket: InterviewSocket, data: InterviewMessage) {
  if (!data.studioId) {
    socket.send(JSON.stringify({ type: "error", message: API_ERROR_STUDIO_ID_REQUIRED }));
    return;
  }

  const sessionResult = await settle(
    interviewService.startSession(data.studioId, mapWsConfigToInterviewConfig(data.config || {})),
  );
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
  socket.send(
    JSON.stringify({
      type: "session_started",
      sessionId: session.id,
      studioName: session.interviewerPersona?.studioName ?? INTERVIEW_UNKNOWN_STUDIO_NAME,
      questions: toWsQuestions(session.questions),
      config: {
        role: session.config.roleType ?? INTERVIEW_DEFAULT_ROLE_TYPE,
        level: session.config.experienceLevel ?? INTERVIEW_DEFAULT_EXPERIENCE_LEVEL,
        questionCount: session.config.questionCount ?? INTERVIEW_DEFAULT_QUESTION_COUNT,
      },
    }),
  );
}

export async function handleSubmitResponse(socket: InterviewSocket, data: InterviewMessage) {
  if (!(data.sessionId && data.content)) {
    sendInterviewError(socket, "sessionId and content are required");
    return;
  }

  const updatedSession = await interviewService.addResponse(data.sessionId, {
    questionId: "",
    transcript: data.content,
    duration: Math.max(1, data.content.length * 150),
    timestamp: Date.now(),
    confidence: 0.8,
  });
  if (!updatedSession) {
    sendInterviewError(socket, "Session not found");
    return;
  }

  const latestResponse = updatedSession.responses.at(-1);
  const isComplete = updatedSession.status === "completed";
  const nextQuestion = updatedSession.questions[updatedSession.currentQuestionIndex] ?? null;
  const feedback = latestResponse?.aiAnalysis
    ? {
        score: latestResponse.aiAnalysis.score,
        strengths: latestResponse.aiAnalysis.strengths,
        improvements: latestResponse.aiAnalysis.improvements,
        summary: latestResponse.aiAnalysis.feedback,
      }
    : getAiFallbackFeedback();

  socket.send(
    JSON.stringify({
      type: "response_feedback",
      sessionId: data.sessionId,
      feedback,
      questionIndex: Math.max(0, updatedSession.responses.length - 1),
      isComplete,
      nextQuestion: isComplete ? null : nextQuestion,
      responseIndex: updatedSession.responses.length,
    }),
  );
}

export async function handleEndSession(socket: InterviewSocket, data: InterviewMessage) {
  if (!data.sessionId) {
    sendInterviewError(socket, "sessionId is required");
    return;
  }

  const session = await interviewService.completeSession(data.sessionId);
  if (!session) {
    sendInterviewError(socket, "Session not found");
    return;
  }

  socket.send(
    JSON.stringify({
      type: "session_complete",
      sessionId: data.sessionId,
      finalAnalysis: session.finalAnalysis ?? {
        overallScore: 0,
        strengths: [],
        improvements: [],
        recommendations: [],
      },
    }),
  );
}
