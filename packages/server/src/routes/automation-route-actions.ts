import {
  API_ERROR_AUTOMATION_RUN_NOT_FOUND,
  API_ERROR_INVALID_RUN_ID,
  API_ERROR_RUN_NOT_FOUND,
  API_ERROR_SCHEDULED_RUN_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
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

interface RouteSetState {
  status?: number | string;
}

export const handleVerifyAutomationContext = async (set: RouteSetState) => {
  if (!config.enableAutomationVerification) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_RUN_NOT_FOUND);
  }

  set.status = HTTP_STATUS_OK;
  return ensureAutomationVerifyContext();
};

export const handleJobApplyRoute = async (payload: JobApplyRequestBody, set: RouteSetState) => {
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
};

export const handleScheduledJobApplyRoute = async (
  payload: ScheduleJobApplyRequestBody,
  set: RouteSetState,
) => {
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
};

export const handleEmailResponseRoute = async (
  payload: EmailResponseRequest,
  set: RouteSetState,
) => {
  const emailResponseResult = await settle(applicationAutomationService.runEmailResponse(payload));
  if (emailResponseResult.status === "rejected") {
    const mapped = mapAutomationRouteError(emailResponseResult.reason);
    set.status = mapped.status;
    return mapped.body;
  }

  set.status = HTTP_STATUS_OK;
  return emailResponseResult.value;
};

export const handleScheduledEmailResponseRoute = async (
  payload: ScheduleEmailResponseRequestBody,
  set: RouteSetState,
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
};

export const handleScrapeRoute = async (payload: RunScrapeRequestBody, set: RouteSetState) => {
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
};

export const handleScheduledScrapeRoute = async (
  payload: ScheduleScrapeRequestBody,
  set: RouteSetState,
) => {
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
};

export const handleAutomationCapabilitiesRoute = async (set: RouteSetState) => {
  const auditResult = await settle(applicationAutomationService.getRpaCapabilityAudit());
  if (auditResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return toRouteError("SCRIPT_OUTPUT_INVALID", "Failed to load RPA capability audit.");
  }

  set.status = HTTP_STATUS_OK;
  return auditResult.value;
};

export const handleAutomationRunByIdRoute = async (runId: string, set: RouteSetState) => {
  if (runId.length < RUN_ID_MIN_LENGTH || !RUN_ID_PATTERN.test(runId)) {
    set.status = HTTP_STATUS_BAD_REQUEST;
    return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_INVALID_RUN_ID);
  }

  const run = await readAutomationRunById(runId);
  if (!run) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_RUN_NOT_FOUND);
  }

  set.status = HTTP_STATUS_OK;
  return run;
};
