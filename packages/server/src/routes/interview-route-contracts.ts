import type { Static } from "typebox";
import {
  SCHEMA_MAX_ITEMS_MEDIUM,
  SCHEMA_MAX_ITEMS_XLARGE,
  SCHEMA_MAX_LENGTH_DEVICE,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_JOB_DESCRIPTION,
  SCHEMA_MAX_LENGTH_LONG,
  SCHEMA_MAX_LENGTH_MESSAGE,
  SCHEMA_MAX_LENGTH_MICRO,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_URL,
} from "@bao/shared/constants/schema-limits";
import type { InterviewConfig, VoiceSettings } from "@bao/shared/types/interview";
import { t } from "elysia";

export type CreateSessionConfigInput = Omit<Partial<InterviewConfig>, "voiceSettings"> & {
  voiceSettings?: Partial<VoiceSettings>;
};

export type SessionPayload = Record<string, unknown>;

export type SubmitResponseBody = {
  questionId?: string;
  questionIndex?: number;
  response: string;
};

const interviewModeSchema = t.Union([t.Literal("studio"), t.Literal("job")]);
const interviewConversationStyleSchema = t.Union([
  t.Literal("natural"),
  t.Literal("structured"),
]);

const voiceSettingsSchema = t.Object({
  microphoneId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  speakerId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  voiceId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  rate: t.Optional(t.Number({ minimum: 0.25, maximum: 3 })),
  pitch: t.Optional(t.Number({ minimum: 0.5, maximum: 2 })),
  volume: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
  language: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});

const targetJobSchema = t.Object(
  {
    id: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_DEVICE }),
    title: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    company: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    location: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_DEVICE }),
    description: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_JOB_DESCRIPTION })),
    requirements: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_URL }), {
        maxItems: SCHEMA_MAX_ITEMS_XLARGE,
      }),
    ),
    technologies: t.Optional(
      t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE }), {
        maxItems: SCHEMA_MAX_ITEMS_XLARGE,
      }),
    ),
    source: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
    postedDate: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
    url: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LONG })),
  },
  { required: ["id", "title", "company", "location"] },
);

const candidateContextSchema = t.Object({
  resumeId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  coverLetterId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  portfolioId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export const sessionConfigSchema = t.Object({
  roleType: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  roleCategory: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  experienceLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  focusAreas: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  duration: t.Optional(t.Integer({ minimum: 5, maximum: 120 })),
  questionCount: t.Optional(t.Integer({ minimum: 1, maximum: 20 })),
  includeTechnical: t.Optional(t.Boolean()),
  includeBehavioral: t.Optional(t.Boolean()),
  includeStudioSpecific: t.Optional(t.Boolean()),
  enableVoiceMode: t.Optional(t.Boolean()),
  technologies: t.Optional(
    t.Array(t.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE }), {
      maxItems: SCHEMA_MAX_ITEMS_XLARGE,
    }),
  ),
  voiceSettings: t.Optional(voiceSettingsSchema),
  interviewMode: t.Optional(interviewModeSchema),
  conversationStyle: t.Optional(interviewConversationStyleSchema),
  targetJob: t.Optional(targetJobSchema),
  candidateContext: t.Optional(candidateContextSchema),
});

export const createSessionBodySchema = t.Object({
  studioId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  config: t.Optional(sessionConfigSchema),
});
export type CreateSessionBody = Static<typeof createSessionBodySchema>;

export const interviewSessionParamsSchema = t.Object(
  {
    id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);
export type InterviewSessionParams = Static<typeof interviewSessionParamsSchema>;

export const submitResponseBodySchema = t.Object(
  {
    questionId: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    questionIndex: t.Optional(t.Integer({ minimum: 0 })),
    response: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
  },
  { required: ["response"] },
);
export type SubmitResponseRouteBody = Static<typeof submitResponseBodySchema>;
