import {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  AUTOMATION_SCRAPE_TARGETS,
  type AutomationScrapeTarget,
} from "@bao/shared/constants/automation";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import {
  RUN_ID_MIN_LENGTH,
  RUN_ID_SAFE_PATTERN_SOURCE,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_EMAIL_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import Type from "baobox";

const [AUTOMATION_TYPE_SCRAPE, AUTOMATION_TYPE_JOB_APPLY, AUTOMATION_TYPE_EMAIL] =
  AUTOMATION_RUN_TYPES;
const [
  AUTOMATION_STATUS_PENDING,
  AUTOMATION_STATUS_RUNNING,
  AUTOMATION_STATUS_SUCCESS,
  AUTOMATION_STATUS_ERROR,
] = AUTOMATION_RUN_STATUSES;
const [
  SCRAPE_TARGET_STUDIOS,
  SCRAPE_TARGET_HITMARKER,
  SCRAPE_TARGET_GRACKLE,
  SCRAPE_TARGET_WORKWITHINDIES,
  SCRAPE_TARGET_REMOTEGAMEJOBS,
  SCRAPE_TARGET_GAMESJOBSDIRECT,
  SCRAPE_TARGET_POCKETGAMER,
] = AUTOMATION_SCRAPE_TARGETS;

export type AutomationJsonObject = NonNullable<RpaRunExecutionEnvelope["input"]>;
export type JobApplyRequestBody = {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers?: Record<string, string>;
};
export type RunScrapeRequestBody = {
  target: AutomationScrapeTarget;
};
export type ScheduleJobApplyRequestBody = JobApplyRequestBody & {
  runAt: string;
};
export type ScheduleEmailResponseRequestBody = EmailResponseRequest & {
  runAt: string;
};
export type ScheduleScrapeRequestBody = {
  target: AutomationScrapeTarget;
  runAt: string;
};

export const RUN_ID_PATTERN = new RegExp(RUN_ID_SAFE_PATTERN_SOURCE);

export const AUTOMATION_TYPE_SCHEMA = Type.Union([
  Type.Literal(AUTOMATION_TYPE_SCRAPE),
  Type.Literal(AUTOMATION_TYPE_JOB_APPLY),
  Type.Literal(AUTOMATION_TYPE_EMAIL),
]);
export const AUTOMATION_STATUS_SCHEMA = Type.Union([
  Type.Literal(AUTOMATION_STATUS_PENDING),
  Type.Literal(AUTOMATION_STATUS_RUNNING),
  Type.Literal(AUTOMATION_STATUS_SUCCESS),
  Type.Literal(AUTOMATION_STATUS_ERROR),
]);
export const EMAIL_RESPONSE_TONE_SCHEMA = Type.Union([
  Type.Literal("professional"),
  Type.Literal("friendly"),
  Type.Literal("concise"),
]);
export const SCRAPE_TARGET_SCHEMA = Type.Union([
  Type.Literal(SCRAPE_TARGET_STUDIOS),
  Type.Literal(SCRAPE_TARGET_HITMARKER),
  Type.Literal(SCRAPE_TARGET_GRACKLE),
  Type.Literal(SCRAPE_TARGET_WORKWITHINDIES),
  Type.Literal(SCRAPE_TARGET_REMOTEGAMEJOBS),
  Type.Literal(SCRAPE_TARGET_GAMESJOBSDIRECT),
  Type.Literal(SCRAPE_TARGET_POCKETGAMER),
]);

const nullableJsonRecordBodySchema = Type.Union([
  Type.Record(Type.String(), Type.Unknown()),
  Type.Null(),
]);
const nullableRunErrorSchema = Type.Union([
  Type.String({ minLength: 1 }),
  Type.Object({
    code: Type.String({ minLength: 1 }),
    message: Type.String({ minLength: 1 }),
    source: Type.String({ minLength: 1 }),
    details: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  }),
  Type.Null(),
]);

export const automationRunEnvelopeBodySchema = Type.Object({
  id: Type.String(),
  type: AUTOMATION_TYPE_SCHEMA,
  status: AUTOMATION_STATUS_SCHEMA,
  jobId: Type.Union([Type.String(), Type.Null()]),
  userId: Type.Union([Type.String(), Type.Null()]),
  input: nullableJsonRecordBodySchema,
  output: Type.Union([nullableJsonRecordBodySchema, Type.Null()]),
  screenshots: Type.Union([Type.Array(Type.String()), Type.Null()]),
  error: nullableRunErrorSchema,
  progress: Type.Union([Type.Number(), Type.Null()]),
  currentStep: Type.Union([Type.Number(), Type.Null()]),
  totalSteps: Type.Union([Type.Number(), Type.Null()]),
  startedAt: Type.Union([Type.String(), Type.Null()]),
  completedAt: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  exitCode: Type.Union([Type.Number(), Type.Null()]),
  timedOut: Type.Boolean(),
  aborted: Type.Boolean(),
  executionMs: Type.Union([Type.Number(), Type.Null()]),
});

export const routeErrorBodySchema = Type.Object({
  error: Type.Object({
    code: Type.String({ minLength: 1 }),
    message: Type.String({ minLength: 1 }),
    details: Type.Optional(Type.Record(Type.String(), Type.Unknown())),
  }),
});

export const capabilityAuditEntryBodySchema = Type.Object({
  id: Type.String({ minLength: 1 }),
  category: Type.Union([Type.Literal("job_apply"), Type.Literal("scrape")]),
  name: Type.String({ minLength: 1 }),
  target: Type.Union([SCRAPE_TARGET_SCHEMA, Type.Null()]),
  implemented: Type.Boolean(),
  configured: Type.Boolean(),
  enabled: Type.Boolean(),
  manualRunAvailable: Type.Boolean(),
  scheduledRunAvailable: Type.Boolean(),
  runHistoryAvailable: Type.Boolean(),
  liveUpdatesAvailable: Type.Boolean(),
  issues: Type.Array(Type.String({ minLength: 1 })),
});

export const capabilityAuditReportBodySchema = Type.Object({
  generatedAt: Type.String({ minLength: 1 }),
  summary: Type.Object({
    total: Type.Number(),
    configured: Type.Number(),
    manualRunAvailable: Type.Number(),
    scheduledRunAvailable: Type.Number(),
    runHistoryAvailable: Type.Number(),
    liveUpdatesAvailable: Type.Number(),
  }),
  capabilities: Type.Array(capabilityAuditEntryBodySchema),
});

export const automationRouteErrorResponses = {
  [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
  [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
  [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
};

export const jobApplyBodySchema = Type.Object(
  {
    jobUrl: Type.String({ minLength: 1 }),
    resumeId: Type.String({ minLength: 1 }),
    coverLetterId: Type.Optional(Type.String({ minLength: 1 })),
    jobId: Type.Optional(Type.String({ minLength: 1 })),
    customAnswers: Type.Optional(Type.Record(Type.String(), Type.String())),
  },
  { required: ["jobUrl", "resumeId"] },
);

export const scheduledJobApplyBodySchema = Type.Object(
  {
    jobUrl: Type.String({ minLength: 1 }),
    resumeId: Type.String({ minLength: 1 }),
    coverLetterId: Type.Optional(Type.String({ minLength: 1 })),
    jobId: Type.Optional(Type.String({ minLength: 1 })),
    customAnswers: Type.Optional(Type.Record(Type.String(), Type.String())),
    runAt: Type.String({ minLength: 1 }),
  },
  { required: ["jobUrl", "resumeId", "runAt"] },
);

export const emailResponseBodySchema = Type.Object(
  {
    subject: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    message: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
    sender: Type.Optional(Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    tone: Type.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
    recipientEmail: Type.Optional(
      Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL }),
    ),
    deliverAfterGeneration: Type.Optional(Type.Boolean()),
  },
  { required: ["subject", "message"] },
);

export const scheduledEmailResponseBodySchema = Type.Object(
  {
    subject: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    message: Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
    sender: Type.Optional(Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    tone: Type.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
    recipientEmail: Type.Optional(
      Type.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL }),
    ),
    deliverAfterGeneration: Type.Optional(Type.Boolean()),
    runAt: Type.String({ minLength: 1 }),
  },
  { required: ["subject", "message", "runAt"] },
);

export const scrapeBodySchema = Type.Object(
  {
    target: SCRAPE_TARGET_SCHEMA,
  },
  { required: ["target"] },
);

export const scheduledScrapeBodySchema = Type.Object(
  {
    target: SCRAPE_TARGET_SCHEMA,
    runAt: Type.String({ minLength: 1 }),
  },
  { required: ["target", "runAt"] },
);

export const automationRunQuerySchema = Type.Object({
  type: Type.Optional(AUTOMATION_TYPE_SCHEMA),
  status: Type.Optional(AUTOMATION_STATUS_SCHEMA),
});

export const automationRunIdParamsSchema = Type.Object(
  {
    id: Type.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
  },
  { required: ["id"] },
);

export {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  AUTOMATION_STATUS_ERROR,
  AUTOMATION_STATUS_PENDING,
  AUTOMATION_STATUS_SUCCESS,
};
