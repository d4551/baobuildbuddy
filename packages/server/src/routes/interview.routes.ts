import { Elysia, type status } from "elysia";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { interviewService } from "../services/interview-service";
import {
  completeInterviewSessionResponses,
  type CreateSessionBody,
  createSessionBodySchema,
  createInterviewSessionResponses,
  interviewSessionResponses,
  type InterviewSessionParams,
  interviewSessionsListResponses,
  interviewSessionParamsSchema,
  interviewStatsResponses,
  type SubmitResponseRouteBody,
  submitInterviewResponseResponses,
  submitResponseBodySchema,
} from "./interview-route-contracts";
import { sessionWithDerivedFields } from "./interview-route-presentation";
import { getInterviewStats } from "./interview-route-stats";
import {
  completeInterviewSession,
  createInterviewSession,
  getInterviewSession,
  submitInterviewResponse,
} from "./interview-route-support";

type RouteStatus = typeof status;

export const interviewRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.interviewBase),
})
  .post(
    toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions),
    {
      detail: { tags: ["Interview"] },
      body: createSessionBodySchema,
      response: createInterviewSessionResponses,
    },
    async ({ body, status }: { body: CreateSessionBody; status: RouteStatus }) => {
      const result = await createInterviewSession(body.studioId, body.config);
      return status(HTTP_STATUS_CREATED, result.body);
    },
  )
  .get(
    toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions),
    {
      detail: { tags: ["Interview"] },
      response: interviewSessionsListResponses,
    },
    async ({ status }: { status: RouteStatus }) => {
      const sessions = await interviewService.getSessions();
      return status(HTTP_STATUS_OK, await Promise.all(sessions.map(sessionWithDerivedFields)));
    },
  )
  .get(
    `${toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions)}/:id`,
    {
      detail: { tags: ["Interview"] },
      params: interviewSessionParamsSchema,
      response: interviewSessionResponses,
    },
    async ({ params, status }: { params: InterviewSessionParams; status: RouteStatus }) => {
      const result = await getInterviewSession(params.id);
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .post(
    `${toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions)}/:id/response`,
    {
      detail: { tags: ["Interview"] },
      params: interviewSessionParamsSchema,
      body: submitResponseBodySchema,
      response: submitInterviewResponseResponses,
    },
    async ({
      params,
      body,
      status,
    }: {
      params: InterviewSessionParams;
      body: SubmitResponseRouteBody;
      status: RouteStatus;
    }) => {
      const result = await submitInterviewResponse(params.id, body);
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      if (result.status === HTTP_STATUS_BAD_REQUEST) {
        return status(HTTP_STATUS_BAD_REQUEST, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .post(
    `${toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions)}/:id/complete`,
    {
      detail: { tags: ["Interview"] },
      params: interviewSessionParamsSchema,
      response: completeInterviewSessionResponses,
    },
    async ({ params, status }: { params: InterviewSessionParams; status: RouteStatus }) => {
      const result = await completeInterviewSession(params.id);
      if (result.status === HTTP_STATUS_NOT_FOUND) {
        return status(HTTP_STATUS_NOT_FOUND, result.body);
      }
      return status(HTTP_STATUS_OK, result.body);
    },
  )
  .get(
    toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewStats),
    {
      detail: { tags: ["Interview"] },
      response: interviewStatsResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await getInterviewStats()),
  );
