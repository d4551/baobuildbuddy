import type { RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { coverLetters, resumes } from "../../db/schema/schema-modules";
import { resumeService } from "../resume-service";
import {
  AutomationConcurrencyLimitError,
  AutomationDependencyMissingError,
  AutomationRunNotFoundError,
  AutomationValidationError,
} from "./automation-errors";
import {
  assertRunExists,
  markRunFailed,
  resolveRunArtifactDir,
} from "./automation-run-persistence";
import type { JobApplyExecutionPayload, JobApplyPayload } from "./automation-run-inputs";
import { loadAutomationSettings, resolveMaxConcurrentRuns } from "./automation-settings-support";
import {
  normalizeGeneratedFieldAnswers,
  resolveAutofillAnalysis,
} from "./automation-job-apply-autofill";
import { createResumeUploadArtifact } from "./automation-job-apply-resume-artifact";
import type { JobApplyRunPreparation } from "./automation-service-contracts";
import { sanitizeAndValidateJobUrl, sanitizeCustomAnswers } from "./automation-validation";

const MIN_RESUME_ID_LENGTH = 1;

const assertConcurrencyLimit = async (runId: string, maxConcurrentRuns: number): Promise<void> => {
  const runningRows = await db
    .select({ count: count() })
    .from(automationRuns)
    .where(
      and(
        eq(automationRuns.status, "running"),
        eq(automationRuns.type, "job_apply"),
        ne(automationRuns.id, runId),
      ),
    );
  const runningCount = runningRows[0]?.count || 0;
  if (runningCount >= maxConcurrentRuns) {
    throw new AutomationConcurrencyLimitError(runningCount, maxConcurrentRuns);
  }
};

const loadResumeOrFail = async (
  runId: string,
  resumeId: string,
  automationSettings: Awaited<ReturnType<typeof loadAutomationSettings>>,
  runArtifactDir: string,
) => {
  const resume = await resumeService.getResume(resumeId);
  if (!resume) {
    const error = new AutomationDependencyMissingError("resume", resumeId);
    await markRunFailed(runId, error.message, automationSettings);
    throw error;
  }
  const resumeFilePath = await createResumeUploadArtifact(runArtifactDir, resume);
  return { resume, resumeFilePath };
};

const loadCoverLetterOrFail = async (
  runId: string,
  coverLetterId: string | undefined,
  automationSettings: Awaited<ReturnType<typeof loadAutomationSettings>>,
) => {
  if (!coverLetterId) {
    return null;
  }

  const coverLetterRows = await db
    .select()
    .from(coverLetters)
    .where(eq(coverLetters.id, coverLetterId))
    .limit(1);
  if (coverLetterRows.length === 0) {
    const error = new AutomationDependencyMissingError("coverLetter", coverLetterId);
    await markRunFailed(runId, error.message, automationSettings);
    throw error;
  }
  return coverLetterRows[0];
};

export const normalizeJobApplyPayload = (payload: JobApplyPayload): JobApplyExecutionPayload => {
  const jobUrl = sanitizeAndValidateJobUrl(payload.jobUrl);
  const customAnswers = sanitizeCustomAnswers(payload.customAnswers);

  const resumeId = payload.resumeId?.trim() ?? "";
  if (!resumeId || resumeId.length < MIN_RESUME_ID_LENGTH) {
    throw new AutomationValidationError("resumeId is required");
  }

  const normalizedPayload: JobApplyExecutionPayload = {
    jobUrl,
    resumeId,
    customAnswers,
  };
  const jobId = payload.jobId?.trim();
  if (jobId) {
    normalizedPayload.jobId = jobId;
  }
  const coverLetterId = payload.coverLetterId?.trim();
  if (coverLetterId) {
    normalizedPayload.coverLetterId = coverLetterId;
  }

  return normalizedPayload;
};

export const assertJobApplyDependencies = async (
  payload: JobApplyExecutionPayload,
): Promise<void> => {
  const resumeRows = await db
    .select()
    .from(resumes)
    .where(eq(resumes.id, payload.resumeId))
    .limit(1);
  if (resumeRows.length === 0) {
    throw new AutomationDependencyMissingError("resume", payload.resumeId);
  }

  if (!payload.coverLetterId) {
    return;
  }

  const coverLetterRows = await db
    .select()
    .from(coverLetters)
    .where(eq(coverLetters.id, payload.coverLetterId))
    .limit(1);
  if (coverLetterRows.length === 0) {
    throw new AutomationDependencyMissingError("coverLetter", payload.coverLetterId);
  }
};

export const prepareJobApplyRun = async (params: {
  runId: string;
  payload: JobApplyPayload;
  progressHandler: (event: RpaRunEvent) => void;
  clearScheduledRunTimer: (runId: string) => void;
  invalidRunIdMessage: string;
}): Promise<JobApplyRunPreparation> => {
  params.clearScheduledRunTimer(params.runId);
  const normalized = normalizeJobApplyPayload(params.payload);
  await assertRunExists(
    params.runId,
    (missingRunId) => new AutomationRunNotFoundError(missingRunId),
  );

  const automationSettings = await loadAutomationSettings();
  await assertConcurrencyLimit(params.runId, resolveMaxConcurrentRuns(automationSettings));
  const runArtifactDir = resolveRunArtifactDir(params.runId, params.invalidRunIdMessage);

  const resumeDetails = await loadResumeOrFail(
    params.runId,
    normalized.resumeId,
    automationSettings,
    runArtifactDir,
  );
  const coverLetter = await loadCoverLetterOrFail(
    params.runId,
    normalized.coverLetterId,
    automationSettings,
  );
  const autofillAnalysis = await resolveAutofillAnalysis({
    automationSettings,
    jobUrl: normalized.jobUrl,
    resume: resumeDetails.resume,
    coverLetter,
    existingAnswers: normalized.customAnswers,
  });
  const generatedFieldAnswers = normalizeGeneratedFieldAnswers(autofillAnalysis.fieldAnswers);

  return {
    runId: params.runId,
    automationSettings,
    normalized: {
      ...normalized,
      customAnswers: {
        ...generatedFieldAnswers,
        ...normalized.customAnswers,
      },
    },
    resume: resumeDetails.resume,
    coverLetter,
    selectorMap: autofillAnalysis.selectorMap,
    resumeFilePath: resumeDetails.resumeFilePath,
    progressHandler: params.progressHandler,
    runArtifactDir,
  };
};
