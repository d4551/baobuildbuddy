import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
import { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import {
  type CreateSessionBody,
  type InterviewSessionParams,
  type RouteSetState,
  type SubmitResponseRouteBody,
  createSessionBodySchema,
  interviewSessionParamsSchema,
  submitResponseBodySchema,
} from "./interview-route-contracts";
import {
  completeInterviewSession,
  createInterviewSession,
  getInterviewSession,
  submitInterviewResponse,
} from "./interview-route-support";
import { sessionWithDerivedFields } from "./interview-route-presentation";
import { getInterviewStats } from "./interview-route-stats";
import { interviewService } from "../services/interview-service";

export const interviewRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.interviewBase),
  tags: ["Interview"],
})
  .post(
    "/sessions",
    async ({ body, set }: { body: CreateSessionBody; set: RouteSetState }) => {
      const result = await createInterviewSession(body.studioId, body.config);
      set.status = HTTP_STATUS_CREATED;
      return result.body;
    },
    {
      body: StandardSchemaV1(createSessionBodySchema),
    },
  )
  .get("/sessions", async () => {
    const sessions = await interviewService.getSessions();
    return Promise.all(sessions.map(sessionWithDerivedFields));
  })
  .get(
    "/sessions/:id",
    async ({ params, set }: { params: InterviewSessionParams; set: RouteSetState }) => {
      const result = await getInterviewSession(params.id);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      params: StandardSchemaV1(interviewSessionParamsSchema),
    },
  )
  .post(
    "/sessions/:id/response",
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
    {
      params: StandardSchemaV1(interviewSessionParamsSchema),
      body: StandardSchemaV1(submitResponseBodySchema),
    },
  )
  .post(
    "/sessions/:id/complete",
    async ({ params, set }: { params: InterviewSessionParams; set: RouteSetState }) => {
      const result = await completeInterviewSession(params.id);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      params: StandardSchemaV1(interviewSessionParamsSchema),
    },
  )
  .get(toApiChildPath(API_ENDPOINTS.interviewBase, API_ENDPOINTS.interviewStats), async () =>
    getInterviewStats(),
  );
