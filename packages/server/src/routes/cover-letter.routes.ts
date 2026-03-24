import {
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  API_ERROR_AI_SETTINGS_NOT_CONFIGURED,
  API_ERROR_COVER_LETTER_GENERATION_FAILED,
  API_ERROR_COVER_LETTER_NOT_FOUND,
  API_ERROR_EXPORT_COVER_LETTER,
  API_ERROR_UNKNOWN,
  API_MESSAGE_COVER_LETTER_GENERATED_ONLY,
  API_MESSAGE_COVER_LETTER_GENERATED_SAVED,
  COVER_LETTER_DEFAULT_CLOSING,
  COVER_LETTER_DEFAULT_OPENING,
  COVER_LETTER_DEFAULT_TEMPLATE,
  COVER_LETTER_TEMPLATE_OPTIONS,
  type CoverLetterTemplate,
  DEFAULT_PROFILE_ID,
  DEFAULT_UNSPECIFIED_LABEL,
  generateId,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_SERVICE_UNAVAILABLE,
  isCoverLetterTemplate,
  ROUTE_GAMIFICATION_XP,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
  safeParseJson,
  settle,
} from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { resumes } from "../db/schema/resumes";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { coverLetterPrompt } from "../services/ai/prompts";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import { gamificationService } from "../services/gamification-service";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";

const coverLetterTemplateBodySchema = t.String({
  enum: COVER_LETTER_TEMPLATE_OPTIONS,
});

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

const normalizeTemplate = (value: string | undefined): CoverLetterTemplate => {
  return isCoverLetterTemplate(value) ? value : COVER_LETTER_DEFAULT_TEMPLATE;
};

const parseGeneratedCoverLetterContent = (content: string): Record<string, unknown> => {
  const parsed = safeParseJson(content);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }

  const lines = content.split("\n").filter((line: string) => line.trim());
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

type GenerateCoverLetterBody = {
  company: string;
  position: string;
  jobInfo?: Record<string, unknown>;
  resumeId?: string;
  template?: string;
  save?: boolean;
};
type RouteSetState = {
  status?: number | string;
};
type GeneratedCoverLetterContent = {
  introduction: string;
  body: string;
  conclusion: string;
};
type CoverLetterRecord = typeof coverLetters.$inferSelect;
type CoverLetterSender = {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
};
type CoverLetterExportPayload = {
  company: string;
  position: string;
  content: Record<string, unknown>;
};
type CoverLetterExportRequest = {
  id: string;
  format: string | undefined;
  payload: CoverLetterExportPayload;
  sender: CoverLetterSender;
  set: RouteSetState;
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
  const newCoverLetter = {
    id: generateId(),
    company: body.company,
    position: body.position,
    jobInfo: body.jobInfo || {},
    content,
    template: normalizeTemplate(body.template),
  };

  await db.insert(coverLetters).values(newCoverLetter);
  return newCoverLetter;
};

const getCoverLetterById = async (
  id: string,
  set: RouteSetState,
): Promise<CoverLetterRecord | null> => {
  const rows = await db.select().from(coverLetters).where(eq(coverLetters.id, id));
  const letter = rows[0] ?? null;
  if (!letter) {
    set.status = HTTP_STATUS_NOT_FOUND;
  }
  return letter;
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

const toCoverLetterExportPayload = (letter: CoverLetterRecord): CoverLetterExportPayload => ({
  company: letter.company,
  position: letter.position,
  content: toJsonRecord(letter.content),
});

const createCoverLetterExportError = (reason: unknown) => ({
  error: API_ERROR_EXPORT_COVER_LETTER,
  details: reason instanceof Error ? reason.message : API_ERROR_UNKNOWN,
});

const exportCoverLetterAttachment = async (
  request: CoverLetterExportRequest,
) => {
  if (request.format === "docx") {
    const docxResult = await settle(
      docxExportService.exportCoverLetterDocx(request.payload, request.sender),
    );
    if (docxResult.status === "rejected") {
      request.set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return createCoverLetterExportError(docxResult.reason);
    }
    return createDocxAttachmentResponse(docxResult.value, `cover-letter-${request.id}.docx`);
  }

  const exportResult = await settle(
    exportService.exportCoverLetterPDF(request.payload, request.sender),
  );
  if (exportResult.status === "rejected") {
    request.set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return createCoverLetterExportError(exportResult.reason);
  }

  return createPdfAttachmentResponse(
    Buffer.from(exportResult.value),
    `cover-letter-${request.id}.pdf`,
  );
};

const handleGenerateCoverLetter = async (body: GenerateCoverLetterBody, set: RouteSetState) => {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  if (settingsRows.length === 0) {
    set.status = HTTP_STATUS_SERVICE_UNAVAILABLE;
    return {
      error: API_ERROR_AI_SETTINGS_NOT_CONFIGURED,
    };
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

export const coverLetterRoutes = new Elysia({ prefix: "/cover-letters", tags: ["Cover Letters"] })
  .get("/", async () => {
    const all = await db.select().from(coverLetters).orderBy(desc(coverLetters.createdAt));
    return all;
  })
  .post(
    "/",
    async ({ body, set }) => {
      const newCoverLetter = {
        id: generateId(),
        company: body.company,
        position: body.position,
        jobInfo: body.jobInfo || {},
        content: body.content || {},
        template: normalizeTemplate(body.template),
      };

      await db.insert(coverLetters).values(newCoverLetter);
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "coverLettersGenerated",
        ROUTE_GAMIFICATION_XP.coverLettersGenerated,
        "cover_letter_created",
      );
      return newCoverLetter;
    },
    {
      body: t.Object({
        company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
        content: t.Optional(t.Record(t.String(), t.Unknown())),
        template: t.Optional(coverLetterTemplateBodySchema),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await db.select().from(coverLetters).where(eq(coverLetters.id, params.id));
      if (rows.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_COVER_LETTER_NOT_FOUND };
      }
      return rows[0];
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const existing = await db.select().from(coverLetters).where(eq(coverLetters.id, params.id));
      if (existing.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_COVER_LETTER_NOT_FOUND };
      }

      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };

      if (body.company !== undefined) updates.company = body.company;
      if (body.position !== undefined) updates.position = body.position;
      if (body.jobInfo !== undefined) updates.jobInfo = body.jobInfo;
      if (body.content !== undefined) updates.content = body.content;
      if (body.template !== undefined) updates.template = normalizeTemplate(body.template);

      await db.update(coverLetters).set(updates).where(eq(coverLetters.id, params.id));

      const updated = await db.select().from(coverLetters).where(eq(coverLetters.id, params.id));
      return updated[0];
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        company: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        position: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
        content: t.Optional(t.Record(t.String(), t.Unknown())),
        template: t.Optional(coverLetterTemplateBodySchema),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await db.select().from(coverLetters).where(eq(coverLetters.id, params.id));
      if (existing.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_COVER_LETTER_NOT_FOUND };
      }

      await db.delete(coverLetters).where(eq(coverLetters.id, params.id));
      return { success: true, id: params.id };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
    },
  )
  .post("/generate", async ({ body, set }) => handleGenerateCoverLetter(body, set), {
    body: t.Object({
      company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
      position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
      jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
      resumeId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
      template: t.Optional(coverLetterTemplateBodySchema),
      save: t.Optional(t.Boolean()),
    }),
  })
  .post(
    "/:id/export",
    async ({ params, body, set }) => {
      const letter = await getCoverLetterById(params.id, set);
      if (!letter) {
        return { error: API_ERROR_COVER_LETTER_NOT_FOUND };
      }

      const sender = await buildCoverLetterSender();
      return exportCoverLetterAttachment({
        id: params.id,
        format: body.format,
        payload: toCoverLetterExportPayload(letter),
        sender,
        set,
      });
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        format: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
      }),
    },
  );
