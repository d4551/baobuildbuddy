import { desc } from "drizzle-orm";
import { db } from "../../db/client";
import { jobs } from "../../db/schema/jobs";

export const needsRefresh = async (cacheExpiry: number): Promise<boolean> => {
  const result = await db
    .select({ updatedAt: jobs.updatedAt })
    .from(jobs)
    .orderBy(desc(jobs.updatedAt))
    .limit(1);

  if (result.length === 0) {
    return true;
  }

  const lastUpdate = new Date(result[0].updatedAt).getTime();
  return Date.now() - lastUpdate > cacheExpiry;
};

export const getJobStats = async (): Promise<{
  total: number;
  bySource: Record<string, number>;
  byExperienceLevel: Record<string, number>;
  remoteCount: number;
  lastUpdated: string | null;
}> => {
  const allJobs = await db.select().from(jobs);
  const bySource: Record<string, number> = {};
  const byExperienceLevel: Record<string, number> = {};
  let remoteCount = 0;

  for (const job of allJobs) {
    const source = job.source || "Unknown";
    bySource[source] = (bySource[source] || 0) + 1;

    if (job.experienceLevel) {
      byExperienceLevel[job.experienceLevel] = (byExperienceLevel[job.experienceLevel] || 0) + 1;
    }

    if (job.remote) {
      remoteCount += 1;
    }
  }

  const lastUpdated =
    allJobs.length > 0
      ? allJobs.reduce(
          (latest, job) => (new Date(job.updatedAt) > new Date(latest) ? job.updatedAt : latest),
          allJobs[0].updatedAt,
        )
      : null;

  return {
    total: allJobs.length,
    bySource,
    byExperienceLevel,
    remoteCount,
    lastUpdated,
  };
};
