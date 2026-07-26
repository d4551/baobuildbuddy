import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { Elysia, type status } from "elysia";
import { interviewService } from "../services/interview-service";
import { openapiDetail } from "../utils/openapi-detail";
import {
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

type RouteStatus = typeof status;

export const interviewRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.interviewBase),
})
  .post(
    toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions),
    {
      detail: openapiDetail(
        "Interview",
        "Create a new interview practice session for a studio and config.",
      ),
      body: createSessionBodySchema,
      response: createInterviewSessionResponses,
    },
    async ({ body, status }) => {
      const result = await createInterviewSession(body.studioId, body.config);
      return status(HTTP_STATUS_CREATED, result.body);
    },
  )
  .get(
    toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions),
    {
      detail: openapiDetail(
        "Interview",
        "List interview practice sessions with derived progress fields.",
      ),
      response: interviewSessionsListResponses,
    },
    async ({ status }) => {
      const sessions = await interviewService.getSessions();
      return status(HTTP_STATUS_OK, await Promise.all(sessions.map(sessionWithDerivedFields)));
    },
  )
  .get(
    `${toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewSessions)}/:id`,
    {
      detail: openapiDetail(
        "Interview",
        "Retrieve an interview session by id, including derived progress fields.",
      ),
      params: interviewSessionParamsSchema,
      response: interviewSessionResponses,
    },
    async ({ params, status }) => {
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
      detail: openapiDetail(
        "Interview",
        "Submit an answer for the current interview session question.",
      ),
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
      detail: openapiDetail(
        "Interview",
        "Complete an interview session and finalize scoring feedback.",
      ),
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
      detail: openapiDetail(
        "Interview",
        "Retrieve aggregate interview practice statistics for the user.",
      ),
      response: interviewStatsResponses,
    },
    async ({ status }) => status(HTTP_STATUS_OK, await getInterviewStats()),
  );
