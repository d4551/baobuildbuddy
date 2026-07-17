import type { Static } from "typebox";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { RESUME_TEMPLATE_OPTIONS } from "@bao/shared/constants/resume";
import { t } from "elysia";
import { simpleErrorResponseSchema } from "./route-error-envelope";

const resumeTemplateBodySchema = t.Union(
  RESUME_TEMPLATE_OPTIONS.map((template) => t.Literal(template)),
);
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
export type ResumeQuestionGenerateResponse = Static<
  typeof resumeQuestionGenerateResponseSchema
>;

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
    suggestions: t.Array(t.Unknown()),
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
    required: [
      "resumeId",
      "jobId",
      "score",
      "strengths",
      "improvements",
      "keywords",
      "analysis",
    ],
  },
);

export const resumeQuestionGenerateResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Unknown(),
};

export const resumeQuestionSynthesizeResponses = {
  [HTTP_STATUS_CREATED]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Unknown(),
};

export const resumeListResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
};

export const resumeEntityResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
};

export const resumeCreateResponses = {
  [HTTP_STATUS_CREATED]: t.Unknown(),
};

export const resumeUpdateResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
};

export const resumeDeleteResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
};

export const resumeExportResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Unknown(),
};

export const resumeEnhanceResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Unknown(),
};

export const resumeScoreResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Unknown(),
};
