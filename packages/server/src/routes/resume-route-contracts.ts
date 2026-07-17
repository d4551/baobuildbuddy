import type { Static } from "typebox";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { RESUME_TEMPLATE_OPTIONS } from "@bao/shared/constants/resume";
import {
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
} from "@bao/shared/constants/schema-limits";
import type { ResumeData } from "@bao/shared/types/resume";
import { t } from "elysia";
import { simpleErrorResponseSchema } from "./route-error-envelope";

export type ResumeRouteSetState = {
  status?: number | string;
};

export type ResumeScoreBody = {
  jobId: string;
};

export type ResumeMutationBody = {
  name?: string;
  personalInfo?: ResumeData["personalInfo"];
  summary?: string;
  experience?: ResumeData["experience"];
  education?: ResumeData["education"];
  skills?: ResumeData["skills"];
  projects?: ResumeData["projects"];
  gamingExperience?: ResumeData["gamingExperience"];
  template?: string;
  theme?: "light" | "dark";
  isDefault?: boolean;
};

export type ResumeExportBody = {
  format?: string;
  template?: string;
};

export type ResumeEnhanceBody = {
  section?: string;
};

export const resumeTemplateBodySchema = t.Union(
  RESUME_TEMPLATE_OPTIONS.map((template) => t.Literal(template)),
);

export const resumeThemeBodySchema = t.Union([t.Literal("light"), t.Literal("dark")]);

export const resumePersonalInfoBodySchema = t.Object({
  name: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  email: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
  phone: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_PHONE })),
  location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  website: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  linkedIn: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  github: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  portfolio: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
});

export const resumeExperienceBodySchema = t.Object(
  {
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
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
  },
  { required: ["title", "company", "startDate"] },
);

export const resumeEducationBodySchema = t.Object(
  {
    degree: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    field: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    school: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    year: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
    gpa: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
  },
  { required: ["degree", "field", "school", "year"] },
);

export const resumeSkillsBodySchema = t.Object({
  technical: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  soft: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  gaming: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
});

export const resumeProjectBodySchema = t.Object(
  {
    title: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    description: t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION }),
    technologies: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    link: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  },
  { required: ["title", "description"] },
);

export const resumeGamingExperienceBodySchema = t.Object({
  gameEngines: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  platforms: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  genres: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  shippedTitles: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHIPPED })),
});

export const resumeMutationBodySchema = t.Object({
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
});

export const resumeIdParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type ResumeIdParams = Static<typeof resumeIdParamsSchema>;

export const resumeQuestionGenerateBodySchema = t.Object(
  {
    targetRole: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    studioName: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    experienceLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  },
  { required: ["targetRole"] },
);
export type ResumeQuestionGenerateRouteBody = Static<typeof resumeQuestionGenerateBodySchema>;

export const resumeQuestionSynthesizeBodySchema = t.Object(
  {
    questionsAndAnswers: t.Array(
      t.Object(
        {
          id: t.String(),
          question: t.String(),
          answer: t.String(),
          category: t.String(),
        },
        { required: ["id", "question", "answer", "category"] },
      ),
    ),
  },
  { required: ["questionsAndAnswers"] },
);
export type ResumeQuestionSynthesizeRouteBody = Static<
  typeof resumeQuestionSynthesizeBodySchema
>;

export const resumeExportBodySchema = t.Object({
  format: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
  template: t.Optional(resumeTemplateBodySchema),
});
export type ResumeExportRouteBody = Static<typeof resumeExportBodySchema>;

export const resumeEnhanceBodySchema = t.Object({
  section: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
});
export type ResumeEnhanceRouteBody = Static<typeof resumeEnhanceBodySchema>;

export const resumeScoreBodySchema = t.Object(
  {
    jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["jobId"] },
);
export type ResumeScoreRouteBody = Static<typeof resumeScoreBodySchema>;

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
  [HTTP_STATUS_OK]: resumeQuestionGenerateResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
};

export const resumeQuestionSynthesizeResponses = {
  [HTTP_STATUS_CREATED]: resumeEntityResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
};

export const resumeListResponses = {
  [HTTP_STATUS_OK]: t.Array(resumeEntityResponseSchema),
};

export const resumeEntityResponses = {
  [HTTP_STATUS_OK]: resumeEntityResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
};

export const resumeCreateResponses = {
  [HTTP_STATUS_CREATED]: resumeEntityResponseSchema,
};

export const resumeUpdateResponses = {
  [HTTP_STATUS_OK]: resumeEntityResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
};

export const resumeDeleteResponses = {
  [HTTP_STATUS_OK]: resumeDeleteResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
};

export const resumeExportResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
};

export const resumeEnhanceResponses = {
  [HTTP_STATUS_OK]: resumeEnhanceResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
};

export const resumeScoreResponses = {
  [HTTP_STATUS_OK]: resumeScoreResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
};
