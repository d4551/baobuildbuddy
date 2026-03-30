import { HTTP_STATUS_CREATED } from "@bao/shared";
import { Elysia } from "elysia";
import {
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

export const interviewRoutes = new Elysia({ prefix: "/interview", tags: ["Interview"] })
  .post(
    "/sessions",
    async ({ body, set }) => {
      const result = await createInterviewSession(body.studioId, body.config);
      set.status = HTTP_STATUS_CREATED;
      return result.body;
    },
    {
      body: createSessionBodySchema,
    },
  )
  .get("/sessions", async () => {
    const sessions = await interviewService.getSessions();
    return Promise.all(sessions.map(sessionWithDerivedFields));
  })
  .get(
    "/sessions/:id",
    async ({ params, set }) => {
      const result = await getInterviewSession(params.id);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      params: interviewSessionParamsSchema,
    },
  )
  .post(
    "/sessions/:id/response",
    async ({ params, body, set }) => {
      const result = await submitInterviewResponse(params.id, body);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      params: interviewSessionParamsSchema,
      body: submitResponseBodySchema,
    },
  )
  .post(
    "/sessions/:id/complete",
    async ({ params, set }) => {
      const result = await completeInterviewSession(params.id);
      if (result.status !== null) {
        set.status = result.status;
      }
      return result.body;
    },
    {
      params: interviewSessionParamsSchema,
    },
  )
  .get("/stats", async () => getInterviewStats());
