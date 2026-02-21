import {
  COVER_LETTER_DEFAULT_TEMPLATE,
  COVER_LETTER_TEMPLATE_OPTIONS,
  generateId,
  isCoverLetterTemplate,
  type CoverLetterTemplate,
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
    async ({ body, set }) => {
      const settingsRows = await db
        .select()
        .from(settings)
        .where(eq(settings.id, DEFAULT_SETTINGS_ID));

      if (settingsRows.length === 0) {
        set.status = 503;
        return {
          error: "AI settings not configured. Please complete setup in Settings.",
        };
      }

      const aiService = AIService.fromSettings(settingsRows[0]);

      let resumeContext = "";
      if (body.resumeId) {
        const resumeRows = await db.select().from(resumes).where(eq(resumes.id, body.resumeId));
        if (resumeRows.length > 0) {
          const resume = resumeRows[0];
          const personalInfo = resume.personalInfo || {};
          const resumeName =
            typeof personalInfo.name === "string" && personalInfo.name.trim()
              ? personalInfo.name
              : "Not specified";
          resumeContext = `
Resume Context:
Name: ${resumeName}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience, null, 2)}
Skills: ${JSON.stringify(resume.skills, null, 2)}
        `.trim();
        }
      }

      const jobInfoText = body.jobInfo
        ? JSON.stringify(body.jobInfo, null, 2)
        : "No additional job information provided";

      const prompt = coverLetterPrompt(body.company, body.position, jobInfoText, resumeContext);
      return aiService
        .generate(prompt, { temperature: 0.7, maxTokens: 2000 })
        .then(async (response) => {
          if (response.error) {
            set.status = 500;
            return { error: "Cover letter generation failed", details: response.error };
          }

          const generatedContent = parseGeneratedCoverLetterContent(response.content);
          const content = {
            introduction: String(generatedContent.introduction || generatedContent.intro || ""),
            body: String(generatedContent.body || generatedContent.main || ""),
            conclusion: String(generatedContent.conclusion || generatedContent.closing || ""),
          };

          if (body.save) {
            const newCoverLetter = {
              id: generateId(),
              company: body.company,
              position: body.position,
              jobInfo: body.jobInfo || {},
              content: content,
              template: normalizeTemplate(body.template),
            };

            await db.insert(coverLetters).values(newCoverLetter);
            set.status = 201;
            return {
              message: "Cover letter generated and saved",
              coverLetter: newCoverLetter,
            };
          }

          return {
            message: "Cover letter generated",
            content: content,
          };
        })
        .catch((error: unknown) => {
          set.status = 500;
          return {
            error: "Cover letter generation failed",
            details: error instanceof Error ? error.message : "Unknown error",
          };
        });
    },
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

      return exportService
        .exportCoverLetterPDF(
          {
            company: letter.company,
            position: letter.position,
            content: toJsonRecord(letter.content),
          },
          sender,
        )
        .then((pdfBytes) => {
          return new Response(Buffer.from(pdfBytes), {
            headers: {
              "content-type": "application/pdf",
              "content-disposition": `attachment; filename="cover-letter-${params.id}.pdf"`,
            },
          });
        })
        .catch((error: unknown) => {
          set.status = 500;
          return {
            error: "Failed to export cover letter",
            details: error instanceof Error ? error.message : "Unknown error",
          };
        });
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  );
