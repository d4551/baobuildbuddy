import { API_ERROR_UNSUPPORTED_AUTOMATION_ACTION } from "@bao/shared/constants/api-errors";
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { settle } from "@bao/shared/utils/promise";
import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { mapAutomationRouteError } from "../utils/automation-route-error";
import { createServerLogger } from "../utils/logger";

const aiRoutesLogger = createServerLogger("ai-routes");

const routeResult = <const Status extends number, Body>(status: Status, body: Body) => ({
  status,
  body,
});

const startJobApplyRun = (
  runId: string,
  payload: {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
  },
) => {
  applicationAutomationService.runJobApply(runId, payload).then(undefined, (error) => {
    aiRoutesLogger.error(
      "Failed to execute job application automation run:",
      toErrorMessage(error),
    );
  });
};

export const handleAutomationActionRoute = async (body: {
  action: string;
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
}) => {
  const { action, jobUrl, resumeId, coverLetterId, jobId } = body;

  if (action !== "job_apply") {
    return routeResult(HTTP_STATUS_BAD_REQUEST, {
      error: API_ERROR_UNSUPPORTED_AUTOMATION_ACTION.replace("__ACTION__", action),
    });
  }

  const runResult = await settle(
    applicationAutomationService.createJobApplyRun(
      { jobUrl, resumeId, coverLetterId, jobId },
      { includeActionInPayload: true },
    ),
  );
  if (runResult.status === "rejected") {
    const mapped = mapAutomationRouteError(runResult.reason);
    return routeResult(mapped.status, {
      error: mapped.body.error.message,
    });
  }

  const runId = runResult.value;
  startJobApplyRun(runId, {
    jobUrl,
    resumeId,
    coverLetterId,
    jobId,
  });

  return routeResult(HTTP_STATUS_OK, {
    runId,
    status: "running",
    message:
      "Job application automation started. Use GET /api/automation/runs/:id to check status.",
  });
};
