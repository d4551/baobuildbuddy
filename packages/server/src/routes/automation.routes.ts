import { and, desc, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";

import { generateId } from "@bao/shared";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { applicationAutomationService } from "../services/automation/application-automation-service";

const HTTP_STATUS_NOT_FOUND = 404;

/**
 * Automation API routes for RPA-driven workflows and run history.
 */
export const automationRoutes = new Elysia({ prefix: "/automation" })
  .post(
    "/job-apply",
    async ({ body, set }) => {
      const runId = generateId();
      const now = new Date().toISOString();

      await db.insert(automationRuns).values({
        id: runId,
        type: "job_apply",
        status: "running",
        jobId: body.jobId || null,
        userId: null,
        input: body as unknown as Record<string, unknown>,
        createdAt: now,
        updatedAt: now,
      });

      applicationAutomationService.runJobApply(runId, body).catch(async (error) => {
        await db
          .update(automationRuns)
          .set({ status: "error", error: error instanceof Error ? error.message : "Unknown error", updatedAt: new Date().toISOString() })
          .where(eq(automationRuns.id, runId));
      });

      return { runId, status: "running" };
    },
    {
      body: t.Object({
        jobUrl: t.String({ minLength: 1, error: "Job URL is required" }),
        resumeId: t.String(),
        coverLetterId: t.Optional(t.String()),
        jobId: t.Optional(t.String()),
        customAnswers: t.Optional(t.Record(t.String(), t.String())),
      }),
    },
  )
  .get("/runs", async ({ query }) => {
    const filterConditions = [];
    if (query.type) {
      filterConditions.push(eq(automationRuns.type, query.type));
    }
    if (query.status) {
      filterConditions.push(eq(automationRuns.status, query.status));
    }

    const runner = filterConditions.length > 0
      ? db
          .select()
          .from(automationRuns)
          .where(and(...filterConditions))
          .orderBy(desc(automationRuns.createdAt))
          .limit(50)
      : db.select().from(automationRuns).orderBy(desc(automationRuns.createdAt)).limit(50);

    return await runner;
  }, {
    query: t.Object({
      type: t.Optional(t.String()),
      status: t.Optional(t.String()),
    }),
  })
  .get("/runs/:id", async ({ params, set }) => {
    const result = await db.select().from(automationRuns).where(eq(automationRuns.id, params.id)).limit(1);
    if (result.length === 0) {
      set.status = HTTP_STATUS_NOT_FOUND;
      return { error: "Run not found" };
    }
    return result[0];
  }, {
    params: t.Object({
      id: t.String(),
    }),
  });
