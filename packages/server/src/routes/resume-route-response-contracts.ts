import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { t } from "elysia";
import type { Static } from "typebox";
import { simpleErrorResponseSchema } from "./route-error-envelope";

/**
 * Spelled out as a literal tuple: `t.Union` over a mapped array loses the member
 * literals and its `Static` collapses to `never`, which silently widened every
 * response embedding a template. `resume-route-template-parity.test.ts` asserts
 * these members stay identical to RESUME_TEMPLATE_OPTIONS, which remains SSOT.
 */
export const resumeTemplateBodySchema = t.Union([
  t.Literal("modern"),
  t.Literal("classic"),
  t.Literal("creative"),
  t.Literal("minimal"),
  t.Literal("google-xyz"),
  t.Literal("gaming"),
  t.Literal("executive"),
  t.Literal("technical"),
]);
const resumeThemeBodySchema = t.Union([t.Literal("light"), t.Literal("dark")]);

export const resumePersonalInfoResponseSchema = t.Object({
  name: t.Optional(t.String()),
  email: t.Optional(t.String()),
  phone: t.Optional(t.String()),
  location: t.Optional(t.String()),
  website: t.Optional(t.String()),
  linkedIn: t.Optional(t.String()),
  github: t.Optional(t.String()),
  portfolio: t.Optional(t.String()),
});

export const resumeExperienceResponseSchema = t.Object(
  {
    title: t.String(),
    company: t.String(),
    startDate: t.String(),
    endDate: t.Optional(t.String()),
    location: t.Optional(t.String()),
    description: t.Optional(t.String()),
    achievements: t.Optional(t.Array(t.String())),
    technologies: t.Optional(t.Array(t.String())),
  },
  { required: ["title", "company", "startDate"] },
);

export const resumeEducationResponseSchema = t.Object(
  {
    degree: t.String(),
    field: t.String(),
    school: t.String(),
    year: t.String(),
    gpa: t.Optional(t.String()),
  },
  { required: ["degree", "field", "school", "year"] },
);

export const resumeSkillsResponseSchema = t.Object({
  technical: t.Optional(t.Array(t.String())),
  soft: t.Optional(t.Array(t.String())),
  gaming: t.Optional(t.Array(t.String())),
});

export const resumeProjectResponseSchema = t.Object(
  {
    title: t.String(),
    description: t.String(),
    technologies: t.Optional(t.Array(t.String())),
    link: t.Optional(t.String()),
  },
  { required: ["title", "description"] },
);

export const resumeGamingExperienceResponseSchema = t.Object({
  gameEngines: t.Optional(t.String()),
  platforms: t.Optional(t.String()),
  genres: t.Optional(t.String()),
  shippedTitles: t.Optional(t.String()),
});

export const resumeEntityResponseSchema = t.Object(
  {
    id: t.String(),
    name: t.String(),
    personalInfo: t.Optional(resumePersonalInfoResponseSchema),
    summary: t.String(),
    experience: t.Array(resumeExperienceResponseSchema),
    education: t.Array(resumeEducationResponseSchema),
    skills: t.Optional(resumeSkillsResponseSchema),
    projects: t.Array(resumeProjectResponseSchema),
    gamingExperience: t.Optional(resumeGamingExperienceResponseSchema),
    template: resumeTemplateBodySchema,
    theme: resumeThemeBodySchema,
    isDefault: t.Boolean(),
  },
  {
    required: [
      "id",
      "name",
      "summary",
      "experience",
      "education",
      "projects",
      "template",
      "theme",
      "isDefault",
    ],
  },
);
export type ResumeEntityResponse = Static<typeof resumeEntityResponseSchema>;

export const resumeQuestionResponseSchema = t.Object(
  {
    id: t.String(),
    question: t.String(),
    category: t.String(),
  },
  { required: ["id", "question", "category"] },
);

export const resumeQuestionGenerateResponseSchema = t.Object(
  {
    questions: t.Array(resumeQuestionResponseSchema),
  },
  { required: ["questions"] },
);
export type ResumeQuestionGenerateResponse = Static<typeof resumeQuestionGenerateResponseSchema>;

export const resumeDeleteResponseSchema = t.Object(
  {
    success: t.Boolean(),
    id: t.String(),
  },
  { required: ["success", "id"] },
);

export const resumeEnhanceResponseSchema = t.Object(
  {
    resume: resumeEntityResponseSchema,
    suggestions: t.Array(
      t.Object(
        {
          text: t.String(),
          section: t.String(),
        },
        { required: ["text", "section"] },
      ),
    ),
    section: t.String(),
  },
  { required: ["resume", "suggestions", "section"] },
);

export const resumeScoreResponseSchema = t.Object(
  {
    resumeId: t.String(),
    jobId: t.String(),
    score: t.Number(),
    strengths: t.Array(t.String()),
    improvements: t.Array(t.String()),
    keywords: t.Array(t.String()),
    analysis: t.Record(t.String(), t.Unknown()),
  },
  {
    required: ["resumeId", "jobId", "score", "strengths", "improvements", "keywords", "analysis"],
  },
);

export const resumeQuestionGenerateResponses = {
  [HTTP_STATUS_OK]: resumeQuestionGenerateResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
} as const;

export const resumeQuestionSynthesizeResponses = {
  [HTTP_STATUS_CREATED]: resumeEntityResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
} as const;

export const resumeListResponses = {
  [HTTP_STATUS_OK]: t.Array(resumeEntityResponseSchema),
} as const;

export const resumeEntityResponses = {
  [HTTP_STATUS_OK]: resumeEntityResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;

export const resumeCreateResponses = {
  [HTTP_STATUS_CREATED]: resumeEntityResponseSchema,
} as const;

export const resumeUpdateResponses = {
  [HTTP_STATUS_OK]: resumeEntityResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;

export const resumeDeleteResponses = {
  [HTTP_STATUS_OK]: resumeDeleteResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
} as const;

/** Export streams a generated document body, so only the error arms are typed. */
export const resumeExportResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
} as const;

export const resumeEnhanceResponses = {
  [HTTP_STATUS_OK]: resumeEnhanceResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
} as const;

export const resumeScoreResponses = {
  [HTTP_STATUS_OK]: resumeScoreResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
} as const;
