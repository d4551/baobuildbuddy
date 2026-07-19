import { API_ERROR_AUTOMATION_PAYLOAD_VALIDATION_FAILED } from "@bao/shared/constants/api-errors";
import { AUTOMATION_RUN_HISTORY_LIMIT } from "@bao/shared/constants/automation-limits";
import { rpaRunErrorCodeSchema } from "@bao/shared/schemas/error-envelope.schema";
import { jsonObjectSchema } from "@bao/shared/schemas/json.schema";
import {
  type RpaRunExecutionEnvelope,
  rpaRunExecutionEnvelopeSchema,
} from "@bao/shared/schemas/rpa-events.schema";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { resumes } from "../db/schema/resumes";
import { applicationAutomationService } from "../services/automation/application-automation-service";
import { createServerLogger } from "../utils/logger";
import type { AutomationJsonObject, JobApplyRequestBody } from "./automation-route-contracts";
import {
  AUTOMATION_RUN_STATUSES,
  AUTOMATION_RUN_TYPES,
  AUTOMATION_STATUS_ERROR,
  AUTOMATION_STATUS_PENDING,
} from "./automation-route-contracts";

type AutomationDbRow = typeof automationRuns.$inferSelect;

const automationRoutesLogger = createServerLogger("automation-routes");
const AUTOMATION_VERIFY_RESUME_ID = "automation-verify-resume";

const isAutomationRunType = (value: string): value is (typeof AUTOMATION_RUN_TYPES)[number] =>
  AUTOMATION_RUN_TYPES.some((runType) => runType === value);

const isAutomationRunStatus = (value: string): value is (typeof AUTOMATION_RUN_STATUSES)[number] =>
  AUTOMATION_RUN_STATUSES.some((runStatus) => runStatus === value);

const toJsonObject = (value: JsonValue | null | undefined): AutomationJsonObject | null => {
  const parsed = jsonObjectSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  return parsed.data;
};

const toBooleanFlag = (value: JsonValue | null | undefined): boolean =>
  value === true || value === 1 || value === "1";

const detailsFromErrorObject = (value: JsonObject): AutomationJsonObject | null => {
  if (!("details" in value)) {
    return null;
  }
  return toJsonObject(value.details);
};

const normalizeRunError = (
  value: JsonValue | string | null | undefined,
): RpaRunExecutionEnvelope["error"] => {
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

  const details = detailsFromErrorObject(value);
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
    type: isAutomationRunType(run.type) ? run.type : AUTOMATION_RUN_TYPES[0],
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

export const readAutomationRunById = async (
  runId: string,
): Promise<RpaRunExecutionEnvelope | null> => {
  const rows = await db.select().from(automationRuns).where(eq(automationRuns.id, runId)).limit(1);
  return rows[0] ? normalizeAutomationRun(rows[0]) : null;
};

export const listAutomationRuns = async (query: {
  type?: (typeof AUTOMATION_RUN_TYPES)[number];
  status?: (typeof AUTOMATION_RUN_STATUSES)[number];
}) => {
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
};

export const ensureAutomationVerifyContext = async (): Promise<{ resumeId: string }> => {
  const timestamp = new Date().toISOString();
  await db
    .insert(resumes)
    .values({
      id: AUTOMATION_VERIFY_RESUME_ID,
      name: "Automation Verify Resume",
      personalInfo: {
        name: "Automation Verify Candidate",
        email: "verify@example.test",
        location: "Remote",
        portfolio: "https://example.test/portfolio",
      },
      summary:
        "Deterministic packaged-runtime verification resume used for end-to-end automation validation.",
      experience: [
        {
          title: "Gameplay Engineer",
          company: "Bao Verify Studio",
          location: "Remote",
          startDate: "2024-01",
          endDate: "",
          current: true,
          description:
            "Built deterministic automation flows, packaging checks, and UI verification systems.",
        },
      ],
      education: [],
      skills: {
        technical: ["TypeScript", "Bun", "Playwright"],
      },
      projects: [],
      gamingExperience: {
        roles: ["Raid Leader"],
      },
      updatedAt: timestamp,
    })
    .onConflictDoUpdate({
      target: resumes.id,
      set: {
        name: "Automation Verify Resume",
        updatedAt: timestamp,
      },
    });

  return { resumeId: AUTOMATION_VERIFY_RESUME_ID };
};

export const runJobApplyInBackground = (runId: string, payload: JobApplyRequestBody): void => {
  applicationAutomationService.runJobApply(runId, payload).then(
    () => undefined,
    (error) => {
      automationRoutesLogger.error(
        `[automation] job-apply execution failed for runId=${runId}`,
        error instanceof Error ? error.message : String(error),
      );
    },
  );
};
