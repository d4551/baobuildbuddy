import type { Static } from "typebox";
import { AI_CHAT_CONTEXT_TAIL_LIMIT } from "@bao/shared/constants/ai-chat";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_TOO_MANY_REQUESTS,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
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
import { simpleErrorResponseSchema } from "./route-error-envelope";
import { aiRoutingBodySchema, preferredProviderBodySchema } from "./settings-route-schema-ai-brand";

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

export type AnalyzeResumeBody = AnalyzeResumeRouteBody;
export type GenerateCoverLetterBody = GenerateCoverLetterRouteBody;
export type MatchJobsBody = MatchJobsRouteBody;

const nullableStringSchema = t.Union([t.String(), t.Null()]);

const aiProviderDiagnosticResponseSchema = t.Object({
  provider: preferredProviderBodySchema,
  code: t.String(),
  checkedAt: t.String(),
  endpoint: t.Optional(t.String()),
  selectedModel: t.Optional(t.String()),
  availableModels: t.Optional(t.Array(t.String())),
  message: t.Optional(t.String()),
});

const aiProviderHealthResponseSchema = t.Union([
  t.Literal("healthy"),
  t.Literal("degraded"),
  t.Literal("down"),
  t.Literal("unconfigured"),
]);

const aiControlPlaneProviderResponseSchema = t.Object({
  id: preferredProviderBodySchema,
  nameKey: t.String(),
  descriptionKey: t.String(),
  iconId: preferredProviderBodySchema,
  models: t.Array(t.String()),
  available: t.Boolean(),
  health: aiProviderHealthResponseSchema,
  selectedModel: t.Optional(t.String()),
  diagnosticCode: t.Optional(t.String()),
  availableModels: t.Optional(t.Array(t.String())),
  error: t.Optional(t.String()),
});

export const aiModelsResponseSchema = t.Object({
  aiRouting: t.Optional(aiRoutingBodySchema),
  configuredProviders: t.Optional(t.Array(preferredProviderBodySchema)),
  error: t.Optional(t.String()),
  preferredModel: t.Optional(nullableStringSchema),
  preferredProvider: t.Optional(preferredProviderBodySchema),
  providerDiagnostics: t.Optional(t.Record(t.String(), aiProviderDiagnosticResponseSchema)),
  providers: t.Array(aiControlPlaneProviderResponseSchema),
});

export const chatRouteResponseSchema = t.Object({
  message: t.String(),
  sessionId: t.String(),
  timestamp: t.String(),
  provider: preferredProviderBodySchema,
  model: t.String(),
  followUps: t.Array(t.String()),
  contextDomain: t.String(),
});

export const resumeAnalysisResultResponseSchema = t.Object({
  score: t.Number(),
  strengths: t.Array(t.String()),
  improvements: t.Array(t.String()),
  keywords: t.Array(t.String()),
});
export type ResumeAnalysisResult = Static<typeof resumeAnalysisResultResponseSchema>;

export const analyzeResumeResponseSchema = t.Object({
  message: t.String(),
  resumeId: t.String(),
  jobId: nullableStringSchema,
  analysis: resumeAnalysisResultResponseSchema,
  provider: preferredProviderBodySchema,
  model: t.String(),
});

export const coverLetterSectionsResponseSchema = t.Object({
  introduction: t.String(),
  body: t.String(),
  conclusion: t.String(),
});
export type CoverLetterSections = Static<typeof coverLetterSectionsResponseSchema>;

export const generateCoverLetterResponseSchema = t.Object({
  message: t.String(),
  content: coverLetterSectionsResponseSchema,
  provider: preferredProviderBodySchema,
  model: t.String(),
});

const matchJobResponseSchema = t.Object({
  jobId: t.String(),
  title: t.String(),
  company: t.String(),
  location: nullableStringSchema,
  remote: t.Boolean(),
  score: t.Number(),
  strengths: t.Array(t.String()),
  concerns: t.Array(t.String()),
  highlightSkills: t.Array(t.String()),
});

export const matchJobsResponseSchema = t.Object({
  message: t.String(),
  matches: t.Array(matchJobResponseSchema),
  recommendations: t.Array(t.String()),
});
export type MatchJobsResponse = Static<typeof matchJobsResponseSchema>;

export const aiUsageResponseSchema = t.Object({
  totalMessages: t.Number(),
  userMessages: t.Number(),
  assistantMessages: t.Number(),
  sessions: t.Number(),
  recentActivity: t.Array(
    t.Object({
      timestamp: t.String(),
      role: t.String(),
      sessionId: nullableStringSchema,
    }),
  ),
});

export const automationActionResponseSchema = t.Object({
  runId: t.String(),
  status: t.String(),
  message: t.String(),
});

// Concrete body schemas above are the SSOT for AI payloads. Response maps stay
// open until route handlers return SelectiveStatus-compatible status/body branches
// instead of dynamic `status(result.status, result.body)` helper envelopes.
export const chatRouteResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
  [HTTP_STATUS_TOO_MANY_REQUESTS]: simpleErrorResponseSchema,
} as const;

export const analyzeResumeResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
  [HTTP_STATUS_TOO_MANY_REQUESTS]: simpleErrorResponseSchema,
} as const;

export const generateCoverLetterResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
  [HTTP_STATUS_TOO_MANY_REQUESTS]: simpleErrorResponseSchema,
} as const;

export const matchJobsResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
  [HTTP_STATUS_TOO_MANY_REQUESTS]: simpleErrorResponseSchema,
} as const;

export const aiModelsResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_TOO_MANY_REQUESTS]: simpleErrorResponseSchema,
} as const;

export const aiUsageResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_TOO_MANY_REQUESTS]: simpleErrorResponseSchema,
} as const;

export const automationActionResponses = {
  [HTTP_STATUS_OK]: t.Unknown(),
  [HTTP_STATUS_BAD_REQUEST]: simpleErrorResponseSchema,
  [HTTP_STATUS_NOT_FOUND]: simpleErrorResponseSchema,
  [HTTP_STATUS_CONFLICT]: simpleErrorResponseSchema,
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: simpleErrorResponseSchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: simpleErrorResponseSchema,
  [HTTP_STATUS_TOO_MANY_REQUESTS]: simpleErrorResponseSchema,
} as const;

export const usageTailLimit = AI_CHAT_CONTEXT_TAIL_LIMIT;
