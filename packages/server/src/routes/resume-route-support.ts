import {
  AI_DEFAULT_TEMPERATURE,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  AI_MAX_TOKENS_RESUME,
  AI_MAX_TOKENS_SCORE,
} from "@bao/shared/constants/ai-generation";
import {
  API_ERROR_AI_ENHANCEMENT_FAILED,
  API_ERROR_AI_SCORING_FAILED,
  API_ERROR_EXPORT_RESUME,
  API_ERROR_JOB_NOT_FOUND,
  API_ERROR_RESUME_NOT_FOUND,
  API_ERROR_UNKNOWN,
} from "@bao/shared/constants/api-errors";
import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import {
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@bao/shared/constants/http";
import { DEFAULT_SCORE_NEUTRAL } from "@bao/shared/constants/jobs";
import {
  isResumeTemplate,
  RESUME_DEFAULT_NAME,
  RESUME_DEFAULT_THEME,
  RESUME_TEMPLATE_DEFAULT,
} from "@bao/shared/constants/resume";
import type { ResumeData } from "@bao/shared/types/resume";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { AIService } from "../services/ai/ai-service";
import { resumeEnhancePrompt, resumeScorePrompt } from "../services/ai/prompts-resume";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import { resumeService } from "../services/resume-service";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";
import { createServerLogger } from "../utils/logger";

const resumeRouteLogger = createServerLogger("resume-route");

import type {
  ResumeEnhanceBody,
  ResumeExportBody,
  ResumeMutationBody,
  ResumeRouteSetState,
  ResumeScoreBody,
} from "./resume-route-contracts";

type ResumeScoreDetails = {
  analysis: Record<string, unknown>;
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
};

const toResumeTemplateOrDefault = (value: string | undefined): ResumeData["template"] =>
  isResumeTemplate(value) ? value : RESUME_TEMPLATE_DEFAULT;

const toResumeTemplateOrUndefined = (
  value: string | undefined,
): ResumeData["template"] | undefined => (isResumeTemplate(value) ? value : undefined);

const formatJobRequirements = (value: unknown): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (Array.isArray(value)) {
    const normalized = value.filter((entry): entry is string => typeof entry === "string");
    if (normalized.length > 0) {
      return normalized.join(", ");
    }
  }
  return DEFAULT_UNSPECIFIED_LABEL;
};

const serializeResumeForAi = (resume: ResumeData): string =>
  `
Resume: ${resume.name}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience, null, 2)}
Education: ${JSON.stringify(resume.education, null, 2)}
Skills: ${JSON.stringify(resume.skills, null, 2)}
Projects: ${JSON.stringify(resume.projects, null, 2)}
${resume.gamingExperience ? `Gaming Experience: ${JSON.stringify(resume.gamingExperience, null, 2)}` : ""}
`.trim();

const serializeJobForAi = (job: typeof jobs.$inferSelect): string =>
  `
Job: ${job.title} at ${job.company}
Description: ${job.description}
Requirements: ${formatJobRequirements(job.requirements)}
Location: ${job.location || DEFAULT_UNSPECIFIED_LABEL}
Type: ${job.type || DEFAULT_UNSPECIFIED_LABEL}
`.trim();

const parseResumeScoreDetails = (content: string): ResumeScoreDetails => {
  const parsedAnalysis = safeParseJson(content);
  const analysisRecord: Record<string, unknown> =
    parsedAnalysis && typeof parsedAnalysis === "object" && !Array.isArray(parsedAnalysis)
      ? parsedAnalysis
      : {
          score: DEFAULT_SCORE_NEUTRAL,
          strengths: ["Unable to parse AI response"],
          improvements: ["Please try again"],
          keywords: [],
        };
  return {
    analysis: analysisRecord,
    score: typeof analysisRecord.score === "number" ? analysisRecord.score : 0,
    strengths: Array.isArray(analysisRecord.strengths)
      ? analysisRecord.strengths.filter((entry): entry is string => typeof entry === "string")
      : [],
    improvements: Array.isArray(analysisRecord.improvements)
      ? analysisRecord.improvements.filter((entry): entry is string => typeof entry === "string")
      : [],
    keywords: Array.isArray(analysisRecord.keywords)
      ? analysisRecord.keywords.filter((entry): entry is string => typeof entry === "string")
      : [],
  };
};

export const buildResumeCreatePayload = (body: ResumeMutationBody): Omit<ResumeData, "id"> => ({
  name: body.name || RESUME_DEFAULT_NAME,
  personalInfo: body.personalInfo || {},
  summary: body.summary || "",
  experience: body.experience || [],
  education: body.education || [],
  skills: body.skills || {},
  projects: body.projects || [],
  gamingExperience: body.gamingExperience || {},
  template: toResumeTemplateOrDefault(body.template),
  theme: body.theme || RESUME_DEFAULT_THEME,
  isDefault: body.isDefault === true,
});

export const buildResumeUpdatePayload = (body: ResumeMutationBody): Partial<ResumeData> => ({
  name: body.name,
  personalInfo: body.personalInfo,
  summary: body.summary,
  experience: body.experience,
  education: body.education,
  skills: body.skills,
  projects: body.projects,
  gamingExperience: body.gamingExperience,
  template: toResumeTemplateOrUndefined(body.template),
  theme: body.theme,
  isDefault: body.isDefault,
});

export const exportResumeAsset = async (
  resumeId: string,
  body: ResumeExportBody,
  set: ResumeRouteSetState,
) => {
  const resume = await resumeService.getResume(resumeId);
  if (!resume) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_RESUME_NOT_FOUND };
  }

  const templateName = body.template || resume.template || RESUME_TEMPLATE_DEFAULT;
  if (body.format === "docx") {
    const docxResult = await settle(docxExportService.exportResumeDocx(resume, templateName));
    if (docxResult.status === "rejected") {
      set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return {
        error: API_ERROR_EXPORT_RESUME,
        details: docxResult.reason instanceof Error ? docxResult.reason.message : API_ERROR_UNKNOWN,
      };
    }
    return createDocxAttachmentResponse(docxResult.value, `resume-${resumeId}.docx`);
  }

  const exportResult = await settle(exportService.exportResumePDF(resume, templateName));
  if (exportResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: API_ERROR_EXPORT_RESUME,
      details:
        exportResult.reason instanceof Error ? exportResult.reason.message : API_ERROR_UNKNOWN,
    };
  }

  return createPdfAttachmentResponse(Buffer.from(exportResult.value), `resume-${resumeId}.pdf`);
};

export const enhanceResumeWithAi = async (
  resumeId: string,
  body: ResumeEnhanceBody,
  set: ResumeRouteSetState,
) => {
  const resume = await resumeService.getResume(resumeId);
  if (!resume) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_RESUME_NOT_FOUND };
  }

  const settingsRows = await db.select().from(settings);
  const aiService = AIService.fromSettings(settingsRows[0]);
  const section = body.section || "all";
  const aiResult = await settle(
    aiService.generate(resumeEnhancePrompt(serializeResumeForAi(resume), section), {
      purpose: "resume",
      temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: AI_MAX_TOKENS_SCORE,
    }),
  );
  if (aiResult.status === "rejected") {
    resumeRouteLogger.error("Resume AI enhancement rejected", {
      reason: aiResult.reason instanceof Error ? aiResult.reason.message : API_ERROR_UNKNOWN,
    });
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: API_ERROR_AI_ENHANCEMENT_FAILED,
    };
  }

  const response = aiResult.value;
  if (response.error) {
    resumeRouteLogger.error("Resume AI enhancement returned provider error", {
      reason: response.error,
    });
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: API_ERROR_AI_ENHANCEMENT_FAILED };
  }

  const parsed = safeParseJson(response.content);
  const parsedRecord =
    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  const suggestions =
    parsedRecord && Array.isArray(parsedRecord.suggestions)
      ? parsedRecord.suggestions
      : parsedRecord
        ? [parsedRecord]
        : [{ text: response.content, section }];

  return {
    resume,
    suggestions,
    section,
  };
};

export const handleResumeAiScore = async (
  resumeId: string,
  body: ResumeScoreBody,
  set: ResumeRouteSetState,
) => {
  const resume = await resumeService.getResume(resumeId);
  if (!resume) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_RESUME_NOT_FOUND };
  }

  const jobRows = await db.select().from(jobs).where(eq(jobs.id, body.jobId));
  if (jobRows.length === 0) {
    set.status = HTTP_STATUS_NOT_FOUND;
    return { error: API_ERROR_JOB_NOT_FOUND };
  }

  const settingsRows = await db.select().from(settings);
  const aiService = AIService.fromSettings(settingsRows[0]);
  const aiResult = await settle(
    aiService.generate(
      resumeScorePrompt(serializeResumeForAi(resume), serializeJobForAi(jobRows[0])),
      {
        purpose: "resume",
        temperature: AI_DEFAULT_TEMPERATURE,
        maxTokens: AI_MAX_TOKENS_RESUME,
      },
    ),
  );
  if (aiResult.status === "rejected") {
    resumeRouteLogger.error("Resume AI scoring rejected", {
      reason: aiResult.reason instanceof Error ? aiResult.reason.message : API_ERROR_UNKNOWN,
    });
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: API_ERROR_AI_SCORING_FAILED,
    };
  }

  const response = aiResult.value;
  if (response.error) {
    resumeRouteLogger.error("Resume AI scoring returned provider error", {
      reason: response.error,
    });
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: API_ERROR_AI_SCORING_FAILED };
  }

  const details = parseResumeScoreDetails(response.content);
  return {
    resumeId,
    jobId: body.jobId,
    score: details.score,
    strengths: details.strengths,
    improvements: details.improvements,
    keywords: details.keywords,
    analysis: details.analysis,
  };
};
