import { join } from "node:path";
import type { ResumeData, RpaRunEvent } from "@bao/shared";
import { settle } from "@bao/shared";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "../../db/client";
import { automationRuns } from "../../db/schema/automation-runs";
import { coverLetters, resumes } from "../../db/schema/schema-modules";
import { createServerLogger } from "../../utils/logger";
import { exportService } from "../export-service";
import { resumeService } from "../resume-service";
import {
  type SmartFieldAnalysisContext,
  type SmartFieldAnalysisResult,
  smartFieldMapper,
} from "./smart-field-mapper";
import {
  AutomationConcurrencyLimitError,
  AutomationDependencyMissingError,
  AutomationRunNotFoundError,
  AutomationValidationError,
} from "./automation-errors";
import { assertRunExists, markRunFailed, resolveRunArtifactDir } from "./automation-run-persistence";
import type { JobApplyExecutionPayload, JobApplyPayload } from "./automation-run-inputs";
import { loadAutomationSettings, resolveMaxConcurrentRuns, tryLoadAIService } from "./automation-settings-support";
import type {
  AutofillAnalysisOptions,
  JobApplyRunPreparation,
} from "./automation-service-contracts";
import { sanitizeAndValidateJobUrl, sanitizeCustomAnswers } from "./automation-validation";

const automationPreparationLogger = createServerLogger("automation-job-apply-preparation");
const MIN_RESUME_ID_LENGTH = 1;
const SMART_FIELD_CORE_KEYS = [
  "fullName",
  "email",
  "phone",
  "resume",
  "coverLetter",
  "submit",
] as const;

const normalizeGeneratedFieldAnswers = (
  fieldAnswers: Record<string, string>,
): Record<string, string> => {
  const reservedFieldKeys = new Set<string>(SMART_FIELD_CORE_KEYS);
  const normalizedAnswers: Record<string, string> = {};

  for (const [key, value] of Object.entries(fieldAnswers)) {
    const normalizedKey = key.trim();
    const normalizedValue = value.trim();
    if (
      normalizedKey.length === 0 ||
      normalizedValue.length === 0 ||
      reservedFieldKeys.has(normalizedKey)
    ) {
      continue;
    }

    normalizedAnswers[normalizedKey] = normalizedValue;
  }

  return normalizedAnswers;
};

const createEmptyAutofillAnalysis = (): SmartFieldAnalysisResult => ({
  selectorMap: {},
  fieldAnswers: {},
});

const buildSmartFieldAnalysisContext = (
  options: Pick<AutofillAnalysisOptions, "resume" | "coverLetter" | "existingAnswers">,
): SmartFieldAnalysisContext => ({
  resume: Object.fromEntries(Object.entries(options.resume)),
  coverLetter: options.coverLetter ? { content: options.coverLetter.content || {} } : null,
  existingAnswers: options.existingAnswers,
});

const collectResumeHeaderLines = (resume: ResumeData): string[] => {
  const lines: string[] = [];
  const personalInfo = resume.personalInfo;

  if (resume.name) {
    lines.push(resume.name);
  }
  if (personalInfo?.name && personalInfo.name !== resume.name) {
    lines.push(personalInfo.name);
  }

  const contactLines = [
    personalInfo?.email,
    personalInfo?.phone,
    personalInfo?.location,
    personalInfo?.website,
    personalInfo?.linkedIn,
    personalInfo?.github,
    personalInfo?.portfolio,
  ].filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  if (contactLines.length > 0) {
    lines.push(contactLines.join(" | "));
  }

  return lines;
};

const appendSection = (lines: string[], title: string, entries: string[]): void => {
  if (entries.length === 0) {
    return;
  }

  lines.push("", title, ...entries);
};

const collectResumeExperienceLines = (resume: ResumeData): string[] => {
  const lines: string[] = [];

  for (const experience of resume.experience ?? []) {
    const headerParts = [experience.title, experience.company].filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    );
    if (headerParts.length > 0) {
      lines.push(headerParts.join(" - "));
    }
    if (experience.description?.trim()) {
      lines.push(experience.description.trim());
    }
    for (const achievement of experience.achievements ?? []) {
      if (achievement.trim().length > 0) {
        lines.push(`- ${achievement.trim()}`);
      }
    }
  }

  return lines;
};

const collectResumeEducationLines = (resume: ResumeData): string[] => {
  const lines: string[] = [];

  for (const education of resume.education ?? []) {
    const headerParts = [education.degree, education.field, education.school].filter(
      (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
    );
    if (headerParts.length > 0) {
      lines.push(headerParts.join(" - "));
    }
  }

  return lines;
};

const collectResumeSkillSections = (
  resume: ResumeData,
): Array<{ title: string; lines: string[] }> => {
  const skillSections = [
    ["Technical Skills", resume.skills?.technical],
    ["Soft Skills", resume.skills?.soft],
    ["Gaming Skills", resume.skills?.gaming],
  ] as const;

  return skillSections.reduce<Array<{ title: string; lines: string[] }>>(
    (sections, [title, values]) => {
      if (Array.isArray(values) && values.length > 0) {
        sections.push({ title, lines: [values.join(", ")] });
      }
      return sections;
    },
    [],
  );
};

const serializeResumeUploadFallback = (resume: ResumeData): string => {
  const lines = collectResumeHeaderLines(resume);
  appendSection(lines, "Summary", resume.summary?.trim() ? [resume.summary.trim()] : []);
  appendSection(lines, "Experience", collectResumeExperienceLines(resume));
  appendSection(lines, "Education", collectResumeEducationLines(resume));
  for (const section of collectResumeSkillSections(resume)) {
    appendSection(lines, section.title, section.lines);
  }
  return lines.join("\n").trim();
};

const createResumeUploadArtifact = async (
  runArtifactDir: string,
  resume: ResumeData,
): Promise<string | undefined> => {
  const pdfResult = await settle(exportService.exportResumePDF(resume, resume.template));
  if (pdfResult.status === "fulfilled") {
    const pdfPath = join(runArtifactDir, "resume.pdf");
    const writePdfResult = await settle(Bun.write(pdfPath, pdfResult.value));
    if (writePdfResult.status === "fulfilled") {
      return pdfPath;
    }
  }

  const fallbackResumePath = join(runArtifactDir, "resume.txt");
  const fallbackResume = serializeResumeUploadFallback(resume);
  const writeFallbackResult = await settle(Bun.write(fallbackResumePath, fallbackResume));
  if (writeFallbackResult.status === "fulfilled") {
    return fallbackResumePath;
  }
};

const resolveAutofillAnalysis = async (
  options: AutofillAnalysisOptions,
): Promise<SmartFieldAnalysisResult> => {
  if (!options.automationSettings.enableSmartSelectors) {
    automationPreparationLogger.debug("Smart field mapping skipped: enableSmartSelectors is off");
    return createEmptyAutofillAnalysis();
  }

  const aiService = await tryLoadAIService();
  if (!aiService) {
    automationPreparationLogger.debug("Smart field mapping skipped: AI service unavailable");
    return createEmptyAutofillAnalysis();
  }

  const result = await smartFieldMapper.analyze(
    options.jobUrl,
    [...SMART_FIELD_CORE_KEYS],
    buildSmartFieldAnalysisContext(options),
    aiService,
  );
  const isEmpty =
    Object.keys(result.selectorMap).length === 0 && Object.keys(result.fieldAnswers).length === 0;
  if (isEmpty) {
    automationPreparationLogger.debug("Smart field mapping returned empty result", {
      jobUrl: options.jobUrl,
    });
  }
  return result;
};

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
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, payload.resumeId)).limit(1);
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
  await assertRunExists(params.runId, (missingRunId) => new AutomationRunNotFoundError(missingRunId));

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
