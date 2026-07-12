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
import Type, { type StaticParse } from "baobox";

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

export const resumeTemplateBodySchema = Type.Union(
  RESUME_TEMPLATE_OPTIONS.map((template) => Type.Literal(template)),
);

export const resumeThemeBodySchema = Type.Union([Type.Literal("light"), Type.Literal("dark")]);

export const resumePersonalInfoBodySchema = Type.Object({
  name: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  email: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
  phone: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_PHONE })),
  location: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  website: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  linkedIn: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  github: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  portfolio: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
});

export const resumeExperienceBodySchema = Type.Object(
  {
    title: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    company: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    startDate: Type.String({ maxLength: SCHEMA_MAX_LENGTH_DATE }),
    endDate: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DATE })),
    location: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    description: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
    achievements: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ACHIEVEMENT }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    technologies: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
  },
  { required: ["title", "company", "startDate"] },
);

export const resumeEducationBodySchema = Type.Object(
  {
    degree: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    field: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    school: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    year: Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
    gpa: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
  },
  { required: ["degree", "field", "school", "year"] },
);

export const resumeSkillsBodySchema = Type.Object({
  technical: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  soft: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  gaming: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
});

export const resumeProjectBodySchema = Type.Object(
  {
    title: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    description: Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION }),
    technologies: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
        maxItems: SCHEMA_MAX_ITEMS_LARGE,
      }),
    ),
    link: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  },
  { required: ["title", "description"] },
);

export const resumeGamingExperienceBodySchema = Type.Object({
  gameEngines: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  platforms: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  genres: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL })),
  shippedTitles: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHIPPED })),
});

export const resumeMutationBodySchema = Type.Object({
  name: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  personalInfo: Type.Optional(resumePersonalInfoBodySchema),
  summary: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
  experience: Type.Optional(
    Type.Array(resumeExperienceBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  ),
  education: Type.Optional(
    Type.Array(resumeEducationBodySchema, { maxItems: SCHEMA_MAX_ITEMS_SMALL }),
  ),
  skills: Type.Optional(resumeSkillsBodySchema),
  projects: Type.Optional(
    Type.Array(resumeProjectBodySchema, { maxItems: SCHEMA_MAX_ITEMS_LARGE }),
  ),
  gamingExperience: Type.Optional(resumeGamingExperienceBodySchema),
  template: Type.Optional(resumeTemplateBodySchema),
  theme: Type.Optional(resumeThemeBodySchema),
  isDefault: Type.Optional(Type.Boolean()),
});

export const resumeIdParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type ResumeIdParams = StaticParse<typeof resumeIdParamsSchema>;

export const resumeQuestionGenerateBodySchema = Type.Object(
  {
    targetRole: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    studioName: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    experienceLevel: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
  },
  { required: ["targetRole"] },
);
export type ResumeQuestionGenerateRouteBody = StaticParse<typeof resumeQuestionGenerateBodySchema>;

export const resumeQuestionSynthesizeBodySchema = Type.Object(
  {
    questionsAndAnswers: Type.Array(
      Type.Object(
        {
          id: Type.String(),
          question: Type.String(),
          answer: Type.String(),
          category: Type.String(),
        },
        { required: ["id", "question", "answer", "category"] },
      ),
    ),
  },
  { required: ["questionsAndAnswers"] },
);
export type ResumeQuestionSynthesizeRouteBody = StaticParse<
  typeof resumeQuestionSynthesizeBodySchema
>;

export const resumeExportBodySchema = Type.Object({
  format: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
  template: Type.Optional(resumeTemplateBodySchema),
});
export type ResumeExportRouteBody = StaticParse<typeof resumeExportBodySchema>;

export const resumeEnhanceBodySchema = Type.Object({
  section: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
});
export type ResumeEnhanceRouteBody = StaticParse<typeof resumeEnhanceBodySchema>;

export const resumeScoreBodySchema = Type.Object(
  {
    jobId: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["jobId"] },
);
