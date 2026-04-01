import { API_ERROR_UNSUPPORTED_AUTOMATION_ACTION } from "@bao/shared/constants/api-errors";
import { HTTP_STATUS_BAD_REQUEST } from "@bao/shared/constants/http";
import { settle } from "@bao/shared/utils/promise";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { mapAutomationRouteError } from "../utils/automation-route-error";
import { createServerLogger } from "../utils/logger";
import type { RouteSetState } from "./ai-route-contracts";

const aiRoutesLogger = createServerLogger("ai-routes");

const startJobApplyRun = (
  runId: string,
  payload: {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
  },
) => {
  applicationAutomationService.runJobApply(runId, payload).then(undefined, (error: unknown) => {
    aiRoutesLogger.error("Failed to execute job application automation run:", error);
  });
};

export const handleAutomationActionRoute = async (
  body: {
    action: string;
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
  },
  set: RouteSetState,
) => {
  const { action, jobUrl, resumeId, coverLetterId, jobId } = body;

  if (action !== "job_apply") {
    set.status = HTTP_STATUS_BAD_REQUEST;
    return { error: API_ERROR_UNSUPPORTED_AUTOMATION_ACTION.replace("__ACTION__", action) };
  }

  const runResult = await settle(
    applicationAutomationService.createJobApplyRun(
      { jobUrl, resumeId, coverLetterId, jobId },
      { includeActionInPayload: true },
    ),
  );
  if (runResult.status === "rejected") {
    const mapped = mapAutomationRouteError(runResult.reason);
    set.status = mapped.status;
    return {
      error: mapped.body.error.message,
    };
  }

  const runId = runResult.value;
  startJobApplyRun(runId, {
    jobUrl,
    resumeId,
    coverLetterId,
    jobId,
  });

  return {
    runId,
    status: "running",
    message:
      "Job application automation started. Use GET /api/automation/runs/:id to check status.",
  };
};
