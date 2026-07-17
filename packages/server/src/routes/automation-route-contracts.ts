import type { Static } from "typebox";
import {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  AUTOMATION_SCRAPE_TARGETS,
  type AutomationScrapeTarget,
  RPA_CAPABILITY_ISSUE_CODES,
} from "@bao/shared/constants/automation";
import {
  RUN_ID_MIN_LENGTH,
  RUN_ID_SAFE_PATTERN_SOURCE,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_EMAIL_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
} from "@bao/shared/constants/schema-limits";
import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import { t } from "elysia";

export { routeErrorBodySchema } from "./route-error-envelope";

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

const nullableJsonRecordBodySchema = t.Union([
  t.Record(t.String(), t.Unknown()),
  t.Null(),
]);
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
  jobId: t.Union([t.String(), t.Null()]),
  userId: t.Union([t.String(), t.Null()]),
  input: nullableJsonRecordBodySchema,
  output: t.Union([nullableJsonRecordBodySchema, t.Null()]),
  screenshots: t.Union([t.Array(t.String()), t.Null()]),
  error: nullableRunErrorSchema,
  progress: t.Union([t.Number(), t.Null()]),
  currentStep: t.Union([t.Number(), t.Null()]),
  totalSteps: t.Union([t.Number(), t.Null()]),
  startedAt: t.Union([t.String(), t.Null()]),
  completedAt: t.Union([t.String(), t.Null()]),
  createdAt: t.String(),
  updatedAt: t.String(),
  exitCode: t.Union([t.Number(), t.Null()]),
  timedOut: t.Boolean(),
  aborted: t.Boolean(),
  executionMs: t.Union([t.Number(), t.Null()]),
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
  issues: t.Array(
    t.Object({
      code: t.Union(RPA_CAPABILITY_ISSUE_CODES.map((code) => t.Literal(code))),
      portalId: t.Optional(t.String({ minLength: 1 })),
      portalName: t.Optional(t.String({ minLength: 1 })),
    }),
  ),
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

};

export const jobApplyBodySchema = t.Object(
  {
    jobUrl: t.String({ minLength: 1 }),
    resumeId: t.String({ minLength: 1 }),
    coverLetterId: t.Optional(t.String({ minLength: 1 })),
    jobId: t.Optional(t.String({ minLength: 1 })),
    customAnswers: t.Optional(t.Record(t.String(), t.String())),
  },
  { required: ["jobUrl", "resumeId"] },
);
export type JobApplyBody = Static<typeof jobApplyBodySchema>;

export const scheduledJobApplyBodySchema = t.Object(
  {
    jobUrl: t.String({ minLength: 1 }),
    resumeId: t.String({ minLength: 1 }),
    coverLetterId: t.Optional(t.String({ minLength: 1 })),
    jobId: t.Optional(t.String({ minLength: 1 })),
    customAnswers: t.Optional(t.Record(t.String(), t.String())),
    runAt: t.String({ minLength: 1 }),
  },
  { required: ["jobUrl", "resumeId", "runAt"] },
);
export type ScheduledJobApplyBody = Static<typeof scheduledJobApplyBodySchema>;

export const emailResponseBodySchema = t.Object(
  {
    subject: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    message: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
    sender: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    tone: t.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
    recipientEmail: t.Optional(
      t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL }),
    ),
    deliverAfterGeneration: t.Optional(t.Boolean()),
  },
  { required: ["subject", "message"] },
);
export type EmailResponseBody = Static<typeof emailResponseBodySchema>;

export const scheduledEmailResponseBodySchema = t.Object(
  {
    subject: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
    message: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
    sender: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
    tone: t.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
    recipientEmail: t.Optional(
      t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL }),
    ),
    deliverAfterGeneration: t.Optional(t.Boolean()),
    runAt: t.String({ minLength: 1 }),
  },
  { required: ["subject", "message", "runAt"] },
);
export type ScheduledEmailResponseBody = Static<typeof scheduledEmailResponseBodySchema>;

export const scrapeBodySchema = t.Object(
  {
    target: SCRAPE_TARGET_SCHEMA,
  },
  { required: ["target"] },
);
export type ScrapeBody = Static<typeof scrapeBodySchema>;

export const scheduledScrapeBodySchema = t.Object(
  {
    target: SCRAPE_TARGET_SCHEMA,
    runAt: t.String({ minLength: 1 }),
  },
  { required: ["target", "runAt"] },
);
export type ScheduledScrapeBody = Static<typeof scheduledScrapeBodySchema>;

export const automationRunQuerySchema = t.Object({
  type: t.Optional(AUTOMATION_TYPE_SCHEMA),
  status: t.Optional(AUTOMATION_STATUS_SCHEMA),
});
export type AutomationRunQuery = Static<typeof automationRunQuerySchema>;

export const automationRunIdParamsSchema = t.Object(
  {
    id: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
  },
  { required: ["id"] },
);
export type AutomationRunIdParams = Static<typeof automationRunIdParamsSchema>;

export {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  AUTOMATION_STATUS_ERROR,
  AUTOMATION_STATUS_PENDING,
  AUTOMATION_STATUS_SUCCESS,
};
