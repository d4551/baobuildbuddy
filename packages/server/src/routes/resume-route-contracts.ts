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
import type { Static } from "typebox";

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
  experience: t.Optional(t.Array(resumeExperienceBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE })),
  education: t.Optional(t.Array(resumeEducationBodySchema, { maxItems: SCHEMA_MAX_ITEMS_SMALL })),
  skills: t.Optional(resumeSkillsBodySchema),
  projects: t.Optional(t.Array(resumeProjectBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE })),
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
export type ResumeQuestionSynthesizeRouteBody = Static<typeof resumeQuestionSynthesizeBodySchema>;

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
