import { API_ERROR_APPLICATION_NOT_FOUND } from "@bao/shared/constants/api-errors";
import type { Job } from "@bao/shared/types/jobs";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { applications, jobs } from "../../db/schema/jobs";
import { dbRowToJob } from "./job-aggregator-mappers";

export const applyToJob = async (jobId: string, notes?: string): Promise<string> => {
  const applicationId = crypto.randomUUID();
  const appliedDate = new Date().toISOString();

  await db.insert(applications).values({
    id: applicationId,
    jobId,
    status: "applied",
    appliedDate,
    notes: notes || "",
    timeline: [
      {
        id: crypto.randomUUID(),
        type: "applied",
        date: appliedDate,
        description: "Application submitted",
      },
    ],
  });

  return applicationId;
};

export const getApplications = async (): Promise<
  Array<typeof applications.$inferSelect & { job: Job }>
> => {
  const result = await db
    .select({
      application: applications,
      job: jobs,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.appliedDate));

  return result.map((row) => ({
    ...row.application,
    job: dbRowToJob(row.job),
  }));
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: string,
  note?: string,
): Promise<void> => {
  const app = await db
    .select()
    .from(applications)
    .where(eq(applications.id, applicationId))
    .limit(1);

  if (app.length === 0) {
    throw new Error(API_ERROR_APPLICATION_NOT_FOUND);
  }

  const timeline = app[0].timeline || [];
  const normalizedStatus = status.trim() || "applied";
  timeline.push({
    id: crypto.randomUUID(),
    type: normalizedStatus,
    date: new Date().toISOString(),
    description: note || `Status changed to ${normalizedStatus}`,
  });

  await db
    .update(applications)
    .set({
      status,
      timeline,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(applications.id, applicationId));
};
