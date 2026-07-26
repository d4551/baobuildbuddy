import { RATIO_FOUR_FIFTHS } from "@bao/shared/constants/numeric";
import type {
  InterviewQuestion,
  InterviewResponse,
  InterviewSession,
} from "@bao/shared/types/interview";
import { generateId } from "@bao/shared/utils/validation";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { interviewSessions } from "../db/schema/interviews";
import { normalizeConfig } from "./interview-service-config-normalizers";
import { resolveStudioContext } from "./interview-service-context";
import type { InterviewConfigInput } from "./interview-service-contracts";
import { generateFinalAnalysis } from "./interview-service-final-analysis";
import { generateNextNaturalQuestion, generateQuestions } from "./interview-service-questions";
import { generateResponseFeedback } from "./interview-service-response-feedback";
import { toInterviewSessionFromRow } from "./interview-service-session-mapper";
import { calculateInterviewStats } from "./interview-service-stats";
import { toPersistedRecord } from "./interview-service-value-parsers";

export class InterviewService {
  async startSession(
    studioId: string,
    rawConfig?: InterviewConfigInput,
  ): Promise<InterviewSession> {
    const config = normalizeConfig(rawConfig || {});
    const studio = await resolveStudioContext(studioId);
    const questionSet = await generateQuestions(config, studio);

    const id = generateId();
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const persistedConfig = toPersistedRecord(config);

    await db.insert(interviewSessions).values({
      id,
      studioId: studio.id,
      config: persistedConfig,
      questions: questionSet,
      responses: [],
      finalAnalysis: null,
      status: "active",
      startTime: now,
      endTime: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return toInterviewSessionFromRow({
      id,
      studioId: studio.id,
      config: persistedConfig,
      questions: questionSet,
      responses: [],
      finalAnalysis: null,
      status: "active",
      startTime: now,
      endTime: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  async getSessions(): Promise<InterviewSession[]> {
    const sessions = await db
      .select()
      .from(interviewSessions)
      .orderBy(desc(interviewSessions.createdAt));
    return Promise.all(sessions.map((session) => toInterviewSessionFromRow(session)));
  }

  async getSession(id: string): Promise<InterviewSession | null> {
    const rows = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id));
    const row = rows[0];
    return row ? toInterviewSessionFromRow(row) : null;
  }

  private selectQuestionForResponse(
    session: InterviewSession,
    response: InterviewResponse,
  ): InterviewQuestion | null {
    return (
      session.questions.find((entry) => entry.id === response.questionId) ??
      session.questions[session.currentQuestionIndex] ??
      session.questions[session.questions.length - 1] ??
      null
    );
  }

  private buildAnalyzedResponse(
    response: InterviewResponse,
    questionId: string,
    analysis: NonNullable<InterviewResponse["aiAnalysis"]>,
  ): InterviewResponse {
    return {
      ...response,
      questionId,
      duration: Math.max(1, response.duration),
      transcript: response.transcript.trim(),
      timestamp: response.timestamp || Date.now(),
      confidence: Math.max(0, Math.min(1, response.confidence || RATIO_FOUR_FIFTHS)),
      aiAnalysis: analysis,
    };
  }

  private async persistSessionResponses(options: {
    sessionId: string;
    responses: InterviewResponse[];
    questions: InterviewQuestion[];
    endTime: number | null;
    nowIso: string;
  }): Promise<InterviewSession["status"]> {
    const status: InterviewSession["status"] =
      options.responses.length >= options.questions.length ? "completed" : "active";

    await db
      .update(interviewSessions)
      .set({
        responses: options.responses,
        questions: options.questions,
        status,
        endTime: status === "completed" ? Date.now() : options.endTime,
        updatedAt: options.nowIso,
      })
      .where(eq(interviewSessions.id, options.sessionId));

    return status;
  }

  private async persistFinalAnalysis(sessionId: string, nowIso: string): Promise<void> {
    const finalized = await this.getSession(sessionId);
    if (!finalized) {
      return;
    }

    const studioContext = await resolveStudioContext(finalized.studioId);
    const finalAnalysis = await generateFinalAnalysis(finalized, studioContext);

    await db
      .update(interviewSessions)
      .set({
        finalAnalysis: toPersistedRecord(finalAnalysis),
        updatedAt: nowIso,
      })
      .where(eq(interviewSessions.id, sessionId));
  }

  async addResponse(
    sessionId: string,
    response: InterviewResponse,
  ): Promise<InterviewSession | null> {
    const session = await this.getSession(sessionId);
    if (!session || session.status === "completed") {
      return session;
    }

    const question = this.selectQuestionForResponse(session, response);
    if (!question) {
      return session;
    }

    const studioContext = await resolveStudioContext(session.studioId);
    const analysis = await generateResponseFeedback(
      session,
      studioContext,
      question,
      response.transcript,
    );
    const nowIso = new Date().toISOString();
    const responseWithAnalysis = this.buildAnalyzedResponse(response, question.id, analysis);
    const responses = [...session.responses, responseWithAnalysis];
    const shouldGenerateFollowUp =
      session.config.conversationStyle === "natural" &&
      responses.length < session.config.questionCount;
    const followUpQuestion = shouldGenerateFollowUp
      ? await generateNextNaturalQuestion(session, studioContext, responseWithAnalysis, question)
      : null;
    const questions =
      followUpQuestion && !session.questions.some((entry) => entry.id === followUpQuestion.id)
        ? [...session.questions, followUpQuestion]
        : session.questions;
    const status = await this.persistSessionResponses({
      sessionId,
      responses,
      questions,
      endTime: session.endTime ?? null,
      nowIso,
    });

    if (status === "completed") {
      await this.persistFinalAnalysis(sessionId, nowIso);
    }

    return this.getSession(sessionId);
  }

  async completeSession(id: string): Promise<InterviewSession | null> {
    const session = await this.getSession(id);
    if (!session) {
      return null;
    }
    if (session.status === "completed") {
      return session;
    }

    const studioContext = await resolveStudioContext(session.studioId);
    const finalAnalysis = await generateFinalAnalysis(session, studioContext);
    const now = new Date().toISOString();

    await db
      .update(interviewSessions)
      .set({
        status: "completed",
        endTime: Date.now(),
        finalAnalysis: toPersistedRecord(finalAnalysis),
        updatedAt: now,
      })
      .where(eq(interviewSessions.id, id));

    return this.getSession(id);
  }

  async getStats(): Promise<{
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    strongestAreas: string[];
    improvementAreas: string[];
    totalTimeSpent: number;
    favoriteStudios: string[];
  }> {
    return calculateInterviewStats(await this.getSessions());
  }
}

export const interviewService = new InterviewService();
