import { t, Elysia } from "elysia";
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
})
  .use(automationRateLimit)
  .error((context) => {
    const { error, set } = context;
    const code =
      "code" in context && typeof context.code === "string" ? context.code : undefined;
    const isValidation =
      code === "VALIDATION" ||
      (typeof error === "object" &&
        error !== null &&
        "constructor" in error &&
        error.constructor.name === "ValidationError");
    if (!isValidation) {
      return;
    }

    set.status = HTTP_STATUS_UNPROCESSABLE_ENTITY;
    return toRouteError("OUTPUT_VALIDATION_ERROR", readValidationErrorMessage(error));
  })
  .get("/verify/context", { detail: { tags: ["Automation"] }, response: {
      [HTTP_STATUS_OK]: t.Object({
          resumeId: t.String({ minLength: 1 }),
        }),
      [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
    },
  }, async ({ set }) => handleVerifyAutomationContext(set))
  .post(
    "/job-apply",
    { detail: { tags: ["Automation"] }, body: jobApplyBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
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
    { detail: { tags: ["Automation"] }, body: scheduledJobApplyBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
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
    { detail: { tags: ["Automation"] }, body: emailResponseBodySchema,
      response: {
        [HTTP_STATUS_OK]: t.Object({
            runId: t.String(),
            status: t.Literal(AUTOMATION_STATUS_SUCCESS),
            reply: t.String(),
            provider: t.String(),
            model: t.String(),
            delivered: t.Boolean(),
            recipientEmail: t.Optional(t.String()),
            deliveredAt: t.Optional(t.String()),
            messageId: t.Optional(t.String()),
          }),
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
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
    { detail: { tags: ["Automation"] }, body: scheduledEmailResponseBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
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
    { detail: { tags: ["Automation"] }, body: scrapeBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
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
    { detail: { tags: ["Automation"] }, body: scheduledScrapeBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    }, async ({ body, set }: { body: ScheduledScrapeBody; set: RouteSetState }) => {
      if (!(body.target && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_SCHEDULED_SCRAPE_FIELDS_REQUIRED);
      }

      return handleScheduledScrapeRoute({ target: body.target, runAt: body.runAt }, set);
    },
  )
  .get("/capabilities", { detail: { tags: ["Automation"] } }, async ({ set }) =>
    handleAutomationCapabilitiesRoute(set),
  )
  .get("/runs", { detail: { tags: ["Automation"] }, response: t.Array(automationRunEnvelopeBodySchema),
    query: automationRunQuerySchema,
  }, async ({ query }: { query: AutomationRunQuery }) => listAutomationRuns(query))
  .get(
    "/runs/:id",
    { detail: { tags: ["Automation"] }, params: automationRunIdParamsSchema,
      response: {
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
      },
    }, async ({ params, set }: { params: AutomationRunIdParams; set: RouteSetState }) => {
      if (!hasText(params.id)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_AUTOMATION_RUN_ID_REQUIRED);
      }

      return handleAutomationRunByIdRoute(params.id, set);
    },
  );
