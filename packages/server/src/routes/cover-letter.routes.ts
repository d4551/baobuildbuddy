import { generateId } from "@bao/shared";
import { desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { coverLetters } from "../db/schema/cover-letters";
import { resumes } from "../db/schema/resumes";
import { settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { coverLetterPrompt } from "../services/ai/prompts";
import { exportService } from "../services/export-service";

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
        template: body.template || "professional",
      };

      await db.insert(coverLetters).values(newCoverLetter);
      set.status = 201;
      return newCoverLetter;
    },
    {
      body: t.Object({
        company: t.String({ maxLength: 200 }),
        position: t.String({ maxLength: 200 }),
        jobInfo: t.Optional(t.Record(t.String(), t.Any())),
        content: t.Optional(t.Record(t.String(), t.Any())),
        template: t.Optional(t.String({ maxLength: 50 })),
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
      if (body.template !== undefined) updates.template = body.template;

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
        jobInfo: t.Optional(t.Record(t.String(), t.Any())),
        content: t.Optional(t.Record(t.String(), t.Any())),
        template: t.Optional(t.String({ maxLength: 50 })),
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
      const settingsRows = await db.select().from(settings);
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

      try {
        const response = await aiService.generate(prompt, { temperature: 0.7, maxTokens: 2000 });

        if (response.error) {
          set.status = 500;
          return { error: "Cover letter generation failed", details: response.error };
        }

        let generatedContent: unknown;
        try {
          generatedContent = JSON.parse(response.content);
        } catch {
          const lines = response.content.split("\n").filter((line) => line.trim());
          generatedContent = {
            introduction: lines[0] || "Dear Hiring Manager,",
            body: lines.slice(1, -1).join("\n\n") || response.content,
            conclusion: lines[lines.length - 1] || "Thank you for your consideration.",
          };
        }

        const content = {
          introduction: generatedContent.introduction || generatedContent.intro || "",
          body: generatedContent.body || generatedContent.main || "",
          conclusion: generatedContent.conclusion || generatedContent.closing || "",
        };

        if (body.save) {
          const newCoverLetter = {
            id: generateId(),
            company: body.company,
            position: body.position,
            jobInfo: body.jobInfo || {},
            content: content,
            template: body.template || "professional",
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
      } catch (error) {
        set.status = 500;
        return {
          error: "Cover letter generation failed",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        company: t.String({ maxLength: 200 }),
        position: t.String({ maxLength: 200 }),
        jobInfo: t.Optional(t.Record(t.String(), t.Any())),
        resumeId: t.Optional(t.String({ maxLength: 100 })),
        template: t.Optional(t.String({ maxLength: 50 })),
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

      try {
        const pdfBytes = await exportService.exportCoverLetterPDF(
          {
            company: letter.company,
            position: letter.position,
            content: (letter.content || {}) as Record<string, unknown>,
          },
          {
            name: profile?.name || "",
            email: profile?.email || undefined,
            phone: profile?.phone || undefined,
            location: profile?.location || undefined,
          },
        );

        return new Response(pdfBytes, {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="cover-letter-${params.id}.pdf"`,
          },
        });
      } catch (error) {
        set.status = 500;
        return {
          error: "Failed to export cover letter",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  );
