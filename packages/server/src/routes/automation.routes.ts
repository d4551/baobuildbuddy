import {
  API_ERROR_AUTOMATION_RUN_NOT_FOUND,
  API_ERROR_INVALID_RUN_ID,
  API_ERROR_RUN_NOT_FOUND,
  API_ERROR_SCHEDULED_RUN_NOT_FOUND,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  RUN_ID_MIN_LENGTH,
  settle,
  type EmailResponseRequest,
} from "@bao/shared";
import { Elysia, t } from "elysia";

import { config } from "../config/env";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { mapAutomationRouteError, toRouteError } from "../utils/automation-route-error";
import { automationRateLimit } from "../utils/rate-limit";
import {
  automationRouteErrorResponses,
  automationRunEnvelopeBodySchema,
  automationRunIdParamsSchema,
  automationRunQuerySchema,
  AUTOMATION_STATUS_SUCCESS,
  capabilityAuditReportBodySchema,
  emailResponseBodySchema,
  jobApplyBodySchema,
  routeErrorBodySchema,
  RUN_ID_PATTERN,
  scheduledEmailResponseBodySchema,
  scheduledJobApplyBodySchema,
  scheduledScrapeBodySchema,
  scrapeBodySchema,
  type JobApplyRequestBody,
  type RunScrapeRequestBody,
  type ScheduleEmailResponseRequestBody,
  type ScheduleJobApplyRequestBody,
  type ScheduleScrapeRequestBody,
} from "./automation-route-contracts";
import {
  ensureAutomationVerifyContext,
  listAutomationRuns,
  readAutomationRunById,
  runJobApplyInBackground,
} from "./automation-route-support";

/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export const automationRoutes = new Elysia({ prefix: "/automation", tags: ["Automation"] })
  .use(automationRateLimit)
  .get(
    "/verify/context",
    async ({ set }) => {
      if (!config.enableAutomationVerification) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return ensureAutomationVerifyContext();
    },
    {
      response: {
        [HTTP_STATUS_OK]: t.Object({
          resumeId: t.String({ minLength: 1 }),
        }),
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
      },
    },
  )
  .post(
    "/job-apply",
    async ({ body, set }) => {
      const payload: JobApplyRequestBody = body;
      const createRunResult = await settle(applicationAutomationService.createJobApplyRun(payload));
      if (createRunResult.status === "rejected") {
        const mapped = mapAutomationRouteError(createRunResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      runJobApplyInBackground(createRunResult.value, payload);
      const run = await readAutomationRunById(createRunResult.value);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_AUTOMATION_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: jobApplyBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/job-apply/schedule",
    async ({ body, set }) => {
      const payload: ScheduleJobApplyRequestBody = body;
      const scheduleResult = await settle(
        applicationAutomationService.createScheduledJobApplyRun(
          {
            jobUrl: payload.jobUrl,
            resumeId: payload.resumeId,
            ...(payload.coverLetterId ? { coverLetterId: payload.coverLetterId } : {}),
            ...(payload.jobId ? { jobId: payload.jobId } : {}),
            ...(payload.customAnswers ? { customAnswers: payload.customAnswers } : {}),
          },
          payload.runAt,
        ),
      );
      if (scheduleResult.status === "rejected") {
        const mapped = mapAutomationRouteError(scheduleResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const run = await readAutomationRunById(scheduleResult.value.runId);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: scheduledJobApplyBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/email-response",
    async ({ body, set }) => {
      const payload: EmailResponseRequest = body;
      const emailResponseResult = await settle(
        applicationAutomationService.runEmailResponse(payload),
      );
      if (emailResponseResult.status === "rejected") {
        const mapped = mapAutomationRouteError(emailResponseResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      set.status = HTTP_STATUS_OK;
      return emailResponseResult.value;
    },
    {
      body: emailResponseBodySchema,
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
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/email-response/schedule",
    async ({ body, set }) => {
      const payload: ScheduleEmailResponseRequestBody = body;
      const scheduleResult = await settle(
        applicationAutomationService.createScheduledEmailResponseRun(
          {
            subject: payload.subject,
            message: payload.message,
            ...(payload.sender ? { sender: payload.sender } : {}),
            ...(payload.tone ? { tone: payload.tone } : {}),
            ...(payload.recipientEmail ? { recipientEmail: payload.recipientEmail } : {}),
            ...(payload.deliverAfterGeneration !== undefined
              ? { deliverAfterGeneration: payload.deliverAfterGeneration }
              : {}),
          },
          payload.runAt,
        ),
      );
      if (scheduleResult.status === "rejected") {
        const mapped = mapAutomationRouteError(scheduleResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const run = await readAutomationRunById(scheduleResult.value.runId);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: scheduledEmailResponseBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/scrape",
    async ({ body, set }) => {
      const payload: RunScrapeRequestBody = body;
      const runResult = await settle(applicationAutomationService.runScrape(payload.target));
      if (runResult.status === "rejected") {
        const mapped = mapAutomationRouteError(runResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const run = await readAutomationRunById(runResult.value);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_AUTOMATION_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: scrapeBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .post(
    "/scrape/schedule",
    async ({ body, set }) => {
      const payload: ScheduleScrapeRequestBody = body;
      const scheduleResult = await settle(
        applicationAutomationService.createScheduledScrapeRun(payload.target, payload.runAt),
      );
      if (scheduleResult.status === "rejected") {
        const mapped = mapAutomationRouteError(scheduleResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const run = await readAutomationRunById(scheduleResult.value.runId);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: scheduledScrapeBodySchema,
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        ...automationRouteErrorResponses,
      },
    },
  )
  .get(
    "/capabilities",
    async ({ set }) => {
      const auditResult = await settle(applicationAutomationService.getRpaCapabilityAudit());
      if (auditResult.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", "Failed to load RPA capability audit.");
      }

      set.status = HTTP_STATUS_OK;
      return auditResult.value;
    },
    {
      response: {
        [HTTP_STATUS_OK]: capabilityAuditReportBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    },
  )
  .get(
    "/runs",
    async ({ query }) => listAutomationRuns(query),
    {
      response: t.Array(automationRunEnvelopeBodySchema),
      query: automationRunQuerySchema,
    },
  )
  .get(
    "/runs/:id",
    async ({ params, set }) => {
      if (params.id.length < RUN_ID_MIN_LENGTH || !RUN_ID_PATTERN.test(params.id)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_INVALID_RUN_ID);
      }

      const run = await readAutomationRunById(params.id);
      if (!run) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      params: automationRunIdParamsSchema,
      response: {
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
      },
    },
  );
