import {
  AUTOMATION_RUN_HISTORY_LIMIT,
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  type AutomationRunStatus,
  type AutomationRunType,
} from "@bao/shared";
import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "../db/client";
import { automationRateLimit } from "../utils/rate-limit";
import { automationRuns } from "../db/schema/automation-runs";
import {
  AutomationConcurrencyLimitError,
  AutomationDependencyMissingError,
  AutomationValidationError,
  applicationAutomationService,
} from "../services/automation/application-automation-service";

const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_CONFLICT = 409;
const HTTP_STATUS_UNPROCESSABLE_ENTITY = 422;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const HTTP_STATUS_SUCCESS = 200;

const [AUTOMATION_TYPE_SCRAPE, AUTOMATION_TYPE_JOB_APPLY, AUTOMATION_TYPE_EMAIL] =
  AUTOMATION_RUN_TYPES;
const [
  AUTOMATION_STATUS_PENDING,
  AUTOMATION_STATUS_RUNNING,
  AUTOMATION_STATUS_SUCCESS,
  AUTOMATION_STATUS_ERROR,
] = AUTOMATION_RUN_STATUSES;
const RUN_ID_MIN_LENGTH = 8;
const EMAIL_RESPONSE_MAX_SUBJECT_LENGTH = 200;
const EMAIL_RESPONSE_MAX_MESSAGE_LENGTH = 12_000;
const EMAIL_RESPONSE_MAX_SENDER_LENGTH = 200;
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
const nullableJsonRecordBodySchema = t.Union([t.Record(t.String(), t.Unknown()), t.Null()]);
type AutomationDbRow = typeof automationRuns.$inferSelect;
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type JsonObject = { [key: string]: JsonValue };

type AutomationRun = {
  id: string;
  type: AutomationRunType;
  status: AutomationRunStatus;
  jobId: string | null;
  userId: string | null;
  input: JsonObject | null;
  output: JsonObject | null;
  screenshots: string[] | null;
  error: string | null;
  progress: number | null;
  currentStep: number | null;
  totalSteps: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

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

type EmailResponseTone = "professional" | "friendly" | "concise";

type EmailResponseRequestBody = {
  subject: string;
  message: string;
  sender?: string;
  tone?: EmailResponseTone;
};

const isAutomationRunType = (value: string): value is AutomationRunType =>
  AUTOMATION_RUN_TYPES.some((runType) => runType === value);

const isAutomationRunStatus = (value: string): value is AutomationRunStatus =>
  AUTOMATION_RUN_STATUSES.some((runStatus) => runStatus === value);

const toJsonValue = (value: unknown): JsonValue | null => {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    const normalizedArray: JsonValue[] = [];
    for (const item of value) {
      const normalizedItem = toJsonValue(item);
      if (normalizedItem === null && item !== null) {
        return null;
      }
      normalizedArray.push(normalizedItem);
    }
    return normalizedArray;
  }
  if (typeof value === "object") {
    const normalizedObject: JsonObject = {};
    for (const [key, entry] of Object.entries(value)) {
      const normalizedEntry = toJsonValue(entry);
      if (normalizedEntry === null && entry !== null) {
        return null;
      }
      normalizedObject[key] = normalizedEntry;
    }
    return normalizedObject;
  }

  return null;
};

const toJsonObject = (value: unknown): JsonObject | null => {
  const normalized = toJsonValue(value);
  return normalized && typeof normalized === "object" && !Array.isArray(normalized)
    ? normalized
    : null;
};

function normalizeAutomationRun(run: AutomationDbRow): AutomationRun {
  return {
    id: run.id,
    type: isAutomationRunType(run.type) ? run.type : AUTOMATION_TYPE_SCRAPE,
    status: isAutomationRunStatus(run.status) ? run.status : AUTOMATION_STATUS_PENDING,
    jobId: run.jobId,
    userId: run.userId,
    input: toJsonObject(run.input),
    output: toJsonObject(run.output),
    screenshots: run.screenshots ?? null,
    error: run.error ?? null,
    progress: run.progress ?? null,
    currentStep: run.currentStep ?? null,
    totalSteps: run.totalSteps ?? null,
    startedAt: run.startedAt ?? null,
    completedAt: run.completedAt ?? null,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

const mapAutomationRouteError = (error: unknown) => {
  if (error instanceof AutomationValidationError) {
    return {
      status: HTTP_STATUS_UNPROCESSABLE_ENTITY,
      message: error.message,
    };
  }
  if (error instanceof AutomationDependencyMissingError) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      message: error.message,
    };
  }
  if (error instanceof AutomationConcurrencyLimitError) {
    return {
      status: HTTP_STATUS_CONFLICT,
      message: error.message,
    };
  }
  return {
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    message: error instanceof Error ? error.message : "Failed to start automation",
  };
};

/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export const automationRoutes = new Elysia({ prefix: "/automation" })
  .use(automationRateLimit)
  .post(
    "/job-apply",
    async ({ body, set }) => {
      try {
        const payload: JobApplyRequestBody = body;
        const runId = await applicationAutomationService.createJobApplyRun(payload);

        void applicationAutomationService.runJobApply(runId, payload).catch((error) => {
          console.error(`[automation] job-apply execution failed for runId=${runId}`, error);
        });

        set.status = HTTP_STATUS_SUCCESS;
        return {
          runId,
          status: AUTOMATION_STATUS_RUNNING,
        };
      } catch (error) {
        const mapped = mapAutomationRouteError(error);
        set.status = mapped.status;
        return {
          error: mapped.message,
        };
      }
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
        [HTTP_STATUS_SUCCESS]: t.Object({
          runId: t.String(),
          status: t.Literal(AUTOMATION_STATUS_RUNNING),
        }),
        [HTTP_STATUS_BAD_REQUEST]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_NOT_FOUND]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_CONFLICT]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Object({
          error: t.String(),
        }),
      },
    },
  )
  .post(
    "/job-apply/schedule",
    async ({ body, set }) => {
      try {
        const payload: ScheduleJobApplyRequestBody = body;
        const { runId, scheduledFor } = await applicationAutomationService.createScheduledJobApplyRun(
          {
            jobUrl: payload.jobUrl,
            resumeId: payload.resumeId,
            ...(payload.coverLetterId ? { coverLetterId: payload.coverLetterId } : {}),
            ...(payload.jobId ? { jobId: payload.jobId } : {}),
            ...(payload.customAnswers ? { customAnswers: payload.customAnswers } : {}),
          },
          payload.runAt,
        );

        set.status = HTTP_STATUS_SUCCESS;
        return {
          runId,
          status: AUTOMATION_STATUS_PENDING,
          scheduledFor,
        };
      } catch (error) {
        const mapped = mapAutomationRouteError(error);
        set.status = mapped.status;
        return {
          error: mapped.message,
        };
      }
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
        [HTTP_STATUS_SUCCESS]: t.Object({
          runId: t.String(),
          status: t.Literal(AUTOMATION_STATUS_PENDING),
          scheduledFor: t.String(),
        }),
        [HTTP_STATUS_BAD_REQUEST]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_NOT_FOUND]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_CONFLICT]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Object({
          error: t.String(),
        }),
      },
    },
  )
  .post(
    "/email-response",
    async ({ body, set }) => {
      try {
        const payload: EmailResponseRequestBody = body;
        const result = await applicationAutomationService.runEmailResponse(payload);
        set.status = HTTP_STATUS_SUCCESS;
        return result;
      } catch (error) {
        const mapped = mapAutomationRouteError(error);
        set.status = mapped.status;
        return {
          error: mapped.message,
        };
      }
    },
    {
      body: t.Object({
        subject: t.String({ minLength: 1, maxLength: EMAIL_RESPONSE_MAX_SUBJECT_LENGTH }),
        message: t.String({ minLength: 1, maxLength: EMAIL_RESPONSE_MAX_MESSAGE_LENGTH }),
        sender: t.Optional(t.String({ minLength: 1, maxLength: EMAIL_RESPONSE_MAX_SENDER_LENGTH })),
        tone: t.Optional(EMAIL_RESPONSE_TONE_SCHEMA),
      }),
      response: {
        [HTTP_STATUS_SUCCESS]: t.Object({
          runId: t.String(),
          status: t.Literal(AUTOMATION_STATUS_SUCCESS),
          reply: t.String(),
          provider: t.String(),
          model: t.String(),
        }),
        [HTTP_STATUS_BAD_REQUEST]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_NOT_FOUND]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_CONFLICT]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_UNPROCESSABLE_ENTITY]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_INTERNAL_SERVER_ERROR]: t.Object({
          error: t.String(),
        }),
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

      const runner =
        filterConditions.length > 0
          ? db
              .select()
              .from(automationRuns)
              .where(and(...filterConditions))
              .orderBy(desc(automationRuns.createdAt))
              .limit(AUTOMATION_RUN_HISTORY_LIMIT)
          : db
              .select()
              .from(automationRuns)
              .orderBy(desc(automationRuns.createdAt))
              .limit(AUTOMATION_RUN_HISTORY_LIMIT);

      const rows = await runner;
      return rows.map(normalizeAutomationRun);
    },
    {
      response: t.Array(
        t.Object({
          id: t.String(),
          type: AUTOMATION_TYPE_SCHEMA,
          status: AUTOMATION_STATUS_SCHEMA,
          jobId: t.Nullable(t.String()),
          userId: t.Nullable(t.String()),
          input: nullableJsonRecordBodySchema,
          output: nullableJsonRecordBodySchema,
          screenshots: t.Nullable(t.Array(t.String())),
          error: t.Nullable(t.String()),
          progress: t.Nullable(t.Number()),
          currentStep: t.Nullable(t.Number()),
          totalSteps: t.Nullable(t.Number()),
          startedAt: t.Nullable(t.String()),
          completedAt: t.Nullable(t.String()),
          createdAt: t.String(),
          updatedAt: t.String(),
        }),
      ),
      query: t.Object({
        type: t.Optional(AUTOMATION_TYPE_SCHEMA),
        status: t.Optional(AUTOMATION_STATUS_SCHEMA),
      }),
    },
  )
  .get(
    "/runs/:id",
    async ({ params, set }) => {
      if (params.id.length < RUN_ID_MIN_LENGTH || !/^[0-9a-fA-F-]+$/.test(params.id)) {
        set.status = HTTP_STATUS_BAD_REQUEST;
        return {
          error: "Invalid run ID format",
        };
      }

      const result = await db
        .select()
        .from(automationRuns)
        .where(eq(automationRuns.id, params.id))
        .limit(1);
      if (result.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return {
          error: "Run not found",
        };
      }
      set.status = HTTP_STATUS_SUCCESS;
      return normalizeAutomationRun(result[0]);
    },
    {
      params: t.Object({
        id: t.String({ minLength: RUN_ID_MIN_LENGTH, pattern: "^[0-9a-fA-F-]+$" }),
      }),
      response: {
        [HTTP_STATUS_BAD_REQUEST]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_NOT_FOUND]: t.Object({
          error: t.String(),
        }),
        [HTTP_STATUS_SUCCESS]: t.Object({
          id: t.String(),
          type: AUTOMATION_TYPE_SCHEMA,
          status: AUTOMATION_STATUS_SCHEMA,
          jobId: t.Nullable(t.String()),
          userId: t.Nullable(t.String()),
          input: nullableJsonRecordBodySchema,
          output: nullableJsonRecordBodySchema,
          screenshots: t.Nullable(t.Array(t.String())),
          error: t.Nullable(t.String()),
          progress: t.Nullable(t.Number()),
          currentStep: t.Nullable(t.Number()),
          totalSteps: t.Nullable(t.Number()),
          startedAt: t.Nullable(t.String()),
          completedAt: t.Nullable(t.String()),
          createdAt: t.String(),
          updatedAt: t.String(),
        }),
      },
    },
  );
