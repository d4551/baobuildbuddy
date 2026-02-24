import {
  COVER_LETTER_DEFAULT_TEMPLATE,
  COVER_LETTER_TEMPLATE_OPTIONS,
  type CoverLetterTemplate,
  generateId,
  isCoverLetterTemplate,
  safeParseJson,
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
import { exportService } from "../services/export-service";
import { createPdfAttachmentResponse } from "../utils/http-response";

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
    introduction: lines[0] || "Dear Hiring Manager,",
    body: lines.slice(1, -1).join("\n\n") || content,
    conclusion: lines[lines.length - 1] || "Thank you for your consideration.",
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

const settle = async <T>(operation: Promise<T>): Promise<PromiseSettledResult<T>> => {
  const [result] = await Promise.allSettled([operation]);
  return result;
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

const COVER_LETTER_GENERATION_ERROR = "Cover letter generation failed";
const COVER_LETTER_UNKNOWN_ERROR = "Unknown error";

const resolveResumeContext = async (resumeId?: string): Promise<string> => {
  if (!resumeId) return "";
  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));
  if (resumeRows.length === 0) return "";

  const resume = resumeRows[0];
  const personalInfo = resume.personalInfo || {};
  const resumeName =
    typeof personalInfo.name === "string" && personalInfo.name.trim()
      ? personalInfo.name
      : "Not specified";
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
    body: readCoverLetterSegment(generatedContent.body) || readCoverLetterSegment(generatedContent.main),
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

const handleGenerateCoverLetter = async (body: GenerateCoverLetterBody, set: RouteSetState) => {
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  if (settingsRows.length === 0) {
    set.status = 503;
    return {
      error: "AI settings not configured. Please complete setup in Settings.",
    };
  }

  const aiService = AIService.fromSettings(settingsRows[0]);
  const resumeContext = await resolveResumeContext(body.resumeId);
  const jobInfoText = body.jobInfo
    ? JSON.stringify(body.jobInfo, null, 2)
    : "No additional job information provided";
  const aiResult = await settle(
    aiService.generate(coverLetterPrompt(body.company, body.position, jobInfoText, resumeContext), {
      temperature: 0.7,
      maxTokens: 2000,
    }),
  );
  if (aiResult.status === "rejected") {
    set.status = 500;
    return {
      error: COVER_LETTER_GENERATION_ERROR,
      details: aiResult.reason instanceof Error ? aiResult.reason.message : COVER_LETTER_UNKNOWN_ERROR,
    };
  }

  const response = aiResult.value;
  if (response.error) {
    set.status = 500;
    return { error: COVER_LETTER_GENERATION_ERROR, details: response.error };
  }

  const content = toGeneratedCoverLetterContent(response.content);
  if (!body.save) {
    return {
      message: "Cover letter generated",
      content,
    };
  }

  const coverLetter = await saveGeneratedCoverLetter(body, content);
  set.status = 201;
  return {
    message: "Cover letter generated and saved",
    coverLetter,
  };
};

export const coverLetterRoutes = new Elysia({ prefix: "/cover-letters" })
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
      set.status = 201;
      return newCoverLetter;
    },
    {
      body: t.Object({
        company: t.String({ maxLength: 200 }),
        position: t.String({ maxLength: 200 }),
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
        set.status = 404;
        return { error: "Cover letter not found" };
      }
      return rows[0];
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      const existing = await db.select().from(coverLetters).where(eq(coverLetters.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Cover letter not found" };
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
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        company: t.Optional(t.String({ maxLength: 200 })),
        position: t.Optional(t.String({ maxLength: 200 })),
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
        set.status = 404;
        return { error: "Cover letter not found" };
      }

      await db.delete(coverLetters).where(eq(coverLetters.id, params.id));
      return { success: true, id: params.id };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  )
  .post(
    "/generate",
    async ({ body, set }) => handleGenerateCoverLetter(body, set),
    {
      body: t.Object({
        company: t.String({ maxLength: 200 }),
        position: t.String({ maxLength: 200 }),
        jobInfo: t.Optional(t.Record(t.String(), t.Unknown())),
        resumeId: t.Optional(t.String({ maxLength: 100 })),
        template: t.Optional(coverLetterTemplateBodySchema),
        save: t.Optional(t.Boolean()),
      }),
    },
  )
  .post(
    "/:id/export",
    async ({ params, set }) => {
      const rows = await db.select().from(coverLetters).where(eq(coverLetters.id, params.id));
      if (rows.length === 0) {
        set.status = 404;
        return { error: "Cover letter not found" };
      }

      const letter = rows[0];

      // Load user profile for sender info
      const profileRows = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
      const profile = profileRows[0];
      const sender: {
        name: string;
        email?: string;
        phone?: string;
        location?: string;
      } = {
        name: profile?.name || "",
      };
      if (profile?.email) {
        sender.email = profile.email;
      }
      if (profile?.phone) {
        sender.phone = profile.phone;
      }
      if (profile?.location) {
        sender.location = profile.location;
      }

      const exportResult = await settle(
        exportService.exportCoverLetterPDF(
          {
            company: letter.company,
            position: letter.position,
            content: toJsonRecord(letter.content),
          },
          sender,
        ),
      );
      if (exportResult.status === "rejected") {
        set.status = 500;
        return {
          error: "Failed to export cover letter",
          details: exportResult.reason instanceof Error ? exportResult.reason.message : "Unknown error",
        };
      }

      return createPdfAttachmentResponse(
        Buffer.from(exportResult.value),
        `cover-letter-${params.id}.pdf`,
      );
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  );
