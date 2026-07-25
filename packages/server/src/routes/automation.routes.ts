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
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { Elysia, type status } from "elysia";
import { toRouteError } from "../utils/automation-route-error";
import { openapiDetail } from "../utils/openapi-detail";
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
  automationCapabilitiesResponses,
  automationEmailResponseResponses,
  automationRunIdParamsSchema,
  automationRunQuerySchema,
  automationRunResponses,
  automationRunsListResponses,
  automationVerifyContextResponses,
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

type RouteStatus = typeof status;

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
    const { error, status } = context;
    const code = "code" in context && typeof context.code === "string" ? context.code : undefined;
    const isValidation =
      code === "VALIDATION" ||
      (typeof error === "object" &&
        error !== null &&
        "constructor" in error &&
        error.constructor.name === "ValidationError");
    if (!isValidation) {
      return;
    }

    return status(
      HTTP_STATUS_UNPROCESSABLE_ENTITY,
      toRouteError("OUTPUT_VALIDATION_ERROR", readValidationErrorMessage(error)),
    );
  })
  .get(
    "/verify/context",
    {
      detail: openapiDetail(
        "Automation",
        "Retrieve automation verify context for BaoBuildBuddy career automation.",
      ),
      response: automationVerifyContextResponses,
    },
    async ({ status }: { status: RouteStatus }) => {
      const result = await handleVerifyAutomationContext();
      return status(result.status, result.body);
    },
  )
  .post(
    "/job-apply",
    {
      detail: openapiDetail(
        "Automation",
        "Create or execute automation job apply for BaoBuildBuddy career automation.",
      ),
      body: jobApplyBodySchema,
      response: automationRunResponses,
    },
    async ({ body, status }: { body: JobApplyBody; status: RouteStatus }) => {
      if (!(hasText(body.jobUrl) && hasText(body.resumeId))) {
        return status(
          HTTP_STATUS_BAD_REQUEST,
          toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_JOB_APPLY_FIELDS_REQUIRED),
        );
      }

      const result = await handleJobApplyRoute({
        jobUrl: body.jobUrl,
        resumeId: body.resumeId,
        ...(body.coverLetterId ? { coverLetterId: body.coverLetterId } : {}),
        ...(body.jobId ? { jobId: body.jobId } : {}),
        ...(body.customAnswers ? { customAnswers: body.customAnswers } : {}),
      });
      return status(result.status, result.body);
    },
  )
  .post(
    "/job-apply/schedule",
    {
      detail: openapiDetail(
        "Automation",
        "Create or execute automation job apply schedule for BaoBuildBuddy career automation.",
      ),
      body: scheduledJobApplyBodySchema,
      response: automationRunResponses,
    },
    async ({ body, status }: { body: ScheduledJobApplyBody; status: RouteStatus }) => {
      if (!(hasText(body.jobUrl) && hasText(body.resumeId) && hasText(body.runAt))) {
        return status(
          HTTP_STATUS_BAD_REQUEST,
          toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_SCHEDULED_JOB_APPLY_FIELDS_REQUIRED),
        );
      }

      const result = await handleScheduledJobApplyRoute({
        jobUrl: body.jobUrl,
        resumeId: body.resumeId,
        runAt: body.runAt,
        ...(body.coverLetterId ? { coverLetterId: body.coverLetterId } : {}),
        ...(body.jobId ? { jobId: body.jobId } : {}),
        ...(body.customAnswers ? { customAnswers: body.customAnswers } : {}),
      });
      return status(result.status, result.body);
    },
  )
  .post(
    "/email-response",
    {
      detail: openapiDetail(
        "Automation",
        "Create or execute automation email response for BaoBuildBuddy career automation.",
      ),
      body: emailResponseBodySchema,
      response: automationEmailResponseResponses,
    },
    async ({ body, status }: { body: EmailResponseBody; status: RouteStatus }) => {
      if (!(hasText(body.subject) && hasText(body.message))) {
        return status(
          HTTP_STATUS_BAD_REQUEST,
          toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_EMAIL_RESPONSE_FIELDS_REQUIRED),
        );
      }

      const result = await handleEmailResponseRoute({
        subject: body.subject,
        message: body.message,
        ...(body.sender ? { sender: body.sender } : {}),
        ...(body.tone ? { tone: body.tone } : {}),
        ...(body.recipientEmail ? { recipientEmail: body.recipientEmail } : {}),
        ...(body.deliverAfterGeneration !== undefined
          ? { deliverAfterGeneration: body.deliverAfterGeneration }
          : {}),
      });
      return status(result.status, result.body);
    },
  )
  .post(
    "/email-response/schedule",
    {
      detail: openapiDetail(
        "Automation",
        "Create or execute automation email response schedule for BaoBuildBuddy career automation.",
      ),
      body: scheduledEmailResponseBodySchema,
      response: automationRunResponses,
    },
    async ({ body, status }: { body: ScheduledEmailResponseBody; status: RouteStatus }) => {
      if (!(hasText(body.subject) && hasText(body.message) && hasText(body.runAt))) {
        return status(
          HTTP_STATUS_BAD_REQUEST,
          toRouteError(
            "OUTPUT_VALIDATION_ERROR",
            API_ERROR_SCHEDULED_EMAIL_RESPONSE_FIELDS_REQUIRED,
          ),
        );
      }

      const result = await handleScheduledEmailResponseRoute({
        subject: body.subject,
        message: body.message,
        runAt: body.runAt,
        ...(body.sender ? { sender: body.sender } : {}),
        ...(body.tone ? { tone: body.tone } : {}),
        ...(body.recipientEmail ? { recipientEmail: body.recipientEmail } : {}),
        ...(body.deliverAfterGeneration !== undefined
          ? { deliverAfterGeneration: body.deliverAfterGeneration }
          : {}),
      });
      return status(result.status, result.body);
    },
  )
  .post(
    "/scrape",
    {
      detail: openapiDetail(
        "Automation",
        "Create or execute automation scrape for BaoBuildBuddy career automation.",
      ),
      body: scrapeBodySchema,
      response: automationRunResponses,
    },
    async ({ body, status }: { body: ScrapeBody; status: RouteStatus }) => {
      if (!body.target) {
        return status(
          HTTP_STATUS_BAD_REQUEST,
          toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_SCRAPE_TARGET_REQUIRED),
        );
      }

      const result = await handleScrapeRoute({ target: body.target });
      return status(result.status, result.body);
    },
  )
  .post(
    "/scrape/schedule",
    {
      detail: openapiDetail(
        "Automation",
        "Create or execute automation scrape schedule for BaoBuildBuddy career automation.",
      ),
      body: scheduledScrapeBodySchema,
      response: automationRunResponses,
    },
    async ({ body, status }: { body: ScheduledScrapeBody; status: RouteStatus }) => {
      if (!(body.target && hasText(body.runAt))) {
        return status(
          HTTP_STATUS_BAD_REQUEST,
          toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_SCHEDULED_SCRAPE_FIELDS_REQUIRED),
        );
      }

      const result = await handleScheduledScrapeRoute({
        target: body.target,
        runAt: body.runAt,
      });
      return status(result.status, result.body);
    },
  )
  .get(
    "/capabilities",
    {
      detail: openapiDetail(
        "Automation",
        "Retrieve automation capabilities for BaoBuildBuddy career automation.",
      ),
      response: automationCapabilitiesResponses,
    },
    async ({ status }: { status: RouteStatus }) => {
      const result = await handleAutomationCapabilitiesRoute();
      return status(result.status, result.body);
    },
  )
  .get(
    "/runs",
    {
      detail: openapiDetail(
        "Automation",
        "Retrieve automation runs for BaoBuildBuddy career automation.",
      ),
      query: automationRunQuerySchema,
      response: automationRunsListResponses,
    },
    async ({ query, status }: { query: AutomationRunQuery; status: RouteStatus }) =>
      status(HTTP_STATUS_OK, await listAutomationRuns(query)),
  )
  .get(
    "/runs/:id",
    {
      detail: openapiDetail(
        "Automation",
        "Retrieve automation runs :id for BaoBuildBuddy career automation.",
      ),
      params: automationRunIdParamsSchema,
      response: automationRunResponses,
    },
    async ({ params, status }: { params: AutomationRunIdParams; status: RouteStatus }) => {
      if (!hasText(params.id)) {
        return status(
          HTTP_STATUS_BAD_REQUEST,
          toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_AUTOMATION_RUN_ID_REQUIRED),
        );
      }

      const result = await handleAutomationRunByIdRoute(params.id);
      return status(result.status, result.body);
    },
  );
