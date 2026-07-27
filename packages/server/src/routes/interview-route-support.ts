import {
  API_ERROR_INTERVIEW_QUESTION_UNRESOLVED,
  API_ERROR_INTERVIEW_RESPONSE_REQUIRED,
  API_ERROR_INTERVIEW_SESSION_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import {
  API_MESSAGE_INTERVIEW_COMPLETED,
  API_MESSAGE_INTERVIEW_SESSION_CREATED,
  API_MESSAGE_RESPONSE_RECORDED,
} from "@bao/shared/constants/api-messages";
import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { INTERVIEW_FALLBACK_STUDIO_ID } from "@bao/shared/constants/interview";
import { COUNT_ONE_FIFTY } from "@bao/shared/constants/numeric";
import type { InterviewResponse, InterviewSession } from "@bao/shared/types/interview";
import { asString } from "@bao/shared/utils/type-guards";
import { gamificationService } from "../services/gamification-service";
import { interviewService } from "../services/interview-service";
import { parseResponsePayload, sessionConfigFromUi } from "./interview-route-config";
import type { CreateSessionConfigInput, SubmitResponseBody } from "./interview-route-contracts";
import { sessionWithDerivedFields } from "./interview-route-presentation";

const routeResult = <const Status extends number, Body>(status: Status, body: Body) => ({
  status,
  body,
});

const buildDefaultResponse = (questionId: string, answer: string): InterviewResponse => ({
  questionId,
  transcript: answer,
  duration: Math.max(1, answer.length * COUNT_ONE_FIFTY),
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
  return routeResult(HTTP_STATUS_CREATED, {
    ...response,
    message: API_MESSAGE_INTERVIEW_SESSION_CREATED,
  });
};

export const getInterviewSession = async (id: string) => {
  const session = await interviewService.getSession(id);
  if (!session) {
    return routeResult(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND });
  }
  return routeResult(HTTP_STATUS_OK, await sessionWithDerivedFields(session));
};

export const submitInterviewResponse = async (id: string, body: SubmitResponseBody) => {
  const session = await interviewService.getSession(id);
  if (!session) {
    return routeResult(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND });
  }

  const payload = parseResponsePayload(body);
  if (!payload) {
    return routeResult(HTTP_STATUS_BAD_REQUEST, { error: API_ERROR_INTERVIEW_RESPONSE_REQUIRED });
  }

  const resolvedQuestionId = resolveQuestionId(session, payload);
  if (!resolvedQuestionId) {
    return routeResult(HTTP_STATUS_BAD_REQUEST, {
      error: API_ERROR_INTERVIEW_QUESTION_UNRESOLVED,
    });
  }

  const response = buildDefaultResponse(resolvedQuestionId, payload.response);
  const updated = await interviewService.addResponse(id, response);
  if (!updated) {
    return routeResult(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND });
  }

  return routeResult(HTTP_STATUS_OK, {
    ...(await sessionWithDerivedFields(updated)),
    message: API_MESSAGE_RESPONSE_RECORDED,
  });
};

export const completeInterviewSession = async (id: string) => {
  const completed = await interviewService.completeSession(id);
  if (!completed) {
    return routeResult(HTTP_STATUS_NOT_FOUND, { error: API_ERROR_INTERVIEW_SESSION_NOT_FOUND });
  }

  gamificationService.trackActionFireAndForget(
    "interviewsCompleted",
    ROUTE_GAMIFICATION_XP.interviewsCompleted,
    "interview_completed",
  );

  return routeResult(HTTP_STATUS_OK, {
    ...(await sessionWithDerivedFields(completed)),
    message: API_MESSAGE_INTERVIEW_COMPLETED,
  });
};
