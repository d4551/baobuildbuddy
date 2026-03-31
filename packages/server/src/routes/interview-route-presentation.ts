import { INTERVIEW_DEFAULT_ROLE_CATEGORY } from "@bao/shared/constants/interview";
import type { InterviewAnalysis, InterviewQuestion, InterviewResponse, InterviewSession } from "@bao/shared/types/interview";
import { asString } from "@bao/shared/utils/type-guards";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { studios } from "../db/schema/schema-modules";
import type { SessionPayload } from "./interview-route-contracts";

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
