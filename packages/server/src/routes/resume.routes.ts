import {
  AI_DEFAULT_TEMPERATURE,
  AI_DEFAULT_TEMPERATURE_CREATIVE,
  AI_MAX_TOKENS_RESUME,
  AI_MAX_TOKENS_SCORE,
  API_ERROR_AI_ENHANCEMENT_FAILED,
  API_ERROR_AI_SCORING_FAILED,
  API_ERROR_EXPORT_RESUME,
  API_ERROR_GENERATE_QUESTIONS,
  API_ERROR_JOB_NOT_FOUND,
  API_ERROR_RESUME_NOT_FOUND,
  API_ERROR_SYNTHESIZE_RESUME,
  API_ERROR_UNKNOWN,
  DEFAULT_SCORE_NEUTRAL,
  DEFAULT_UNSPECIFIED_LABEL,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  isResumeTemplate,
  RESUME_DEFAULT_NAME,
  RESUME_DEFAULT_NAME_QUESTIONNAIRE,
  RESUME_DEFAULT_THEME,
  RESUME_TEMPLATE_DEFAULT,
  RESUME_TEMPLATE_OPTIONS,
  type ResumeData,
  ROUTE_GAMIFICATION_XP,
  SCHEMA_MAX_ITEMS_LARGE,
  SCHEMA_MAX_ITEMS_SMALL,
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_ACHIEVEMENT,
  SCHEMA_MAX_LENGTH_DATE,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_PHONE,
  SCHEMA_MAX_LENGTH_SHIPPED,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
  safeParseJson,
  settle,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { AIService } from "../services/ai/ai-service";
import { resumeEnhancePrompt, resumeScorePrompt } from "../services/ai/prompts";
import { cvQuestionnaireService } from "../services/cv-questionnaire-service";
import { docxExportService } from "../services/docx-export-service";
import { exportService } from "../services/export-service";
import { gamificationService } from "../services/gamification-service";
import { resumeService } from "../services/resume-service";
import { createDocxAttachmentResponse, createPdfAttachmentResponse } from "../utils/http-response";

const resumeTemplateBodySchema = t.String({
  enum: RESUME_TEMPLATE_OPTIONS,
});

const resumeThemeBodySchema = t.Union([t.Literal("light"), t.Literal("dark")]);

const resumePersonalInfoBodySchema = t.Object({
  name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  email: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
  phone: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_PHONE })),
  location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  website: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  linkedIn: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  github: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  portfolio: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
});

const resumeExperienceBodySchema = t.Object({
  title: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  startDate: t.String({ maxLength: SCHEMA_MAX_LENGTH_DATE }),
  endDate: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DATE })),
  location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  description: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  achievements: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ACHIEVEMENT }), {
      maxItems: SCHEMA_MAX_ITEMS_LARGE,
    }),
  ),
  technologies: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  ),
});

const resumeEducationBodySchema = t.Object({
  degree: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  field: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  school: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  year: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
  gpa: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});

const resumeSkillsBodySchema = t.Object({
  technical: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), { maxItems: SCHEMA_MAX_ITEMS_XXLARGE }),
  ),
  soft: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), { maxItems: SCHEMA_MAX_ITEMS_XXLARGE }),
  ),
  gaming: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), { maxItems: SCHEMA_MAX_ITEMS_XXLARGE }),
  ),
});

const resumeProjectBodySchema = t.Object({
  title: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  description: t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION }),
  technologies: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  ),
  link: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
});

const resumeGamingExperienceBodySchema = t.Object({
  gameEngines: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  platforms: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  genres: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  shippedTitles: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHIPPED })),
});

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

type ResumeRouteSetState = {
  status?: number | string;
};
type ResumeScoreBody = {
  jobId: string;
};
type ResumeScoreDetails = {
  analysis: Record<string, unknown>;
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
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
  const score = typeof analysisRecord.score === "number" ? analysisRecord.score : 0;
  const strengths = Array.isArray(analysisRecord.strengths)
    ? analysisRecord.strengths.filter((entry): entry is string => typeof entry === "string")
    : [];
  const improvements = Array.isArray(analysisRecord.improvements)
    ? analysisRecord.improvements.filter((entry): entry is string => typeof entry === "string")
    : [];
  const keywords = Array.isArray(analysisRecord.keywords)
    ? analysisRecord.keywords.filter((entry): entry is string => typeof entry === "string")
    : [];
  return {
    analysis: analysisRecord,
    score,
    strengths,
    improvements,
    keywords,
  };
};

const handleResumeAiScore = async (
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
        temperature: AI_DEFAULT_TEMPERATURE,
        maxTokens: AI_MAX_TOKENS_RESUME,
      },
    ),
  );
  if (aiResult.status === "rejected") {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return {
      error: API_ERROR_AI_SCORING_FAILED,
      details: aiResult.reason instanceof Error ? aiResult.reason.message : API_ERROR_UNKNOWN,
    };
  }

  const response = aiResult.value;
  if (response.error) {
    set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    return { error: API_ERROR_AI_SCORING_FAILED, details: response.error };
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

export const resumeRoutes = new Elysia({ prefix: "/resumes", tags: ["Resumes"] })
  .post(
    "/from-questions/generate",
    async ({ body, set }) => {
      const result = await settle(
        cvQuestionnaireService.generateQuestions({
          targetRole: body.targetRole,
          studioName: body.studioName,
          experienceLevel: body.experienceLevel,
        }),
      );
      if (result.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_GENERATE_QUESTIONS,
          details: result.reason instanceof Error ? result.reason.message : API_ERROR_UNKNOWN,
        };
      }
      return { questions: result.value };
    },
    {
      body: t.Object({
        targetRole: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        studioName: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        experienceLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
      }),
    },
  )
  .post(
    "/from-questions/synthesize",
    async ({ body, set }) => {
      const synthesizeResult = await settle(
        cvQuestionnaireService.synthesizeResume(body.questionsAndAnswers),
      );
      if (synthesizeResult.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_SYNTHESIZE_RESUME,
          details:
            synthesizeResult.reason instanceof Error
              ? synthesizeResult.reason.message
              : API_ERROR_UNKNOWN,
        };
      }

      const createResult = await settle(
        resumeService.createResume({
          name: RESUME_DEFAULT_NAME_QUESTIONNAIRE,
          ...synthesizeResult.value,
        }),
      );
      if (createResult.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_SYNTHESIZE_RESUME,
          details:
            createResult.reason instanceof Error ? createResult.reason.message : API_ERROR_UNKNOWN,
        };
      }

      set.status = HTTP_STATUS_CREATED;
      return createResult.value;
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
      };
      const created = await resumeService.createResume(createPayload);
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "resumesGenerated",
        ROUTE_GAMIFICATION_XP.resumesGenerated,
        "resume_created",
      );
      return created;
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        personalInfo: t.Optional(resumePersonalInfoBodySchema),
        summary: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
        experience: t.Optional(
          t.Array(resumeExperienceBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
        ),
        education: t.Optional(
          t.Array(resumeEducationBodySchema, { maxItems: SCHEMA_MAX_ITEMS_SMALL }),
        ),
        skills: t.Optional(resumeSkillsBodySchema),
        projects: t.Optional(
          t.Array(resumeProjectBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
        ),
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
        set.status = HTTP_STATUS_NOT_FOUND;
        return {
          error: API_ERROR_RESUME_NOT_FOUND,
        };
      }
      return resume;
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
      const updatePayload: Partial<ResumeData> = {
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
      };
      const updated = await resumeService.updateResume(params.id, updatePayload);
      if (!updated) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_RESUME_NOT_FOUND };
      }
      return updated;
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        personalInfo: t.Optional(resumePersonalInfoBodySchema),
        summary: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
        experience: t.Optional(
          t.Array(resumeExperienceBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
        ),
        education: t.Optional(
          t.Array(resumeEducationBodySchema, { maxItems: SCHEMA_MAX_ITEMS_SMALL }),
        ),
        skills: t.Optional(resumeSkillsBodySchema),
        projects: t.Optional(
          t.Array(resumeProjectBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
        ),
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
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_RESUME_NOT_FOUND };
      }
      await resumeService.deleteResume(params.id);
      return { success: true, id: params.id };
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
    },
  )
  .post(
    "/:id/export",
    async ({ params, body, set }) => {
      const resume = await resumeService.getResume(params.id);
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
            details:
              docxResult.reason instanceof Error ? docxResult.reason.message : API_ERROR_UNKNOWN,
          };
        }
        return createDocxAttachmentResponse(docxResult.value, `resume-${params.id}.docx`);
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

      return createPdfAttachmentResponse(
        Buffer.from(exportResult.value),
        `resume-${params.id}.pdf`,
      );
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        format: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
        template: t.Optional(resumeTemplateBodySchema),
      }),
    },
  )
  .post(
    "/:id/ai-enhance",
    async ({ params, body, set }) => {
      const resume = await resumeService.getResume(params.id);
      if (!resume) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_RESUME_NOT_FOUND };
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

      const aiResult = await settle(
        aiService.generate(prompt, {
          temperature: AI_DEFAULT_TEMPERATURE_CREATIVE,
          maxTokens: AI_MAX_TOKENS_SCORE,
        }),
      );
      if (aiResult.status === "rejected") {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return {
          error: API_ERROR_AI_ENHANCEMENT_FAILED,
          details: aiResult.reason instanceof Error ? aiResult.reason.message : API_ERROR_UNKNOWN,
        };
      }

      const response = aiResult.value;
      if (response.error) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return { error: API_ERROR_AI_ENHANCEMENT_FAILED, details: response.error };
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
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        section: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
      }),
    },
  )
  .post(
    "/:id/ai-score",
    async ({ params, body, set }) => handleResumeAiScore(params.id, body, set),
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
    },
  );
