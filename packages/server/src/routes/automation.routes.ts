import { Elysia } from "elysia";
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
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
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
  type AutomationRunIdParams,
  type AutomationRunQuery,
  automationRunIdParamsSchema,
  automationRunQuerySchema,
  type EmailResponseBody,
  emailResponseBodySchema,
  type JobApplyBody,
  jobApplyBodySchema,
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
  .get("/verify/context", { detail: { tags: ["Automation"] }, }, async ({ set }) => handleVerifyAutomationContext(set))
  .post(
    "/job-apply",
    { detail: { tags: ["Automation"] }, body: jobApplyBodySchema,
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
      }, async ({ body, set }: { body: ScheduledScrapeBody; set: RouteSetState }) => {
      if (!(body.target && hasText(body.runAt))) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_SCHEDULED_SCRAPE_FIELDS_REQUIRED);
      }

      return handleScheduledScrapeRoute({ target: body.target, runAt: body.runAt }, set);
    },
  )
  .get("/capabilities", { detail: { tags: ["Automation"] } }, async ({ set }) => {
    const result = await handleAutomationCapabilitiesRoute();
    if (!result.ok) {
      set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return result.body;
    }
    return result.body;
  })
  .get("/runs", { detail: { tags: ["Automation"] }, query: automationRunQuerySchema,
  }, async ({ query }: { query: AutomationRunQuery }) => listAutomationRuns(query))
  .get(
    "/runs/:id",
    { detail: { tags: ["Automation"] }, params: automationRunIdParamsSchema,
      }, async ({ params, set }: { params: AutomationRunIdParams; set: RouteSetState }) => {
      if (!hasText(params.id)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_AUTOMATION_RUN_ID_REQUIRED);
      }

      return handleAutomationRunByIdRoute(params.id, set);
    },
  );
