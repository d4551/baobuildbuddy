import type { AIProviderType } from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { interviewSessions } from "../db/schema/interviews";
import { settings } from "../db/schema/settings";
import type { AIService as AIServiceType } from "../services/ai/ai-service";
import { interviewService } from "../services/interview-service";

async function getAIService(): Promise<InstanceType<typeof AIServiceType>> {
  const { AIService } = await import("../services/ai/ai-service");
  const settingsRows = await db.select().from(settings).where(eq(settings.id, "default"));
  return AIService.fromSettings(settingsRows[0]) as InstanceType<typeof AIServiceType>;
}

type InterviewPayloadType = "start_session" | "submit_response" | "end_session";

type InterviewMessage = {
  type: InterviewPayloadType;
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

export const interviewWebSocket = new Elysia().ws("/ws/interview", {
  body: t.Object({
    type: t.String({ maxLength: 50 }),
    sessionId: t.Optional(t.String({ maxLength: 100 })),
    content: t.Optional(t.String({ maxLength: 10000 })),
    studioId: t.Optional(t.String({ maxLength: 100 })),
    config: t.Optional(t.Record(t.String(), t.Any())),
  }),
  async open(ws) {
    ws.send(
      JSON.stringify({
        type: "connected",
        message: "Connected to BaoBuildBuddy interview system",
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

function createInterviewFeedbackSummary(feedback: Partial<InterviewFeedback>): InterviewFeedback {
  return {
    score: typeof feedback.score === "number" ? feedback.score : 0,
    strengths: Array.isArray(feedback.strengths) ? feedback.strengths : [],
    improvements: Array.isArray(feedback.improvements) ? feedback.improvements : [],
    summary: typeof feedback.summary === "string" ? feedback.summary : "Response recorded.",
  };
}

function mapWsConfigToInterviewConfig(config: Record<string, unknown>): Record<string, unknown> {
  const role = typeof config.role === "string" && config.role.trim() ? config.role : "Game Developer";
  const level = typeof config.level === "string" && config.level.trim() ? config.level : "mid";
  let questionCount = 5;
  if (typeof config.questionCount === "number" && Number.isFinite(config.questionCount)) {
    questionCount = Math.max(1, Math.min(Math.floor(config.questionCount), 20));
  } else if (typeof config.questionCount === "string") {
    const parsed = Number.parseInt(config.questionCount, 10);
    if (Number.isFinite(parsed)) questionCount = Math.max(1, Math.min(parsed, 20));
  }
  return {
    roleType: role,
    role,
    experienceLevel: level,
    level,
    questionCount,
    includeTechnical: true,
    includeBehavioral: true,
    includeStudioSpecific: true,
    focusAreas: ["architecture", "communication", "problem-solving"],
  };
}

function toWsQuestions(questions: Array<{ id: string; question: string; type: string; difficulty: string }>): WsQuestion[] {
  return questions.map((q) => ({
    id: q.id,
    question: q.question,
    category: q.type === "studio-specific" ? "cultural" : q.type,
    difficulty: ["easy", "medium", "hard"].includes(q.difficulty) ? (q.difficulty as "easy" | "medium" | "hard") : "medium",
  }));
}

function parseFeedback(response: string): InterviewFeedback {
  try {
    const parsed = JSON.parse(response);
    if (parsed && typeof parsed === "object") {
      return createInterviewFeedbackSummary(parsed as Partial<InterviewFeedback>);
    }
  } catch {
    // Ignore parse errors and use fallback below
  }

  return {
    score: 70,
    strengths: ["Response provided"],
    improvements: ["Add more detail"],
    summary: "Response recorded, with a request for more detail.",
  };
}

async function handleStartSession(ws: unknown, data: InterviewMessage) {
  const socket = ws as { send: (data: string) => void };

  const studioId = data.studioId;
  if (!studioId) {
    socket.send(JSON.stringify({ type: "error", message: "studioId is required" }));
    return;
  }

  const config = mapWsConfigToInterviewConfig(data.config || {});

  try {
    const session = await interviewService.startSession(studioId, config);
    const studioName = session.interviewerPersona?.studioName ?? "Unknown Studio";
    const role = session.config.roleType ?? "Game Developer";
    const level = session.config.experienceLevel ?? "mid";
    const questionCount = session.config.questionCount ?? 5;
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
  } catch (err) {
    socket.send(
      JSON.stringify({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to start interview session",
      }),
    );
  }
}

async function handleSubmitResponse(ws: unknown, data: InterviewMessage) {
  const socket = ws as {
    send: (data: string) => void;
  };
  const sessionId = data.sessionId;
  const content = data.content;

  if (!sessionId || !content) {
    socket.send(JSON.stringify({ type: "error", message: "sessionId and content are required" }));
    return;
  }

  const sessionRows = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));
  const session = sessionRows[0];
  if (!session) {
    socket.send(JSON.stringify({ type: "error", message: "Session not found" }));
    return;
  }

  const responses = (session.responses as Array<Record<string, unknown>>) || [];
  const questions = (session.questions as Array<{ id: string; question: string; type: string }>) || [];
  const questionIndex = responses.length;
  const currentQuestion = questions[questionIndex];

  let feedback: InterviewFeedback = {
    score: 70,
    strengths: ["Response provided"],
    improvements: ["Configure AI for detailed feedback"],
    summary: "Response recorded. Configure an AI provider for detailed feedback.",
  };

  try {
    const aiService = await getAIService();
    const prompt = `You are an interview coach. Evaluate this interview response.

Question: ${currentQuestion?.question || "Unknown question"}
Category: ${currentQuestion?.type || "general"}
Candidate Response: ${content}

Return a JSON object:
{"score": 0-100, "strengths": ["..."], "improvements": ["..."], "summary": "one sentence feedback"}

Only return the JSON object.`;

    const response = await aiService.generate(prompt, { temperature: 0.3 });
    feedback = parseFeedback(response.content);
  } catch {
    feedback = {
      score: 65,
      strengths: ["Attempted answer"],
      improvements: ["More detail needed"],
      summary: "Response recorded.",
    };
  }

  // Save response
  const newResponse = {
    questionIndex,
    question: currentQuestion?.question,
    answer: content,
    feedback,
    timestamp: new Date().toISOString(),
    questionCategory: currentQuestion?.type,
    preferredModel: undefined,
    preferredProvider: "local" as AIProviderType,
  };

  const nextQuestion = questions[questionIndex + 1];
  const nextQuestionValue = questionIndex + 1;
  const isComplete = responses.length + 1 >= questions.length;

  responses.push(newResponse as Record<string, unknown>);
  await db
    .update(interviewSessions)
    .set({ responses: responses as Record<string, unknown>[], updatedAt: new Date().toISOString() })
    .where(eq(interviewSessions.id, sessionId));

  socket.send(
    JSON.stringify({
      type: "response_feedback",
      sessionId,
      feedback,
      questionIndex,
      isComplete,
      nextQuestion: isComplete ? null : nextQuestion,
      responseIndex: nextQuestionValue,
    }),
  );
}

async function handleEndSession(ws: unknown, data: InterviewMessage) {
  const socket = ws as {
    send: (data: string) => void;
  };

  const sessionId = data.sessionId;
  if (!sessionId) {
    socket.send(JSON.stringify({ type: "error", message: "sessionId is required" }));
    return;
  }

  const sessionRows = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));
  const session = sessionRows[0];
  if (!session) {
    socket.send(JSON.stringify({ type: "error", message: "Session not found" }));
    return;
  }

  const responses = (session.responses as Array<Record<string, unknown>>) || [];
  const totalScore = responses.reduce((sum, responseRecord) => {
    const score =
      typeof responseRecord.feedback === "object" && responseRecord.feedback
        ? Number((responseRecord.feedback as { score?: unknown }).score)
        : Number.NaN;
    return Number.isFinite(score) ? sum + score : sum;
  }, 0);

  const answeredQuestions = responses.length;
  const avgScore = answeredQuestions > 0 ? Math.round(totalScore / answeredQuestions) : 0;
  const responseStrengths = responses.flatMap((responseRecord) => {
    const feedback = responseRecord.feedback;
    return feedback &&
      typeof feedback === "object" &&
      Array.isArray((feedback as { strengths?: unknown }).strengths)
      ? (feedback as { strengths?: unknown[] }).strengths || []
      : [];
  });

  const responseImprovements = responses.flatMap((responseRecord) => {
    const feedback = responseRecord.feedback;
    return feedback &&
      typeof feedback === "object" &&
      Array.isArray((feedback as { improvements?: unknown }).improvements)
      ? (feedback as { improvements?: unknown[] }).improvements || []
      : [];
  });

  const totalQuestions = Array.isArray(session.questions) ? session.questions.length : 0;
  const finalAnalysis = {
    overallScore: avgScore,
    totalQuestions,
    answeredQuestions,
    strengths: Array.from(
      new Set(responseStrengths.filter((value): value is string => typeof value === "string")),
    ).slice(0, 5),
    weaknesses: Array.from(
      new Set(responseImprovements.filter((value): value is string => typeof value === "string")),
    ).slice(0, 5),
    recommendations:
      avgScore >= 80
        ? ["Strong performance! Focus on refining edge cases."]
        : avgScore >= 60
          ? [
              "Good foundation. Practice more specific examples.",
              "Review common follow-up questions.",
            ]
          : [
              "Consider more structured practice.",
              "Research the company more thoroughly.",
              "Prepare concrete examples from your experience.",
            ],
  };

  await db
    .update(interviewSessions)
    .set({
      status: "completed",
      endTime: Date.now(),
      finalAnalysis,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(interviewSessions.id, sessionId));

  socket.send(
    JSON.stringify({
      type: "session_complete",
      sessionId,
      finalAnalysis,
    }),
  );
}
