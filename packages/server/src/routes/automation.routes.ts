import {
  API_ERROR_AUTOMATION_RUN_ID_REQUIRED,
  API_ERROR_EMAIL_RESPONSE_FIELDS_REQUIRED,
  API_ERROR_JOB_APPLY_FIELDS_REQUIRED,
  API_ERROR_SCHEDULED_EMAIL_RESPONSE_FIELDS_REQUIRED,
  API_ERROR_SCHEDULED_JOB_APPLY_FIELDS_REQUIRED,
  API_ERROR_SCHEDULED_SCRAPE_FIELDS_REQUIRED,
  API_ERROR_SCRAPE_TARGET_REQUIRED,
} from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import Type, { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
import type { RouteSetState } from "../types/route-state";
import { toRouteError } from "../utils/automation-route-error";
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
  AUTOMATION_STATUS_SUCCESS,
  type AutomationRunIdParams,
  type AutomationRunQuery,
  automationRunEnvelopeBodySchema,
  automationRunIdParamsSchema,
  automationRunQuerySchema,
  capabilityAuditReportBodySchema,
  type EmailResponseBody,
  emailResponseBodySchema,
  type JobApplyBody,
  jobApplyBodySchema,
  routeErrorBodySchema,
  type ScheduledEmailResponseBody,
  type ScheduledJobApplyBody,
  type ScheduledScrapeBody,
  type ScrapeBody,
  scheduledEmailResponseBodySchema,
  scheduledJobApplyBodySchema,
  scheduledScrapeBodySchema,
  scrapeBodySchema,
} from "./automation-route-contracts";
import { listAutomationRuns } from "./automation-route-support";

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
  .error(({ code, error, set }) => {
    if (code !== "VALIDATION") {
      return;
    }

    set.status = HTTP_STATUS_UNPROCESSABLE_ENTITY;
    return toRouteError("OUTPUT_VALIDATION_ERROR", readValidationErrorMessage(error));
  })
  .get("/verify/context", {
    response: {
      [HTTP_STATUS_OK]: StandardSchemaV1(
        Type.Object({
          resumeId: Type.String({ minLength: 1 }),
        }),
      ),
      [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
    },
  }, async ({ set }) => handleVerifyAutomationContext(set))
  .post(
    "/job-apply",
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
    }, async ({ body, set }: { body: JobApplyBody; set: RouteSetState }) => {
      if (!(hasText(body.jobUrl) && hasText(body.resumeId))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_JOB_APPLY_FIELDS_REQUIRED);
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
  )
  .post(
    "/job-apply/schedule",
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
    }, async ({ body, set }: { body: ScheduledJobApplyBody; set: RouteSetState }) => {
      if (!(hasText(body.jobUrl) && hasText(body.resumeId) && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError(
          "OUTPUT_VALIDATION_ERROR",
          API_ERROR_SCHEDULED_JOB_APPLY_FIELDS_REQUIRED,
        );
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
  )
  .post(
    "/email-response",
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
    }, async ({ body, set }: { body: EmailResponseBody; set: RouteSetState }) => {
      if (!(hasText(body.subject) && hasText(body.message))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_EMAIL_RESPONSE_FIELDS_REQUIRED);
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
  )
  .post(
    "/email-response/schedule",
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
    }, async ({ body, set }: { body: ScheduledEmailResponseBody; set: RouteSetState }) => {
      if (!(hasText(body.subject) && hasText(body.message) && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError(
          "OUTPUT_VALIDATION_ERROR",
          API_ERROR_SCHEDULED_EMAIL_RESPONSE_FIELDS_REQUIRED,
        );
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
  )
  .post(
    "/scrape",
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
    }, async ({ body, set }: { body: ScrapeBody; set: RouteSetState }) => {
      if (!body.target) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_SCRAPE_TARGET_REQUIRED);
      }

      return handleScrapeRoute({ target: body.target }, set);
    },
  )
  .post(
    "/scrape/schedule",
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
    }, async ({ body, set }: { body: ScheduledScrapeBody; set: RouteSetState }) => {
      if (!(body.target && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_SCHEDULED_SCRAPE_FIELDS_REQUIRED);
      }

      return handleScheduledScrapeRoute({ target: body.target, runAt: body.runAt }, set);
    },
  )
  .get("/capabilities", {
    response: {
      [HTTP_STATUS_OK]: StandardSchemaV1(capabilityAuditReportBodySchema),
      [HTTP_STATUS_INTERNAL_SERVER_ERROR]: StandardSchemaV1(routeErrorBodySchema),
    },
  }, async ({ set }) => handleAutomationCapabilitiesRoute(set))
  .get("/runs", {
    response: StandardSchemaV1(Type.Array(automationRunEnvelopeBodySchema)),
    query: StandardSchemaV1(automationRunQuerySchema),
  }, async ({ query }: { query: AutomationRunQuery }) => listAutomationRuns(query))
  .get(
    "/runs/:id",
    {
      params: StandardSchemaV1(automationRunIdParamsSchema),
      response: {
        [HTTP_STATUS_BAD_REQUEST]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_NOT_FOUND]: StandardSchemaV1(routeErrorBodySchema),
        [HTTP_STATUS_OK]: StandardSchemaV1(automationRunEnvelopeBodySchema),
      },
    }, async ({ params, set }: { params: AutomationRunIdParams; set: RouteSetState }) => {
      if (!hasText(params.id)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_AUTOMATION_RUN_ID_REQUIRED);
      }

      return handleAutomationRunByIdRoute(params.id, set);
    },
  );
