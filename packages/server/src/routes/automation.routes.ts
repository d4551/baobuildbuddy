import {
  AUTOMATION_SCRAPE_TARGETS,
  AUTOMATION_RUN_HISTORY_LIMIT,
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  type AutomationScrapeTarget,
  type EmailResponseRequest,
  API_ERROR_AUTOMATION_PAYLOAD_VALIDATION_FAILED,
  API_ERROR_AUTOMATION_RUN_NOT_FOUND,
  HTTP_STATUS_BAD_REQUEST,
  API_ERROR_INVALID_RUN_ID,
  API_ERROR_RUN_NOT_FOUND,
  API_ERROR_SCHEDULED_RUN_NOT_FOUND,
  HTTP_STATUS_CONFLICT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
  jsonObjectSchema,
  type RpaRunExecutionEnvelope,
  rpaRunErrorCodeSchema,
  rpaRunExecutionEnvelopeSchema,
  RUN_ID_MIN_LENGTH,
  RUN_ID_SAFE_PATTERN_SOURCE,
  SCHEMA_MAX_LENGTH_EMAIL,
  SCHEMA_MAX_LENGTH_EMAIL_MESSAGE,
  SCHEMA_MAX_LENGTH_SHORT,
  settle,
} from "@bao/shared";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { mapAutomationRouteError, toRouteError } from "../utils/automation-route-error";
import { createServerLogger } from "../utils/logger";
import { automationRateLimit } from "../utils/rate-limit";

const RUN_ID_PATTERN = new RegExp(RUN_ID_SAFE_PATTERN_SOURCE);

const [AUTOMATION_TYPE_SCRAPE, AUTOMATION_TYPE_JOB_APPLY, AUTOMATION_TYPE_EMAIL] =
  AUTOMATION_RUN_TYPES;
const [AUTOMATION_SCRAPE_TARGET_STUDIOS, AUTOMATION_SCRAPE_TARGET_JOBS_HITMARKER] =
  AUTOMATION_SCRAPE_TARGETS;
const [
  AUTOMATION_STATUS_PENDING,
  AUTOMATION_STATUS_RUNNING,
  AUTOMATION_STATUS_SUCCESS,
  AUTOMATION_STATUS_ERROR,
] = AUTOMATION_RUN_STATUSES;

const automationRoutesLogger = createServerLogger("automation-routes");

const AUTOMATION_TYPE_SCHEMA = t.Union([
  t.Literal(AUTOMATION_TYPE_SCRAPE),
  t.Literal(AUTOMATION_TYPE_JOB_APPLY),
  t.Literal(AUTOMATION_TYPE_EMAIL),
]);
const AUTOMATION_STATUS_SCHEMA = t.Union([
  t.Literal(AUTOMATION_STATUS_PENDING),
  t.Literal(AUTOMATION_STATUS_RUNNING),
  t.Literal(AUTOMATION_STATUS_SUCCESS),
  t.Literal(AUTOMATION_STATUS_ERROR),
]);
const EMAIL_RESPONSE_TONE_SCHEMA = t.Union([
  t.Literal("professional"),
  t.Literal("friendly"),
  t.Literal("concise"),
]);
const SCRAPE_TARGET_SCHEMA = t.Union([
  t.Literal(AUTOMATION_SCRAPE_TARGET_STUDIOS),
  t.Literal(AUTOMATION_SCRAPE_TARGET_JOBS_HITMARKER),
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
const automationRunEnvelopeBodySchema = t.Object({
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

const routeErrorBodySchema = t.Object({
  error: t.Object({
    code: t.String({ minLength: 1 }),
    message: t.String({ minLength: 1 }),
    details: t.Optional(t.Record(t.String(), t.Unknown())),
  }),
});

type AutomationDbRow = typeof automationRuns.$inferSelect;
type AutomationJsonObject = NonNullable<RpaRunExecutionEnvelope["input"]>;
type JobApplyRequestBody = {
  jobUrl: string;
  resumeId: string;
  coverLetterId?: string;
  jobId?: string;
  customAnswers?: Record<string, string>;
};
type ScheduleJobApplyRequestBody = JobApplyRequestBody & {
  runAt: string;
};
type ScheduleEmailResponseRequestBody = EmailResponseRequest & {
  runAt: string;
};
type ScheduleScrapeRequestBody = {
  target: AutomationScrapeTarget;
  runAt: string;
};

const isAutomationRunType = (value: string): value is (typeof AUTOMATION_RUN_TYPES)[number] =>
  AUTOMATION_RUN_TYPES.some((runType) => runType === value);

const isAutomationRunStatus = (value: string): value is (typeof AUTOMATION_RUN_STATUSES)[number] =>
  AUTOMATION_RUN_STATUSES.some((runStatus) => runStatus === value);

const toJsonObject = (value: unknown): AutomationJsonObject | null => {
  const parsed = jsonObjectSchema.safeParse(value);
  if (parsed.success) {
    return parsed.data;
  }
  return null;
};

const toBooleanFlag = (value: unknown): boolean => value === true || value === 1 || value === "1";

const normalizeRunError = (value: unknown): RpaRunExecutionEnvelope["error"] => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const code = "code" in value && typeof value.code === "string" ? value.code.trim() : "";
  const message =
    "message" in value && typeof value.message === "string" ? value.message.trim() : "";
  const parsedCode = rpaRunErrorCodeSchema.safeParse(code);
  const source =
    "source" in value && typeof value.source === "string" && value.source.trim().length > 0
      ? value.source.trim()
      : "automation-routes";

  if (!(parsedCode.success && message)) {
    return null;
  }

  const details = "details" in value ? toJsonObject(value.details) : undefined;

  return {
    code: parsedCode.data,
    message,
    source,
    ...(details ? { details } : {}),
  };
};

const normalizeAutomationRun = (run: AutomationDbRow): RpaRunExecutionEnvelope => {
  const normalizedCandidate = {
    id: run.id,
    type: isAutomationRunType(run.type) ? run.type : AUTOMATION_TYPE_SCRAPE,
    status: isAutomationRunStatus(run.status) ? run.status : AUTOMATION_STATUS_PENDING,
    jobId: run.jobId,
    userId: run.userId,
    input: toJsonObject(run.input),
    output: toJsonObject(run.output),
    screenshots: run.screenshots ?? null,
    error: normalizeRunError(run.error),
    progress: run.progress ?? null,
    currentStep: run.currentStep ?? null,
    totalSteps: run.totalSteps ?? null,
    startedAt: run.startedAt ?? null,
    completedAt: run.completedAt ?? null,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    exitCode: run.exitCode ?? null,
    timedOut: toBooleanFlag(run.timedOut),
    aborted: toBooleanFlag(run.aborted),
    executionMs: run.executionMs ?? null,
  } satisfies RpaRunExecutionEnvelope;

  const parsed = rpaRunExecutionEnvelopeSchema.safeParse(normalizedCandidate);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    ...normalizedCandidate,
    status: AUTOMATION_STATUS_ERROR,
    error: {
      code: "OUTPUT_VALIDATION_ERROR",
      message: API_ERROR_AUTOMATION_PAYLOAD_VALIDATION_FAILED,
      source: "automation-routes",
      details: {
        issueCount: parsed.error.issues.length,
      },
    },
  };
};

const readAutomationRunById = async (runId: string): Promise<RpaRunExecutionEnvelope | null> => {
  const rows = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
  if (rows.length === 0) {
    return null;
  }
  return normalizeAutomationRun(rows[0]);
};

const runJobApplyInBackground = (runId: string, payload: JobApplyRequestBody): void => {
  applicationAutomationService.runJobApply(runId, payload).then(
    () => undefined,
    (error: unknown) => {
      automationRoutesLogger.error(
        `[automation] job-apply execution failed for runId=${runId}`,
        error,
      );
    },
  );
};

/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export const automationRoutes = new Elysia({ prefix: "/automation", tags: ["Automation"] })
  .use(automationRateLimit)
  .post(
    "/job-apply",
    async ({ body, set }) => {
      const payload: JobApplyRequestBody = body;
      const createRunResult = await settle(applicationAutomationService.createJobApplyRun(payload));
      if (createRunResult.status === "rejected") {
        const mapped = mapAutomationRouteError(createRunResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const runId = createRunResult.value;
      runJobApplyInBackground(runId, payload);

      const run = await readAutomationRunById(runId);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_AUTOMATION_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: t.Object({
        jobUrl: t.String({ minLength: 1, error: "Job URL is required" }),
        resumeId: t.String({ minLength: 1 }),
        coverLetterId: t.Optional(t.String({ minLength: 1 })),
        jobId: t.Optional(t.String({ minLength: 1 })),
        customAnswers: t.Optional(t.Record(t.String(), t.String())),
      }),
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    },
  )
  .post(
    "/job-apply/schedule",
    async ({ body, set }) => {
      const payload: ScheduleJobApplyRequestBody = body;
      const scheduleResult = await settle(
        applicationAutomationService.createScheduledJobApplyRun(
          {
            jobUrl: payload.jobUrl,
            resumeId: payload.resumeId,
            ...(payload.coverLetterId ? { coverLetterId: payload.coverLetterId } : {}),
            ...(payload.jobId ? { jobId: payload.jobId } : {}),
            ...(payload.customAnswers ? { customAnswers: payload.customAnswers } : {}),
          },
          payload.runAt,
        ),
      );
      if (scheduleResult.status === "rejected") {
        const mapped = mapAutomationRouteError(scheduleResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const run = await readAutomationRunById(scheduleResult.value.runId);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: t.Object({
        jobUrl: t.String({ minLength: 1, error: "Job URL is required" }),
        resumeId: t.String({ minLength: 1 }),
        coverLetterId: t.Optional(t.String({ minLength: 1 })),
        jobId: t.Optional(t.String({ minLength: 1 })),
        customAnswers: t.Optional(t.Record(t.String(), t.String())),
        runAt: t.String({ minLength: 1 }),
      }),
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    },
  )
  .post(
    "/email-response",
    async ({ body, set }) => {
      const payload: EmailResponseRequest = body;
      const emailResponseResult = await settle(
        applicationAutomationService.runEmailResponse(payload),
      );
      if (emailResponseResult.status === "rejected") {
        const mapped = mapAutomationRouteError(emailResponseResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      set.status = HTTP_STATUS_OK;
      return emailResponseResult.value;
    },
    {
      body: t.Object({
        subject: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        message: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
        sender: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        tone: t.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
        recipientEmail: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
        deliverAfterGeneration: t.Optional(t.Boolean()),
      }),
      response: {
        [HTTP_STATUS_OK]: t.Object({
          runId: t.String(),
          status: t.Literal(AUTOMATION_STATUS_SUCCESS),
          reply: t.String(),
          provider: t.String(),
          model: t.String(),
          delivered: t.Boolean(),
          recipientEmail: t.Optional(t.String()),
          deliveredAt: t.Optional(t.String()),
          messageId: t.Optional(t.String()),
        }),
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    },
  )
  .post(
    "/email-response/schedule",
    async ({ body, set }) => {
      const payload: ScheduleEmailResponseRequestBody = body;
      const scheduleResult = await settle(
        applicationAutomationService.createScheduledEmailResponseRun(
          {
            subject: payload.subject,
            message: payload.message,
            ...(payload.sender ? { sender: payload.sender } : {}),
            ...(payload.tone ? { tone: payload.tone } : {}),
            ...(payload.recipientEmail ? { recipientEmail: payload.recipientEmail } : {}),
            ...(payload.deliverAfterGeneration !== undefined
              ? { deliverAfterGeneration: payload.deliverAfterGeneration }
              : {}),
          },
          payload.runAt,
        ),
      );
      if (scheduleResult.status === "rejected") {
        const mapped = mapAutomationRouteError(scheduleResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const run = await readAutomationRunById(scheduleResult.value.runId);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: t.Object({
        subject: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT }),
        message: t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL_MESSAGE }),
        sender: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_SHORT })),
        tone: t.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
        recipientEmail: t.Optional(t.String({ minLength: 1, maxLength: SCHEMA_MAX_LENGTH_EMAIL })),
        deliverAfterGeneration: t.Optional(t.Boolean()),
        runAt: t.String({ minLength: 1 }),
      }),
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    },
  )
  .post(
    "/scrape/schedule",
    async ({ body, set }) => {
      const payload: ScheduleScrapeRequestBody = body;
      const scheduleResult = await settle(
        applicationAutomationService.createScheduledScrapeRun(payload.target, payload.runAt),
      );
      if (scheduleResult.status === "rejected") {
        const mapped = mapAutomationRouteError(scheduleResult.reason);
        set.status = mapped.status;
        return mapped.body;
      }

      const run = await readAutomationRunById(scheduleResult.value.runId);
      if (!run) {
        set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
        return toRouteError("SCRIPT_OUTPUT_INVALID", API_ERROR_SCHEDULED_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      body: t.Object({
        target: SCRAPE_TARGET_SCHEMA,
        runAt: t.String({ minLength: 1 }),
      }),
      response: {
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_CONFLICT]: routeErrorBodySchema,
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: routeErrorBodySchema,
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: routeErrorBodySchema,
      },
    },
  )
  .get(
    "/runs",
    async ({ query }) => {
      const filterConditions = [];
      if (query.type) {
        filterConditions.push(eq(automationRuns.type, query.type));
      }
      if (query.status) {
        filterConditions.push(eq(automationRuns.status, query.status));
      }

      const rows =
        filterConditions.length > 0
          ? await db
              .select()
              .from(automationRuns)
              .where(and(...filterConditions))
              .orderBy(desc(automationRuns.createdAt))
              .limit(AUTOMATION_RUN_HISTORY_LIMIT)
          : await db
              .select()
              .from(automationRuns)
              .orderBy(desc(automationRuns.createdAt))
              .limit(AUTOMATION_RUN_HISTORY_LIMIT);

      return rows.map(normalizeAutomationRun);
    },
    {
      response: t.Array(automationRunEnvelopeBodySchema),
      query: t.Object({
        type: t.Optional(AUTOMATION_TYPE_SCHEMA),
        status: t.Optional(AUTOMATION_STATUS_SCHEMA),
      }),
    },
  )
  .get(
    "/runs/:id",
    async ({ params, set }) => {
      if (params.id.length < RUN_ID_MIN_LENGTH || !RUN_ID_PATTERN.test(params.id)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_INVALID_RUN_ID);
      }

      const run = await readAutomationRunById(params.id);
      if (!run) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return toRouteError("OUTPUT_VALIDATION_ERROR", API_ERROR_RUN_NOT_FOUND);
      }

      set.status = HTTP_STATUS_OK;
      return run;
    },
    {
      params: t.Object({
        id: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: RUN_ID_SAFE_PATTERN_SOURCE }),
      }),
      response: {
        [HTTP_STATUS_BAD_REQUEST]: routeErrorBodySchema,
        [HTTP_STATUS_NOT_FOUND]: routeErrorBodySchema,
        [HTTP_STATUS_OK]: automationRunEnvelopeBodySchema,
      },
    },
  );
