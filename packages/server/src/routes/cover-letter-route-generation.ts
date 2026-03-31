import { AI_DEFAULT_TEMPERATURE_CREATIVE } from "@bao/shared/constants/ai-generation";
import { API_ERROR_AI_SETTINGS_NOT_CONFIGURED, API_ERROR_COVER_LETTER_GENERATION_FAILED, API_ERROR_COVER_LETTER_NOT_FOUND, API_ERROR_EXPORT_COVER_LETTER, API_ERROR_UNKNOWN } from "@bao/shared/constants/api-errors";
import { API_MESSAGE_COVER_LETTER_GENERATED_ONLY, API_MESSAGE_COVER_LETTER_GENERATED_SAVED } from "@bao/shared/constants/api-messages";
import { COVER_LETTER_DEFAULT_CLOSING, COVER_LETTER_DEFAULT_OPENING } from "@bao/shared/constants/cover-letter";
import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import { HTTP_STATUS_CREATED, HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_SERVICE_UNAVAILABLE } from "@bao/shared/constants/http";
import { SCHEMA_MAX_LENGTH_LONG } from "@bao/shared/constants/schema-limits";
import { DEFAULT_PROFILE_ID, DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { generateId } from "@bao/shared/utils/validation";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { resumes } from "../db/schema/resumes";
import { settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { coverLetterPrompt } from "../services/ai/prompts-resume";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";
import type { GenerateCoverLetterBody, RouteSetState } from "./cover-letter-route-contracts";
import { getCoverLetterById, normalizeTemplate } from "./cover-letter-route-support";

type GeneratedCoverLetterContent = {
  introduction: string;
  body: string;
  conclusion: string;
};

type CoverLetterSender = {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
};

const parseGeneratedCoverLetterContent = (content: string): Record<string, unknown> => {
  const parsed = safeParseJson(content);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }

  const lines = content.split("\n").filter((line) => line.trim());
  return {
    introduction: lines[0] || COVER_LETTER_DEFAULT_OPENING,
    body: lines.slice(1, -1).join("\n\n") || content,
    conclusion: lines[lines.length - 1] || COVER_LETTER_DEFAULT_CLOSING,
  };
};

const readCoverLetterSegment = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string").join("\n\n");
  }
  return "";
};

const resolveResumeContext = async (resumeId?: string): Promise<string> => {
  if (!resumeId) return "";
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));
  if (resumeRows.length === 0) return "";

  const resume = resumeRows[0];
  const personalInfo = resume.personalInfo || {};
  const resumeName =
    typeof personalInfo.name === "string" && personalInfo.name.trim()
      ? personalInfo.name
      : DEFAULT_UNSPECIFIED_LABEL;
  return `
Resume Context:
Name: ${resumeName}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience, null, 2)}
Skills: ${JSON.stringify(resume.skills, null, 2)}
  `.trim();
};

const toGeneratedCoverLetterContent = (content: string): GeneratedCoverLetterContent => {
  const generatedContent = parseGeneratedCoverLetterContent(content);
  return {
    introduction:
      readCoverLetterSegment(generatedContent.introduction) ||
      readCoverLetterSegment(generatedContent.intro),
    body:
      readCoverLetterSegment(generatedContent.body) ||
      readCoverLetterSegment(generatedContent.main),
    conclusion:
      readCoverLetterSegment(generatedContent.conclusion) ||
      readCoverLetterSegment(generatedContent.closing),
  };
};

const saveGeneratedCoverLetter = async (
  body: GenerateCoverLetterBody,
  content: GeneratedCoverLetterContent,
) => {
  const coverLetter = {
    id: generateId(),
    company: body.company,
    position: body.position,
    jobInfo: body.jobInfo || {},
    content,
    template: normalizeTemplate(body.template),
  };
  await db.insert(coverLetters).values(coverLetter);
  return coverLetter;
};

const buildCoverLetterSender = async (): Promise<CoverLetterSender> => {
  const profileRows = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
  const profile = profileRows[0];

  return {
    name: profile?.name || "",
    ...(profile?.email ? { email: profile.email } : {}),
    ...(profile?.phone ? { phone: profile.phone } : {}),
    ...(profile?.location ? { location: profile.location } : {}),
  };
};

const toJsonRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const record: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    record[key] = entry;
  }
  return record;
};

const createCoverLetterExportError = (reason: unknown) => ({
  error: API_ERROR_EXPORT_COVER_LETTER,
  details: reason instanceof Error ? reason.message : API_ERROR_UNKNOWN,
});

export const handleGenerateCoverLetter = async (
  body: GenerateCoverLetterBody,
  set: RouteSetState,
) => {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  if (settingsRows.length === 0) {
    set.status = HTTP_STATUS_SERVICE_UNAVAILABLE;
    return { error: API_ERROR_AI_SETTINGS_NOT_CONFIGURED };
  }

  const aiService = AIService.fromSettings(settingsRows[0]);
  const resumeContext = await resolveResumeContext(body.resumeId);
  const jobInfoText = body.jobInfo
    ? JSON.stringify(body.jobInfo, null, 2)
    : "No additional job information provided";
  const aiResult = await settle(
    aiService.generate(coverLetterPrompt(body.company, body.position, jobInfoText, resumeContext), {
      purpose: "coverLetter",
      temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
      maxTokens: SCHEMA_MAX_LENGTH_LONG,
    }),
  );
  if (aiResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: API_ERROR_COVER_LETTER_GENERATION_FAILED,
      details: aiResult.reason instanceof Error ? aiResult.reason.message : API_ERROR_UNKNOWN,
    };
  }

  const response = aiResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: API_ERROR_COVER_LETTER_GENERATION_FAILED, details: response.error };
  }

  const content = toGeneratedCoverLetterContent(response.content);
  if (!body.save) {
    return {
      message: API_MESSAGE_COVER_LETTER_GENERATED_ONLY,
      content,
    };
  }

  const coverLetter = await saveGeneratedCoverLetter(body, content);
  set.status = HTTP_STATUS_CREATED;
  return {
    message: API_MESSAGE_COVER_LETTER_GENERATED_SAVED,
    coverLetter,
  };
};

export const exportCoverLetterAttachment = async (
  id: string,
  format: string | undefined,
  set: RouteSetState,
) => {
  const letter = await getCoverLetterById(id, set);
  if (!letter) {
    return { error: API_ERROR_COVER_LETTER_NOT_FOUND };
  }

  const payload = {
    company: letter.company,
    position: letter.position,
    content: toJsonRecord(letter.content),
  };
  const sender = await buildCoverLetterSender();

  if (format === "docx") {
    const docxResult = await settle(docxExportService.exportCoverLetterDocx(payload, sender));
    if (docxResult.status === "rejected") {
      set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return createCoverLetterExportError(docxResult.reason);
    }
    return createDocxAttachmentResponse(docxResult.value, `cover-letter-${id}.docx`);
  }

  const exportResult = await settle(exportService.exportCoverLetterPDF(payload, sender));
  if (exportResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return createCoverLetterExportError(exportResult.reason);
  }

  return createPdfAttachmentResponse(Buffer.from(exportResult.value), `cover-letter-${id}.pdf`);
};
