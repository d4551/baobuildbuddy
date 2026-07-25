import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { Elysia, type status } from "elysia";
import { interviewService } from "../services/interview-service";
import {
  type CreateSessionBody,
  completeInterviewSessionResponses,
  createInterviewSessionResponses,
  createSessionBodySchema,
  type InterviewSessionParams,
  interviewSessionParamsSchema,
  interviewSessionResponses,
  interviewSessionsListResponses,
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
import { openapiDetail } from "../utils/openapi-detail";

type RouteStatus = typeof status;

export const interviewRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.interviewBase),
})
  .post(
    toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions),
    {
      detail: openapiDetail("Interview", "Retrieve interview resource for BaoBuildBuddy career automation."),
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
      detail: openapiDetail("Interview", "Retrieve interview resource for BaoBuildBuddy career automation."),
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
      detail: openapiDetail("Interview", "Retrieve interview $toApiChildPath(API ENDPOINTS.interviewBase, API ENDPOINTS.interviewSessions) :id for BaoBuildBuddy career automation."),
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
      detail: openapiDetail("Interview", "Create or execute interview $toApiChildPath(API ENDPOINTS.interviewBase, API ENDPOINTS.interviewSessions) :id response for BaoBuildBuddy career automation."),
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
      detail: openapiDetail("Interview", "Create or execute interview $toApiChildPath(API ENDPOINTS.interviewBase, API ENDPOINTS.interviewSessions) :id complete for BaoBuildBuddy career automation."),
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
      detail: openapiDetail("Interview", "Create or execute interview $toApiChildPath(API ENDPOINTS.interviewBase, API ENDPOINTS.interviewSessions) :id complete for BaoBuildBuddy career automation."),
      response: interviewStatsResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await getInterviewStats()),
  );
