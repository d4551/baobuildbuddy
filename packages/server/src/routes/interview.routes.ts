import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import { interviewService } from "../services/interview-service";
import type { RouteSetState } from "../types/route-state";
import {
  type CreateSessionBody,
  createSessionBodySchema,
  type InterviewSessionParams,
  interviewSessionParamsSchema,
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
  tags: ["Interview"],
})
  .post(
    "/sessions",
    {
      body: StandardSchemaV1(createSessionBodySchema),
    }, async ({ body, set }: { body: CreateSessionBody; set: RouteSetState }) => {
      const result = await createInterviewSession(body.studioId, body.config);
      set.status = HTTP_STATUS_CREATED;
      return result.body;
    },
  )
  .get("/sessions", async () => {
    const sessions = await interviewService.getSessions();
    return Promise.all(sessions.map(sessionWithDerivedFields));
  })
  .get(
    "/sessions/:id",
    {
      params: StandardSchemaV1(interviewSessionParamsSchema),
    }, async ({ params, set }: { params: InterviewSessionParams; set: RouteSetState }) => {
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
      params: StandardSchemaV1(interviewSessionParamsSchema),
      body: StandardSchemaV1(submitResponseBodySchema),
    }, async ({
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
      params: StandardSchemaV1(interviewSessionParamsSchema),
    }, async ({ params, set }: { params: InterviewSessionParams; set: RouteSetState }) => {
      const result = await completeInterviewSession(params.id);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
  )
  .get(toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewStats), async () =>
    getInterviewStats(),
  );
