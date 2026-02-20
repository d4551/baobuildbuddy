import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { db } from "../db/client";
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

const AUTOMATION_TYPES = ["scrape", "job_apply", "email"] as const;
const AUTOMATION_STATUSES = ["pending", "running", "success", "error"] as const;
const RUN_ID_MIN_LENGTH = 8;
const AUTOMATION_TYPE_SCHEMA = t.Union([
  t.Literal("scrape"),
  t.Literal("job_apply"),
  t.Literal("email"),
]);
const AUTOMATION_STATUS_SCHEMA = t.Union([
  t.Literal("pending"),
  t.Literal("running"),
  t.Literal("success"),
  t.Literal("error"),
]);
type AutomationRunType = (typeof AUTOMATION_TYPES)[number];
type AutomationRunStatus = (typeof AUTOMATION_STATUSES)[number];
type AutomationDbRow = typeof automationRuns.$inferSelect;

type AutomationRun = {
  id: string;
  type: AutomationRunType;
  status: AutomationRunStatus;
  jobId: string | null;
  userId: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
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

function normalizeAutomationRun(run: AutomationDbRow): AutomationRun {
  return {
    id: run.id,
    type: run.type as AutomationRunType,
    status: run.status as AutomationRunStatus,
    jobId: run.jobId,
    userId: run.userId,
    input: run.input ?? null,
    output: run.output ?? null,
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
  .post(
    "/job-apply",
    async ({ body, set }) => {
      try {
        const payload = body as JobApplyRequestBody;
        const runId = await applicationAutomationService.createJobApplyRun(payload);

        void applicationAutomationService.runJobApply(runId, payload).catch((error) => {
          console.error(`[automation] job-apply execution failed for runId=${runId}`, error);
        });

        set.status = HTTP_STATUS_SUCCESS;
        return {
          runId,
          status: "running",
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
          status: t.Literal("running"),
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
              .limit(50)
          : db.select().from(automationRuns).orderBy(desc(automationRuns.createdAt)).limit(50);

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
          input: t.Nullable(t.Record(t.String(), t.Any())),
          output: t.Nullable(t.Any()),
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
          input: t.Nullable(t.Record(t.String(), t.Any())),
          output: t.Nullable(t.Any()),
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
