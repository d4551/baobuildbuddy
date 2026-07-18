import type { InterviewSession } from "@bao/shared/types/interview";
import { resolveStudioContext } from "./interview-service-context";
import type { DBInterviewSession } from "./interview-service-contracts";
import {
  normalizeFinalAnalysis,
  normalizeInterviewSessionStatus,
  normalizeQuestions,
  normalizeResponses,
  normalizeSessionConfig,
} from "./interview-service-normalizers";
import { buildInterviewerPersona } from "./interview-service-prompt-context";

export async function toInterviewSession(row: DBInterviewSession): Promise<InterviewSession> {
  const config = normalizeSessionConfig(row);
  const studio = await resolveStudioContext(row.studioId);
  const questions = normalizeQuestions(row.questions);
  const responses = normalizeResponses(row.responses);
  const finalAnalysis = normalizeFinalAnalysis(row.finalAnalysis);

  return {
    id: row.id,
    studioId: row.studioId,
    config,
    questions,
    currentQuestionIndex: Math.min(responses.length, questions.length),
    totalQuestions: questions.length,
    startTime: row.startTime || Date.now(),
    status: normalizeInterviewSessionStatus(row.status),
    responses,
    interviewerPersona: buildInterviewerPersona(studio, config),
    ...(row.endTime ? { endTime: row.endTime } : {}),
    ...(finalAnalysis ? { finalAnalysis } : {}),
  };
}
