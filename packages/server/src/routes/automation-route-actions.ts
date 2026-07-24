import {
  API_ERROR_AUTOMATION_RUN_NOT_FOUND,
  API_ERROR_INVALID_RUN_ID,
  API_ERROR_RUN_NOT_FOUND,
  API_ERROR_SCHEDULED_RUN_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NO_CONTENT,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { RUN_ID_MIN_LENGTH } from "@bao/shared/constants/schema-limits";
import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import { settle } from "@bao/shared/utils/promise";
import { config } from "../config/env";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { mapAutomationRouteError, toRouteError } from "../utils/automation-route-error";
import type {
  JobApplyRequestBody,
  RunScrapeRequestBody,
  ScheduleEmailResponseRequestBody,
  ScheduleJobApplyRequestBody,
  ScheduleScrapeRequestBody,
} from "./automation-route-contracts";
import { RUN_ID_PATTERN } from "./automation-route-contracts";
import {
  ensureAutomationVerifyContext,
  readAutomationRunById,
  runJobApplyInBackground,
} from "./automation-route-support";

const routeResult = <const Status extends number, Body>(status: Status, body: Body) => ({
  status,
  body,
});

export const handleVerifyAutomationContext = async () => {
  if (!config.enableAutomationVerification) {
    // Optional verify harness — 204 avoids browser console 404 noise on job-apply.
    return routeResult(HTTP_STATUS_NO_CONTENT, undefined);
  }

  return routeResult(HTTP_STATUS_OK, await ensureAutomationVerifyContext());
};

export const handleJobApplyRoute = async (payload: JobApplyRequestBody) => {
  const createRunResult = await settle(applicationAutomationService.createJobApplyRun(payload));
  if (createRunResult.status === "rejected") {
    const mapped = mapAutomationRouteError(createRunResult.reason);
    return routeResult(mapped.status, mapped.body);
  }

  runJobApplyInBackground(createRunResult.value, payload);
  const run = await readAutomationRunById(createRunResult.value);
  if (!run) {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_AUTOMATION_RUN_NOT_FOUND),
    );
  }

  return routeResult(HTTP_STATUS_OK, run);
};

export const handleScheduledJobApplyRoute = async (payload: ScheduleJobApplyRequestBody) => {
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
    return routeResult(mapped.status, mapped.body);
  }

  const run = await readAutomationRunById(scheduleResult.value.runId);
  if (!run) {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND),
    );
  }

  return routeResult(HTTP_STATUS_OK, run);
};

export const handleEmailResponseRoute = async (payload: EmailResponseRequest) => {
  const emailResponseResult = await settle(applicationAutomationService.runEmailResponse(payload));
  if (emailResponseResult.status === "rejected") {
    const mapped = mapAutomationRouteError(emailResponseResult.reason);
    return routeResult(mapped.status, mapped.body);
  }

  return routeResult(HTTP_STATUS_OK, emailResponseResult.value);
};

export const handleScheduledEmailResponseRoute = async (
  payload: ScheduleEmailResponseRequestBody,
) => {
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
    return routeResult(mapped.status, mapped.body);
  }

  const run = await readAutomationRunById(scheduleResult.value.runId);
  if (!run) {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND),
    );
  }

  return routeResult(HTTP_STATUS_OK, run);
};

export const handleScrapeRoute = async (payload: RunScrapeRequestBody) => {
  const runResult = await settle(applicationAutomationService.runScrape(payload.target));
  if (runResult.status === "rejected") {
    const mapped = mapAutomationRouteError(runResult.reason);
    return routeResult(mapped.status, mapped.body);
  }

  const run = await readAutomationRunById(runResult.value);
  if (!run) {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_AUTOMATION_RUN_NOT_FOUND),
    );
  }

  return routeResult(HTTP_STATUS_OK, run);
};

export const handleScheduledScrapeRoute = async (payload: ScheduleScrapeRequestBody) => {
  const scheduleResult = await settle(
    applicationAutomationService.createScheduledScrapeRun(payload.target, payload.runAt),
  );
  if (scheduleResult.status === "rejected") {
    const mapped = mapAutomationRouteError(scheduleResult.reason);
    return routeResult(mapped.status, mapped.body);
  }

  const run = await readAutomationRunById(scheduleResult.value.runId);
  if (!run) {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND),
    );
  }

  return routeResult(HTTP_STATUS_OK, run);
};

export const handleAutomationCapabilitiesRoute = async () => {
  const auditResult = await settle(applicationAutomationService.getRpaCapabilityAudit());
  if (auditResult.status === "rejected") {
    return routeResult(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      toRouteError("SCRIPT_OUTPUT_INVALID", "Failed to load RPA capability audit."),
    );
  }

  return routeResult(HTTP_STATUS_OK, auditResult.value);
};

export const handleAutomationRunByIdRoute = async (runId: string) => {
  if (runId.length < RUN_ID_MIN_LENGTH || !RUN_ID_PATTERN.test(runId)) {
    return routeResult(
      HTTP_STATUS_BAD_REQUEST,
      toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_INVALID_RUN_ID),
    );
  }

  const run = await readAutomationRunById(runId);
  if (!run) {
    return routeResult(
      HTTP_STATUS_NOT_FOUND,
      toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_RUN_NOT_FOUND),
    );
  }

  return routeResult(HTTP_STATUS_OK, run);
};
