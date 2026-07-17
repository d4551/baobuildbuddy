import { Elysia } from "elysia";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
import { interviewService } from "../services/interview-service";
import type { RouteSetState } from "../types/route-state";
import {
  completeInterviewSessionResponses,
  type CreateSessionBody,
  createSessionBodySchema,
  createInterviewSessionResponses,
  interviewSessionResponses,
  type InterviewSessionParams,
  interviewSessionParamsSchema,
  interviewSessionsListResponses,
  interviewStatsResponses,
  submitInterviewResponseResponses,
  type SubmitResponseRouteBody,
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

export const interviewRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.interviewBase),
})
  .post(
    "/sessions",
    {
      detail: { tags: ["Interview"] },
      body: createSessionBodySchema,
      response: createInterviewSessionResponses,
    },
    async ({ body, set }: { body: CreateSessionBody; set: RouteSetState }) => {
      const result = await createInterviewSession(body.studioId, body.config);
      set.status = HTTP_STATUS_CREATED;
      return result.body;
    },
  )
  .get(
    "/sessions",
    {
      detail: { tags: ["Interview"] },
      response: interviewSessionsListResponses,
    },
    async () => {
      const sessions = await interviewService.getSessions();
      return Promise.all(sessions.map(sessionWithDerivedFields));
    },
  )
  .get(
    "/sessions/:id",
    {
      detail: { tags: ["Interview"] },
      params: interviewSessionParamsSchema,
      response: interviewSessionResponses,
    },
    async ({ params, set }: { params: InterviewSessionParams; set: RouteSetState }) => {
      const result = await getInterviewSession(params.id);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
  )
  .post(
    "/sessions/:id/response",
    {
      detail: { tags: ["Interview"] },
      params: interviewSessionParamsSchema,
      body: submitResponseBodySchema,
      response: submitInterviewResponseResponses,
    },
    async ({
      params,
      body,
      set,
    }: {
      params: InterviewSessionParams;
      body: SubmitResponseRouteBody;
      set: RouteSetState;
    }) => {
      const result = await submitInterviewResponse(params.id, body);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
  )
  .post(
    "/sessions/:id/complete",
    {
      detail: { tags: ["Interview"] },
      params: interviewSessionParamsSchema,
      response: completeInterviewSessionResponses,
    },
    async ({ params, set }: { params: InterviewSessionParams; set: RouteSetState }) => {
      const result = await completeInterviewSession(params.id);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
  )
  .get(
    toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewStats),
    {
      detail: { tags: ["Interview"] },
      response: interviewStatsResponses,
    },
    async () => getInterviewStats(),
  );
