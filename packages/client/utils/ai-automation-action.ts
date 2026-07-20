import { isRecord } from "@bao/shared/utils/type-guards";
import { safeParseJson } from "@bao/shared/utils/json";

export type JobApplyAutomationAction = {
  action: "job_apply";
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
};

const JOB_APPLY_ACTION_PATTERN = /\{"action"\s*:\s*"job_apply"[^{}]*\}/u;

/**
 * Extracts a confirmed job_apply automation payload from assistant chat text.
 * System prompt emits a JSON action block only after user confirmation.
 */
export function parseJobApplyAutomationAction(
  content: string,
): JobApplyAutomationAction | null {
  const match = content.match(JOB_APPLY_ACTION_PATTERN);
  if (!match?.[0]) {
    return null;
  }
  const parsed = safeParseJson(match[0]);
  if (!isRecord(parsed) || parsed.action !== "job_apply") {
    return null;
  }
  const jobUrl = typeof parsed.jobUrl === "string" ? parsed.jobUrl.trim() : "";
  const resumeId = typeof parsed.resumeId === "string" ? parsed.resumeId.trim() : "";
  if (!jobUrl || !resumeId) {
    return null;
  }
  const coverLetterId =
    typeof parsed.coverLetterId === "string" && parsed.coverLetterId.trim().length > 0
      ? parsed.coverLetterId.trim()
      : undefined;
  const jobId =
    typeof parsed.jobId === "string" && parsed.jobId.trim().length > 0
      ? parsed.jobId.trim()
      : undefined;
  return {
    action: "job_apply",
    jobUrl,
    resumeId,
    ...(coverLetterId ? { coverLetterId } : {}),
    ...(jobId ? { jobId } : {}),
  };
}
