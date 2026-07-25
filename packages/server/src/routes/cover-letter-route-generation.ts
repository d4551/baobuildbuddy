import {
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  AI_MAX_TOKENS_COVER_LETTER,
} from "@bao/shared/constants/ai-generation";
import {
  API_ERROR_AI_SETTINGS_NOT_CONFIGURED,
  API_ERROR_COVER_LETTER_GENERATION_FAILED,
  API_ERROR_COVER_LETTER_INCOMPLETE_CONTENT,
  API_ERROR_COVER_LETTER_NOT_FOUND,
  API_ERROR_EXPORT_COVER_LETTER,
  API_ERROR_UNKNOWN,
} from "@bao/shared/constants/api-errors";
import {
  API_MESSAGE_COVER_LETTER_GENERATED_ONLY,
  API_MESSAGE_COVER_LETTER_GENERATED_SAVED,
} from "@bao/shared/constants/api-messages";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
} from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID, DEFAULT_SETTINGS_ID } from "@bao/shared/types/settings-defaults";
import { settle } from "@bao/shared/utils/promise";
import { generateId } from "@bao/shared/utils/validation";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { coverLetterPrompt } from "../services/ai/prompts-resume";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import type { RouteSetState } from "../types/route-state";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";
import { createServerLogger } from "../utils/logger";
import type { GenerateCoverLetterBody } from "./cover-letter-route-contracts";
import {
  type GeneratedCoverLetterContent,
  resolveResumeContext,
  toGeneratedCoverLetterContent,
  validateGeneratedCoverLetterContent,
} from "./cover-letter-route-generation-support";
import { getCoverLetterById, normalizeTemplate } from "./cover-letter-route-support";

const coverLetterGenerationLogger = createServerLogger("cover-letter-generation");

type CoverLetterSender = {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
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

const createCoverLetterExportError = (reason: unknown) => {
  coverLetterGenerationLogger.error("Cover letter export failed", {
    reason: reason instanceof Error ? reason.message : API_ERROR_UNKNOWN,
  });
  return {
    error: API_ERROR_EXPORT_COVER_LETTER,
  };
};

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
    aiService.generate(
      coverLetterPrompt(body.company, body.position, jobInfoText, resumeContext.promptContext),
      {
        purpose: "coverLetter",
        temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
        maxTokens: AI_MAX_TOKENS_COVER_LETTER,
      },
    ),
  );
  if (aiResult.status === "rejected") {
    coverLetterGenerationLogger.error("Cover letter AI generation rejected", {
      reason: aiResult.reason instanceof Error ? aiResult.reason.message : API_ERROR_UNKNOWN,
    });
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: API_ERROR_COVER_LETTER_GENERATION_FAILED,
    };
  }

  const response = aiResult.value;
  if (response.error) {
    coverLetterGenerationLogger.error("Cover letter AI generation returned provider error", {
      reason: response.error,
    });
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: API_ERROR_COVER_LETTER_GENERATION_FAILED };
  }

  const contentResult = validateGeneratedCoverLetterContent(
    toGeneratedCoverLetterContent(response.content),
  );
  if (!contentResult.success) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: API_ERROR_COVER_LETTER_INCOMPLETE_CONTENT,
      details: contentResult.error,
    };
  }

  const content = contentResult.data;
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
    template: letter.template,
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
