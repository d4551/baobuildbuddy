import type { CoverLetterData, ResumeData } from "@bao/shared";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { coverLetters, resumes } from "../../db/schema";
import { automationRuns } from "../../db/schema/automation-runs";
import { runRpaScript } from "./rpa-runner";

interface JobApplyPayload {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers?: Record<string, string>;
}

/**
 * Loads user-provided inputs and executes the RPA job application script for a run row.
 */
export class ApplicationAutomationService {
  /**
   * Runs the full job-application automation flow for an existing automation run.
   */
  async runJobApply(runId: string, payload: JobApplyPayload): Promise<void> {
    const resumeRows = await db
      .select()
      .from(resumes)
      .where(eq(resumes.id, payload.resumeId))
      .limit(1);

    if (resumeRows.length === 0) {
      throw new Error(`Resume not found: ${payload.resumeId}`);
    }

    const resume = resumeRows[0] as ResumeData & { id: string };
    let coverLetter: CoverLetterData | null = null;

    if (payload.coverLetterId) {
      const coverLetterRows = await db
        .select()
        .from(coverLetters)
        .where(eq(coverLetters.id, payload.coverLetterId))
        .limit(1);

      if (coverLetterRows.length === 0) {
        throw new Error(`Cover letter not found: ${payload.coverLetterId}`);
      }

      const row = coverLetterRows[0];
      coverLetter = {
        id: row.id,
        company: row.company,
        position: row.position,
        jobInfo: row.jobInfo,
        content: row.content,
        template: row.template || "professional",
      };
    }

    const result = await runRpaScript("apply_job_rpa.py", {
      jobUrl: payload.jobUrl,
      resume,
      coverLetter: coverLetter ? { ...coverLetter, content: coverLetter.content || {} } : null,
      customAnswers: payload.customAnswers || {},
    });

    const now = new Date().toISOString();
    const status = result.success ? "success" : "error";
    await db.update(automationRuns).set({
      status,
      output: result,
      screenshots: result.screenshots,
      error: result.error,
      updatedAt: now,
      jobId: payload.jobId || null,
    }).where(eq(automationRuns.id, runId));

    if (!result.success) {
      throw new Error(result.error || "Job application automation failed");
    }
  }
}

export const applicationAutomationService = new ApplicationAutomationService();
