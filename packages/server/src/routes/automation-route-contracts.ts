import {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  AUTOMATION_SCRAPE_TARGETS,
  type AutomationScrapeTarget,
  type EmailResponseRequest,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  type RpaRunExecutionEnvelope,
  RUN_ID_MIN_LENGTH,
  RUN_ID_SAFE_PATTERN_SOURCE,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_EMAIL_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared";
import { t } from "elysia";

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

export const AUTOMATION_TYPE_SCHEMA = t.Union([
  t.Literal(AUTOMATION_TYPE_SCRAPE),
  t.Literal(AUTOMATION_TYPE_JOB_APPLY),
  t.Literal(AUTOMATION_TYPE_EMAIL),
]);
export const AUTOMATION_STATUS_SCHEMA = t.Union([
  t.Literal(AUTOMATION_STATUS_PENDING),
  t.Literal(AUTOMATION_STATUS_RUNNING),
  t.Literal(AUTOMATION_STATUS_SUCCESS),
  t.Literal(AUTOMATION_STATUS_ERROR),
]);
export const EMAIL_RESPONSE_TONE_SCHEMA = t.Union([
  t.Literal("professional"),
  t.Literal("friendly"),
  t.Literal("concise"),
]);
export const SCRAPE_TARGET_SCHEMA = t.Union([
  t.Literal(SCRAPE_TARGET_STUDIOS),
  t.Literal(SCRAPE_TARGET_HITMARKER),
  t.Literal(SCRAPE_TARGET_GRACKLE),
  t.Literal(SCRAPE_TARGET_WORKWITHINDIES),
  t.Literal(SCRAPE_TARGET_REMOTEGAMEJOBS),
  t.Literal(SCRAPE_TARGET_GAMESJOBSDIRECT),
  t.Literal(SCRAPE_TARGET_POCKETGAMER),
]);

const nullableJsonRecordBodySchema = t.Union([t.Record(t.String(), t.Unknown()), t.Null()]);
const nullableRunErrorSchema = t.Union([
  t.String({ minLength: 1 }),
  t.Object({
    code: t.String({ minLength: 1 }),
    message: t.String({ minLength: 1 }),
    source: t.String({ minLength: 1 }),
    details: t.Optional(t.Record(t.String(), t.Unknown())),
  }),
  t.Null(),
]);

export const automationRunEnvelopeBodySchema = t.Object({
  id: t.String(),
  type: AUTOMATION_TYPE_SCHEMA,
  status: AUTOMATION_STATUS_SCHEMA,
  jobId: t.Nullable(t.String()),
  userId: t.Nullable(t.String()),
  input: nullableJsonRecordBodySchema,
  output: t.Union([nullableJsonRecordBodySchema, t.Null()]),
  screenshots: t.Nullable(t.Array(t.String())),
  error: nullableRunErrorSchema,
  progress: t.Nullable(t.Number()),
  currentStep: t.Nullable(t.Number()),
  totalSteps: t.Nullable(t.Number()),
  startedAt: t.Nullable(t.String()),
  completedAt: t.Nullable(t.String()),
  createdAt: t.String(),
  updatedAt: t.String(),
  exitCode: t.Nullable(t.Number()),
  timedOut: t.Boolean(),
  aborted: t.Boolean(),
  executionMs: t.Nullable(t.Number()),
});

export const routeErrorBodySchema = t.Object({
  error: t.Object({
    code: t.String({ minLength: 1 }),
    message: t.String({ minLength: 1 }),
    details: t.Optional(t.Record(t.String(), t.Unknown())),
  }),
});

export const capabilityAuditEntryBodySchema = t.Object({
  id: t.String({ minLength: 1 }),
  category: t.Union([t.Literal("job_apply"), t.Literal("scrape")]),
  name: t.String({ minLength: 1 }),
  target: t.Union([SCRAPE_TARGET_SCHEMA, t.Null()]),
  implemented: t.Boolean(),
  configured: t.Boolean(),
  enabled: t.Boolean(),
  manualRunAvailable: t.Boolean(),
  scheduledRunAvailable: t.Boolean(),
  runHistoryAvailable: t.Boolean(),
  liveUpdatesAvailable: t.Boolean(),
  issues: t.Array(t.String({ minLength: 1 })),
});

export const capabilityAuditReportBodySchema = t.Object({
  generatedAt: t.String({ minLength: 1 }),
  summary: t.Object({
    total: t.Number(),
    configured: t.Number(),
    manualRunAvailable: t.Number(),
    scheduledRunAvailable: t.Number(),
    runHistoryAvailable: t.Number(),
    liveUpdatesAvailable: t.Number(),
  }),
  capabilities: t.Array(capabilityAuditEntryBodySchema),
});

export const automationRouteErrorResponses = {
  [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
  [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
  [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
  [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
  [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
};

export const jobApplyBodySchema = t.Object({
  jobUrl: t.String({ minLength: 1, error: "Job URL is required" }),
  resumeId: t.String({ minLength: 1 }),
  coverLetterId: t.Optional(t.String({ minLength: 1 })),
  jobId: t.Optional(t.String({ minLength: 1 })),
  customAnswers: t.Optional(t.Record(t.String(), t.String())),
});

export const scheduledJobApplyBodySchema = t.Object({
  jobUrl: t.String({ minLength: 1, error: "Job URL is required" }),
  resumeId: t.String({ minLength: 1 }),
  coverLetterId: t.Optional(t.String({ minLength: 1 })),
  jobId: t.Optional(t.String({ minLength: 1 })),
  customAnswers: t.Optional(t.Record(t.String(), t.String())),
  runAt: t.String({ minLength: 1 }),
});

export const emailResponseBodySchema = t.Object({
  subject: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  message: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
  sender: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  tone: t.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
  recipientEmail: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
  deliverAfterGeneration: t.Optional(t.Boolean()),
});

export const scheduledEmailResponseBodySchema = t.Object({
  subject: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
  message: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
  sender: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
  tone: t.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
  recipientEmail: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
  deliverAfterGeneration: t.Optional(t.Boolean()),
  runAt: t.String({ minLength: 1 }),
});

export const scrapeBodySchema = t.Object({
  target: SCRAPE_TARGET_SCHEMA,
});

export const scheduledScrapeBodySchema = t.Object({
  target: SCRAPE_TARGET_SCHEMA,
  runAt: t.String({ minLength: 1 }),
});

export const automationRunQuerySchema = t.Object({
  type: t.Optional(AUTOMATION_TYPE_SCHEMA),
  status: t.Optional(AUTOMATION_STATUS_SCHEMA),
});

export const automationRunIdParamsSchema = t.Object({
  id: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
});

export {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  AUTOMATION_STATUS_ERROR,
  AUTOMATION_STATUS_PENDING,
  AUTOMATION_STATUS_SUCCESS,
};
