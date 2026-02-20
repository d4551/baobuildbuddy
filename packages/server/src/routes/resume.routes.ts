import type { ResumeData } from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { AIService } from "../services/ai/ai-service";
import { resumeEnhancePrompt, resumeScorePrompt } from "../services/ai/prompts";
import { cvQuestionnaireService } from "../services/cv-questionnaire-service";
import { exportService } from "../services/export-service";
import { resumeService } from "../services/resume-service";

const resumeTemplateBodySchema = t.Union([
  t.Literal("modern"),
  t.Literal("classic"),
  t.Literal("creative"),
  t.Literal("minimal"),
  t.Literal("google-xyz"),
  t.Literal("gaming"),
]);

const resumeThemeBodySchema = t.Union([t.Literal("light"), t.Literal("dark")]);

const resumePersonalInfoBodySchema = t.Object({
  name: t.Optional(t.String({ maxLength: 200 })),
  email: t.Optional(t.String({ maxLength: 320 })),
  phone: t.Optional(t.String({ maxLength: 30 })),
  location: t.Optional(t.String({ maxLength: 200 })),
  website: t.Optional(t.String({ maxLength: 500 })),
  linkedIn: t.Optional(t.String({ maxLength: 500 })),
  github: t.Optional(t.String({ maxLength: 500 })),
  portfolio: t.Optional(t.String({ maxLength: 500 })),
});

const resumeExperienceBodySchema = t.Object({
  title: t.String({ maxLength: 200 }),
  company: t.String({ maxLength: 200 }),
  startDate: t.String({ maxLength: 80 }),
  endDate: t.Optional(t.String({ maxLength: 80 })),
  location: t.Optional(t.String({ maxLength: 200 })),
  description: t.Optional(t.String({ maxLength: 5000 })),
  achievements: t.Optional(t.Array(t.String({ maxLength: 300 }), { maxItems: 50 })),
  technologies: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
});

const resumeEducationBodySchema = t.Object({
  degree: t.String({ maxLength: 200 }),
  field: t.String({ maxLength: 200 }),
  school: t.String({ maxLength: 200 }),
  year: t.String({ maxLength: 50 }),
  gpa: t.Optional(t.String({ maxLength: 20 })),
});

const resumeSkillsBodySchema = t.Object({
  technical: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 100 })),
  soft: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 100 })),
  gaming: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 100 })),
});

const resumeProjectBodySchema = t.Object({
  title: t.String({ maxLength: 200 }),
  description: t.String({ maxLength: 5000 }),
  technologies: t.Optional(t.Array(t.String({ maxLength: 100 }), { maxItems: 50 })),
  link: t.Optional(t.String({ maxLength: 500 })),
});

const resumeGamingExperienceBodySchema = t.Object({
  gameEngines: t.Optional(t.String({ maxLength: 500 })),
  platforms: t.Optional(t.String({ maxLength: 500 })),
  genres: t.Optional(t.String({ maxLength: 500 })),
  shippedTitles: t.Optional(t.String({ maxLength: 1000 })),
});

export const resumeRoutes = new Elysia({ prefix: "/resumes" })
  .post(
    "/from-questions/generate",
    async ({ body, set }) => {
      try {
        const questions = await cvQuestionnaireService.generateQuestions({
          targetRole: body.targetRole,
          studioName: body.studioName,
          experienceLevel: body.experienceLevel,
        });
        return { questions };
      } catch (error) {
        set.status = 500;
        return {
          error: "Failed to generate questions",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        targetRole: t.String({ maxLength: 200 }),
        studioName: t.Optional(t.String({ maxLength: 200 })),
        experienceLevel: t.Optional(t.String({ maxLength: 50 })),
      }),
    },
  )
  .post(
    "/from-questions/synthesize",
    async ({ body, set }) => {
      try {
        const resumeData = await cvQuestionnaireService.synthesizeResume(body.questionsAndAnswers);
        const created = await resumeService.createResume({
          name: "Resume from Questionnaire",
          ...resumeData,
        });
        set.status = 201;
        return created;
      } catch (error) {
        set.status = 500;
        return {
          error: "Failed to synthesize resume",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: t.Object({
        questionsAndAnswers: t.Array(
          t.Object({
            id: t.String(),
            question: t.String(),
            answer: t.String(),
            category: t.String(),
          }),
        ),
      }),
    },
  )
  .get("/", async () => {
    return resumeService.getResumes();
  })
  .post(
    "/",
    async ({ body, set }) => {
      const createPayload: Omit<ResumeData, "id"> = {
        name: body.name || "Untitled Resume",
        personalInfo: body.personalInfo || {},
        summary: body.summary || "",
        experience: body.experience || [],
        education: body.education || [],
        skills: body.skills || {},
        projects: body.projects || [],
        gamingExperience: body.gamingExperience || {},
        template: body.template || "modern",
        theme: body.theme || "light",
        isDefault: body.isDefault === true,
      };
      const created = await resumeService.createResume(createPayload);
      set.status = 201;
      return created;
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ maxLength: 200 })),
        personalInfo: t.Optional(resumePersonalInfoBodySchema),
        summary: t.Optional(t.String({ maxLength: 5000 })),
        experience: t.Optional(t.Array(resumeExperienceBodySchema, { maxItems: 50 })),
        education: t.Optional(t.Array(resumeEducationBodySchema, { maxItems: 20 })),
        skills: t.Optional(resumeSkillsBodySchema),
        projects: t.Optional(t.Array(resumeProjectBodySchema, { maxItems: 50 })),
        gamingExperience: t.Optional(resumeGamingExperienceBodySchema),
        template: t.Optional(resumeTemplateBodySchema),
        theme: t.Optional(resumeThemeBodySchema),
        isDefault: t.Optional(t.Boolean()),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        set.status = 404;
        return { error: "Resume not found" };
      }
      return resume;
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
      const updatePayload: Partial<ResumeData> = {
        name: body.name,
        personalInfo: body.personalInfo,
        summary: body.summary,
        experience: body.experience,
        education: body.education,
        skills: body.skills,
        projects: body.projects,
        gamingExperience: body.gamingExperience,
        template: body.template,
        theme: body.theme,
        isDefault: body.isDefault,
      };
      const updated = await resumeService.updateResume(params.id, updatePayload);
      if (!updated) {
        set.status = 404;
        return { error: "Resume not found" };
      }
      return updated;
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ maxLength: 200 })),
        personalInfo: t.Optional(resumePersonalInfoBodySchema),
        summary: t.Optional(t.String({ maxLength: 5000 })),
        experience: t.Optional(t.Array(resumeExperienceBodySchema, { maxItems: 50 })),
        education: t.Optional(t.Array(resumeEducationBodySchema, { maxItems: 20 })),
        skills: t.Optional(resumeSkillsBodySchema),
        projects: t.Optional(t.Array(resumeProjectBodySchema, { maxItems: 50 })),
        gamingExperience: t.Optional(resumeGamingExperienceBodySchema),
        template: t.Optional(resumeTemplateBodySchema),
        theme: t.Optional(resumeThemeBodySchema),
        isDefault: t.Optional(t.Boolean()),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, set }) => {
      const existing = await resumeService.getResume(params.id);
      if (!existing) {
        set.status = 404;
        return { error: "Resume not found" };
      }
      await resumeService.deleteResume(params.id);
      return { success: true, id: params.id };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
    },
  )
  .post(
    "/:id/export",
    async ({ params, body, set }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        set.status = 404;
        return { error: "Resume not found" };
      }

      try {
        const templateName = body.template || resume.template || "modern";
        const pdfBytes = await exportService.exportResumePDF(resume, templateName);

        set.headers["content-type"] = "application/pdf";
        set.headers["content-disposition"] = `attachment; filename="resume-${params.id}.pdf"`;

        return new Response(Buffer.from(pdfBytes), {
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `attachment; filename="resume-${params.id}.pdf"`,
          },
        });
      } catch (error) {
        set.status = 500;
        return {
          error: "Failed to export resume",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        format: t.Optional(t.String({ maxLength: 20 })),
        template: t.Optional(resumeTemplateBodySchema),
      }),
    },
  )
  .post(
    "/:id/ai-enhance",
    async ({ params, body, set }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        set.status = 404;
        return { error: "Resume not found" };
      }

      const settingsRows = await db.select().from(settings);
      const aiService = AIService.fromSettings(settingsRows[0]);

      const resumeText = `
Resume: ${resume.name}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience, null, 2)}
Education: ${JSON.stringify(resume.education, null, 2)}
Skills: ${JSON.stringify(resume.skills, null, 2)}
Projects: ${JSON.stringify(resume.projects, null, 2)}
${resume.gamingExperience ? `Gaming Experience: ${JSON.stringify(resume.gamingExperience, null, 2)}` : ""}
    `.trim();

      const section = body.section || "all";
      const prompt = resumeEnhancePrompt(resumeText, section);

      try {
        const response = await aiService.generate(prompt, { temperature: 0.7, maxTokens: 2000 });

        if (response.error) {
          set.status = 500;
          return { error: "AI enhancement failed", details: response.error };
        }

        let suggestions: unknown[] = [];
        try {
          const parsed = JSON.parse(response.content);
          suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [parsed];
        } catch {
          suggestions = [{ text: response.content, section: section }];
        }

        return {
          resume: resume,
          suggestions: suggestions,
          section: section,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: "AI enhancement failed",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        section: t.Optional(t.String({ maxLength: 50 })),
      }),
    },
  )
  .post(
    "/:id/ai-score",
    async ({ params, body, set }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        set.status = 404;
        return { error: "Resume not found" };
      }

      const jobRows = await db.select().from(jobs).where(eq(jobs.id, body.jobId));
      if (jobRows.length === 0) {
        set.status = 404;
        return { error: "Job not found" };
      }

      const job = jobRows[0];

      const settingsRows = await db.select().from(settings);
      const aiService = AIService.fromSettings(settingsRows[0]);

      const resumeText = `
Resume: ${resume.name}
Summary: ${resume.summary}
Experience: ${JSON.stringify(resume.experience, null, 2)}
Education: ${JSON.stringify(resume.education, null, 2)}
Skills: ${JSON.stringify(resume.skills, null, 2)}
Projects: ${JSON.stringify(resume.projects, null, 2)}
${resume.gamingExperience ? `Gaming Experience: ${JSON.stringify(resume.gamingExperience, null, 2)}` : ""}
    `.trim();

      const jobText = `
Job: ${job.title} at ${job.company}
Description: ${job.description}
Requirements: ${job.requirements || "Not specified"}
Location: ${job.location || "Not specified"}
Type: ${job.type || "Not specified"}
    `.trim();

      const prompt = resumeScorePrompt(resumeText, jobText);

      try {
        const response = await aiService.generate(prompt, { temperature: 0.3, maxTokens: 1500 });

        if (response.error) {
          set.status = 500;
          return { error: "AI scoring failed", details: response.error };
        }

        let analysis: Record<string, unknown>;
        try {
          analysis = JSON.parse(response.content);
        } catch {
          analysis = {
            score: 50,
            strengths: ["Unable to parse AI response"],
            improvements: ["Please try again"],
            keywords: [],
          };
        }

        return {
          resumeId: params.id,
          jobId: body.jobId,
          score: (analysis.score as number) || 0,
          strengths: (analysis.strengths as string[]) || [],
          improvements: (analysis.improvements as string[]) || [],
          keywords: (analysis.keywords as string[]) || [],
          analysis: analysis,
        };
      } catch (error) {
        set.status = 500;
        return {
          error: "AI scoring failed",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        jobId: t.String({ maxLength: 100 }),
      }),
    },
  );
