import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { StandardSchemaV1 } from "baobox";
import Type from "baobox";
import { Elysia } from "elysia";
import { automationRateLimit } from "../utils/rate-limit";
import {
  handleAutomationCapabilitiesRoute,
  handleAutomationRunByIdRoute,
  handleEmailResponseRoute,
  handleJobApplyRoute,
  handleScheduledEmailResponseRoute,
  handleScheduledJobApplyRoute,
  handleScheduledScrapeRoute,
  handleScrapeRoute,
  handleVerifyAutomationContext,
} from "./automation-route-actions";
import {
  type AutomationRunIdParams,
  type AutomationRunQuery,
  type EmailResponseBody,
  type JobApplyBody,
  type RouteSetState,
  type ScheduledEmailResponseBody,
  type ScheduledJobApplyBody,
  type ScheduledScrapeBody,
  type ScrapeBody,
  automationRunEnvelopeBodySchema,
  automationRunIdParamsSchema,
  automationRunQuerySchema,
  AUTOMATION_STATUS_SUCCESS,
  capabilityAuditReportBodySchema,
  emailResponseBodySchema,
  jobApplyBodySchema,
  routeErrorBodySchema,
  scheduledEmailResponseBodySchema,
  scheduledJobApplyBodySchema,
  scheduledScrapeBodySchema,
  scrapeBodySchema,
} from "./automation-route-contracts";
import { listAutomationRuns } from "./automation-route-support";
import { toRouteError } from "../utils/automation-route-error";

const hasText = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

const hasMessage = (value: object): value is { message: string } =>
  "message" in value && typeof value.message === "string" && value.message.length > 0;

const readValidationErrorMessage = (error: unknown): string => {
  if (typeof error !== "object" || error === null) {
    return "Request validation failed.";
  }

  return hasMessage(error) ? error.message : "Request validation failed.";
};

/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export const automationRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.automationBase),
  tags: ["Automation"],
})
  .use(automationRateLimit)
  .onError(({ code, error, set }) => {
    if (code !== "VALIDATION") {
      return;
    }

    set.status = HTTP_STATUS_UNPROCESSABLE_ENTITY;
    return toRouteError("OUTPUT_VALIDATION_ERROR", readValidationErrorMessage(error));
  })
  .get("/verify/context", async ({ set }) => handleVerifyAutomationContext(set), {
    response: {
      [HTTP_STATUS_OK]: StandardSchemaV1(
        Type.Object({
          resumeId: Type.String({ minLength: 1 }),
        }),
      ),
      [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
    },
  })
  .post(
    "/job-apply",
    async ({ body, set }: { body: JobApplyBody; set: RouteSetState }) => {
      if (!(hasText(body.jobUrl) && hasText(body.resumeId))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", "jobUrl and resumeId are required.");
      }

      return handleJobApplyRoute(
        {
          jobUrl: body.jobUrl,
          resumeId: body.resumeId,
          ...(body.coverLetterId ? { coverLetterId: body.coverLetterId } : {}),
          ...(body.jobId ? { jobId: body.jobId } : {}),
          ...(body.customAnswers ? { customAnswers: body.customAnswers } : {}),
        },
        set,
      );
    },
    {
      body: StandardSchemaV1(jobApplyBodySchema),
      response: {
        [HTTP_STATUS_OK]: StandardSchemaV1(automationRunEnvelopeBodySchema),
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_CONFLICT]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
      },
    },
  )
  .post(
    "/job-apply/schedule",
    async ({ body, set }: { body: ScheduledJobApplyBody; set: RouteSetState }) => {
      if (!(hasText(body.jobUrl) && hasText(body.resumeId) && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", "jobUrl, resumeId, and runAt are required.");
      }

      return handleScheduledJobApplyRoute(
        {
          jobUrl: body.jobUrl,
          resumeId: body.resumeId,
          runAt: body.runAt,
          ...(body.coverLetterId ? { coverLetterId: body.coverLetterId } : {}),
          ...(body.jobId ? { jobId: body.jobId } : {}),
          ...(body.customAnswers ? { customAnswers: body.customAnswers } : {}),
        },
        set,
      );
    },
    {
      body: StandardSchemaV1(scheduledJobApplyBodySchema),
      response: {
        [HTTP_STATUS_OK]: StandardSchemaV1(automationRunEnvelopeBodySchema),
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_CONFLICT]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
      },
    },
  )
  .post(
    "/email-response",
    async ({ body, set }: { body: EmailResponseBody; set: RouteSetState }) => {
      if (!(hasText(body.subject) && hasText(body.message))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", "subject and message are required.");
      }

      return handleEmailResponseRoute(
        {
          subject: body.subject,
          message: body.message,
          ...(body.sender ? { sender: body.sender } : {}),
          ...(body.tone ? { tone: body.tone } : {}),
          ...(body.recipientEmail ? { recipientEmail: body.recipientEmail } : {}),
          ...(body.deliverAfterGeneration !== undefined
            ? { deliverAfterGeneration: body.deliverAfterGeneration }
            : {}),
        },
        set,
      );
    },
    {
      body: StandardSchemaV1(emailResponseBodySchema),
      response: {
        [HTTP_STATUS_OK]: StandardSchemaV1(
          Type.Object({
            runId: Type.String(),
            status: Type.Literal(AUTOMATION_STATUS_SUCCESS),
            reply: Type.String(),
            provider: Type.String(),
            model: Type.String(),
            delivered: Type.Boolean(),
            recipientEmail: Type.Optional(Type.String()),
            deliveredAt: Type.Optional(Type.String()),
            messageId: Type.Optional(Type.String()),
          }),
        ),
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_CONFLICT]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
      },
    },
  )
  .post(
    "/email-response/schedule",
    async ({ body, set }: { body: ScheduledEmailResponseBody; set: RouteSetState }) => {
      if (!(hasText(body.subject) && hasText(body.message) && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", "subject, message, and runAt are required.");
      }

      return handleScheduledEmailResponseRoute(
        {
          subject: body.subject,
          message: body.message,
          runAt: body.runAt,
          ...(body.sender ? { sender: body.sender } : {}),
          ...(body.tone ? { tone: body.tone } : {}),
          ...(body.recipientEmail ? { recipientEmail: body.recipientEmail } : {}),
          ...(body.deliverAfterGeneration !== undefined
            ? { deliverAfterGeneration: body.deliverAfterGeneration }
            : {}),
        },
        set,
      );
    },
    {
      body: StandardSchemaV1(scheduledEmailResponseBodySchema),
      response: {
        [HTTP_STATUS_OK]: StandardSchemaV1(automationRunEnvelopeBodySchema),
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_CONFLICT]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
      },
    },
  )
  .post(
    "/scrape",
    async ({ body, set }: { body: ScrapeBody; set: RouteSetState }) => {
      if (!body.target) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", "target is required.");
      }

      return handleScrapeRoute({ target: body.target }, set);
    },
    {
      body: StandardSchemaV1(scrapeBodySchema),
      response: {
        [HTTP_STATUS_OK]: StandardSchemaV1(automationRunEnvelopeBodySchema),
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_CONFLICT]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
      },
    },
  )
  .post(
    "/scrape/schedule",
    async ({ body, set }: { body: ScheduledScrapeBody; set: RouteSetState }) => {
      if (!(body.target && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", "target and runAt are required.");
      }

      return handleScheduledScrapeRoute({ target: body.target, runAt: body.runAt }, set);
    },
    {
      body: StandardSchemaV1(scheduledScrapeBodySchema),
      response: {
        [HTTP_STATUS_OK]: StandardSchemaV1(automationRunEnvelopeBodySchema),
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_CONFLICT]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
      },
    },
  )
  .get("/capabilities", async ({ set }) => handleAutomationCapabilitiesRoute(set), {
    response: {
      [HTTP_STATUS_OK]: StandardSchemaV1(capabilityAuditReportBodySchema),
      [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
    },
  })
  .get("/runs", async ({ query }: { query: AutomationRunQuery }) => listAutomationRuns(query), {
    response: StandardSchemaV1(Type.Array(automationRunEnvelopeBodySchema)),
    query: StandardSchemaV1(automationRunQuerySchema),
  })
  .get(
    "/runs/:id",
    async ({ params, set }: { params: AutomationRunIdParams; set: RouteSetState }) => {
      if (!hasText(params.id)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", "id is required.");
      }

      return handleAutomationRunByIdRoute(params.id, set);
    },
    {
      params: StandardSchemaV1(automationRunIdParamsSchema),
      response: {
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_OK]: StandardSchemaV1(automationRunEnvelopeBodySchema),
      },
    },
  );
