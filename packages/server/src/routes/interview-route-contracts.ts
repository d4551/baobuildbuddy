import { SCHEMA_MAX_ITEMS_MEDIUM, SCHEMA_MAX_ITEMS_XLARGE, SCHEMA_MAX_LENGTH_DEVICE, SCHEMA_MAX_LENGTH_ID, SCHEMA_MAX_LENGTH_JOB_DESCRIPTION, SCHEMA_MAX_LENGTH_LONG, SCHEMA_MAX_LENGTH_MESSAGE, SCHEMA_MAX_LENGTH_MICRO, SCHEMA_MAX_LENGTH_SHORT, SCHEMA_MAX_LENGTH_URL } from "@bao/shared/constants/schema-limits";
import type { InterviewConfig, VoiceSettings } from "@bao/shared/types/interview";
import Type from "baobox";

export type CreateSessionConfigInput = Omit<Partial<InterviewConfig>, "voiceSettings"> & {
  voiceSettings?: Partial<VoiceSettings>;
};

export type SessionPayload = Record<string, unknown>;

export type SubmitResponseBody = {
  questionId?: string;
  questionIndex?: number;
  response: string;
};

const interviewModeSchema = Type.Union([Type.Literal("studio"), Type.Literal("job")]);
const interviewConversationStyleSchema = Type.Union([
  Type.Literal("natural"),
  Type.Literal("structured"),
]);

const voiceSettingsSchema = Type.Object({
  microphoneId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  speakerId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  voiceId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  rate: Type.Optional(Type.Number({ minimum: 0.25, maximum: 3 })),
  pitch: Type.Optional(Type.Number({ minimum: 0.5, maximum: 2 })),
  volume: Type.Optional(Type.Number({ minimum: 0, maximum: 2 })),
  language: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_MICRO })),
});

const targetJobSchema = Type.Object(
  {
    id: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_DEVICE }),
    title: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    company: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    location: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_DEVICE }),
    description: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_JOB_DESCRIPTION })),
    requirements: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_URL }), {
        maxItems: SCHEMA_MAX_ITEMS_XLARGE,
      }),
    ),
    technologies: Type.Optional(
      Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE }), {
        maxItems: SCHEMA_MAX_ITEMS_XLARGE,
      }),
    ),
    source: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
    postedDate: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
    url: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_LONG })),
  },
  { required: ["id", "title", "company", "location"] },
);

const candidateContextSchema = Type.Object({
  resumeId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  coverLetterId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  portfolioId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
});

export const sessionConfigSchema = Type.Object({
  roleType: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  roleCategory: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  experienceLevel: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE })),
  focusAreas: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE }), {
      maxItems: SCHEMA_MAX_ITEMS_MEDIUM,
    }),
  ),
  duration: Type.Optional(Type.Integer({ minimum: 5, maximum: 120 })),
  questionCount: Type.Optional(Type.Integer({ minimum: 1, maximum: 20 })),
  includeTechnical: Type.Optional(Type.Boolean()),
  includeBehavioral: Type.Optional(Type.Boolean()),
  includeStudioSpecific: Type.Optional(Type.Boolean()),
  enableVoiceMode: Type.Optional(Type.Boolean()),
  technologies: Type.Optional(
    Type.Array(Type.String({ maxLength: SCHEMA_MAX_LENGTH_DEVICE }), {
      maxItems: SCHEMA_MAX_ITEMS_XLARGE,
    }),
  ),
  voiceSettings: Type.Optional(voiceSettingsSchema),
  interviewMode: Type.Optional(interviewModeSchema),
  conversationStyle: Type.Optional(interviewConversationStyleSchema),
  targetJob: Type.Optional(targetJobSchema),
  candidateContext: Type.Optional(candidateContextSchema),
});

export const createSessionBodySchema = Type.Object({
  studioId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
  config: Type.Optional(sessionConfigSchema),
});

export const interviewSessionParamsSchema = Type.Object(
  {
    id: Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
  },
  { required: ["id"] },
);

export const submitResponseBodySchema = Type.Object(
  {
    questionId: Type.Optional(Type.String({ maxLength: SCHEMA_MAX_LENGTH_ID })),
    questionIndex: Type.Optional(Type.Integer({ minimum: 0 })),
    response: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_MESSAGE }),
  },
  { required: ["response"] },
);
