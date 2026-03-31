import {
  AI_CHAT_CONTEXT_TAIL_LIMIT,
  SCHEMA_MAX_ITEMS_XXLARGE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared";
import Type from "baobox";
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

export const chatRouteBodySchema = Type.Object(
  {
    message: Type.String({ maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
    sessionId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    context: Type.Optional(chatContextSchema),
  },
  { required: ["message"] },
);

export const analyzeResumeRouteBodySchema = Type.Object(
  {
    resumeId: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    jobId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  },
  { required: ["resumeId"] },
);

export const generateCoverLetterRouteBodySchema = Type.Object(
  {
    resumeId: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    jobId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    company: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    position: Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  },
  { required: ["resumeId", "company", "position"] },
);

export const matchJobsRouteBodySchema = Type.Object({
  resumeId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  skills: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }), {
      maxItems: SCHEMA_MAX_ITEMS_XXLARGE,
    }),
  ),
  preferences: Type.Optional(aiPreferenceSchema),
});

export const automationActionRouteBodySchema = Type.Object(
  {
    action: Type.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL }),
    jobUrl: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_LONG }),
    resumeId: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
    coverLetterId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    jobId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  },
  { required: ["action", "jobUrl", "resumeId"] },
);

export const usageTailLimit = AI_CHAT_CONTEXT_TAIL_LIMIT;
