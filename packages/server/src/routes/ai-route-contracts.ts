import {
  AI_CHAT_CONTEXT_TAIL_LIMIT,
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared";
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

export type RouteSetState = {
  status?: number | string;
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

export const chatRouteBodySchema = t.Object({
  message: t.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
  sessionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  context: t.Optional(chatContextSchema),
});

export const analyzeResumeRouteBodySchema = t.Object({
  resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export const generateCoverLetterRouteBodySchema = t.Object({
  resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  company: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  position: t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
});

export const matchJobsRouteBodySchema = t.Object({
  resumeId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  skills: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  preferences: t.Optional(aiPreferenceSchema),
});

export const automationActionRouteBodySchema = t.Object({
  action: t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
  jobUrl: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
  resumeId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  coverLetterId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  jobId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export const usageTailLimit = AI_CHAT_CONTEXT_TAIL_LIMIT;
