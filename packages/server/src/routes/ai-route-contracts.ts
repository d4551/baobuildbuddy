import type { Static } from "typebox";
import { AI_CHAT_CONTEXT_TAIL_LIMIT } from "@bao/shared/constants/ai-chat";
import {
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import { t } from "elysia";
import { aiPreferenceSchema, chatContextSchema } from "./ai-route-chat-context";

export type AnalyzeResumeBody = {
  resumeId: string;
  jobId?: string;
};

export type GenerateCoverLetterBody = {
  resumeId: string;
  jobId?: string;
  company: string;
  position: string;
};

export type MatchJobsBody = {
  resumeId?: string;
  skills?: string[];
};

export type MatchJobsResponse = {
  message: string;
  matches: Array<{
    jobId: string;
    title: string;
    company: string;
    location: string | null;
    remote: boolean;
    score: number;
    strengths: string[];
    concerns: string[];
    highlightSkills: string[];
  }>;
  recommendations: string[];
};

export type CoverLetterSections = {
  introduction: string;
  body: string;
  conclusion: string;
};

export type ResumeAnalysisResult = {
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
};

export const chatRouteBodySchema = t.Object(
  {
    message: t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
    sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    context: t.Optional(chatContextSchema),
  },
  { required: ["message"] },
);
export type ChatRouteBody = Static<typeof chatRouteBodySchema>;

export const analyzeResumeRouteBodySchema = t.Object(
  {
    resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  },
  { required: ["resumeId"] },
);
export type AnalyzeResumeRouteBody = Static<typeof analyzeResumeRouteBodySchema>;

export const generateCoverLetterRouteBodySchema = t.Object(
  {
    resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  },
  { required: ["resumeId", "company", "position"] },
);
export type GenerateCoverLetterRouteBody = Static<typeof generateCoverLetterRouteBodySchema>;

export const matchJobsRouteBodySchema = t.Object({
  resumeId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  skills: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  preferences: t.Optional(aiPreferenceSchema),
});
export type MatchJobsRouteBody = Static<typeof matchJobsRouteBodySchema>;

export const automationActionRouteBodySchema = t.Object(
  {
    action: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
    jobUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    coverLetterId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  },
  { required: ["action", "jobUrl", "resumeId"] },
);
export type AutomationActionRouteBody = Static<typeof automationActionRouteBodySchema>;

export const usageTailLimit = AI_CHAT_CONTEXT_TAIL_LIMIT;
