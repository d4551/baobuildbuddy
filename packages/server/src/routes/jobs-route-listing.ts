import {
  API_ERROR_APPLICATION_NOT_FOUND,
  API_ERROR_JOB_NOT_FOUND,
} from "@bao/shared/constants/api-errors";
import {
  API_MESSAGE_ALREADY_APPLIED,
  API_MESSAGE_JOB_ALREADY_SAVED,
} from "@bao/shared/constants/api-messages";
import { DECIMAL_RADIX } from "@bao/shared/constants/client-config";
import { ROUTE_GAMIFICATION_XP } from "@bao/shared/constants/gamification";
import { HTTP_STATUS_NOT_FOUND } from "@bao/shared/constants/http";
import {
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_QUERY_DEFAULT_LIMIT,
  JOB_QUERY_DEFAULT_PAGE,
  JOB_QUERY_MAX_LIMIT,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
} from "@bao/shared/constants/jobs";
import { generateId } from "@bao/shared/utils/validation";
import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "../db/client";
import { applications, jobs, savedJobs } from "../db/schema/jobs";
import { gamificationService } from "../services/gamification-service";
import type { JobListQuery } from "./jobs-route-contracts";

type JobRow = typeof jobs.$inferSelect;

const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some((entry) => entry === value);

const parsePositiveInteger = (value: string, fallback: number): number => {
  const parsedValue = Number.parseInt(value, DECIMAL_RADIX);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }
  return parsedValue;
};

const buildJobsWhereClause = (query: JobListQuery) => {
  const conditions = [];
  if (query.q) {
    conditions.push(
      or(
        like(jobs.title, `%${query.q}%`),
        like(jobs.company, `%${query.q}%`),
        like(jobs.description, `%${query.q}%`),
      ),
    );
  }
  if (query.location) {
    conditions.push(like(jobs.location, `%${query.location}%`));
  }
  if (query.remote === "true") {
    conditions.push(eq(jobs.remote, true));
  }
  if (query.experienceLevel && isOneOf(JOB_EXPERIENCE_LEVELS, query.experienceLevel)) {
    conditions.push(eq(jobs.experienceLevel, query.experienceLevel));
  }
  if (query.studioType && isOneOf(JOB_STUDIO_TYPES, query.studioType)) {
    conditions.push(eq(jobs.studioType, query.studioType));
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
};

const filterJobsByAttributes = (jobRows: JobRow[], query: JobListQuery): JobRow[] => {
  let filtered = jobRows;
  if (query.platform && isOneOf(JOB_SUPPORTED_PLATFORMS, query.platform)) {
    const platform = query.platform;
    filtered = filtered.filter((job) => job.platforms?.includes(platform));
  }
  if (query.genre && isOneOf(JOB_GAME_GENRES, query.genre)) {
    const genre = query.genre;
    filtered = filtered.filter((job) => job.gameGenres?.includes(genre));
  }
  return filtered;
};

export const listJobs = async (query: JobListQuery) => {
  const pageNum = parsePositiveInteger(
    query.page || String(JOB_QUERY_DEFAULT_PAGE),
    JOB_QUERY_DEFAULT_PAGE,
  );
  const requestedLimit = parsePositiveInteger(
    query.limit || String(JOB_QUERY_DEFAULT_LIMIT),
    JOB_QUERY_DEFAULT_LIMIT,
  );
  const limitNum = Math.min(requestedLimit, JOB_QUERY_MAX_LIMIT);
  const offset = (pageNum - 1) * limitNum;
  const results = await db
    .select()
    .from(jobs)
    .where(buildJobsWhereClause(query))
    .orderBy(desc(jobs.postedDate))
    .limit(limitNum)
    .offset(offset);
  const filtered = filterJobsByAttributes(results, query);

  return {
    jobs: filtered,
    page: pageNum,
    limit: limitNum,
    total: filtered.length,
  };
};

export const getJobById = async (id: string) => {
  const rows = await db.select().from(jobs).where(eq(jobs.id, id));
  return rows[0] ?? null;
};

export const saveJob = async (jobId: string) => {
  const job = await getJobById(jobId);
  if (!job) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: { error: API_ERROR_JOB_NOT_FOUND },
    };
  }

  const existing = await db.select().from(savedJobs).where(eq(savedJobs.jobId, jobId));
  if (existing.length > 0) {
    return {
      status: null,
      body: { message: API_MESSAGE_JOB_ALREADY_SAVED, saved: existing[0] },
    };
  }

  const newSaved = {
    id: generateId(),
    jobId,
    savedAt: new Date().toISOString(),
  };

  await db.insert(savedJobs).values(newSaved);
  gamificationService.trackActionFireAndForget(
    "jobsSaved",
    ROUTE_GAMIFICATION_XP.jobsSaved,
    "job_saved",
  );
  return {
    status: 201,
    body: newSaved,
  };
};

export const deleteSavedJob = async (jobId: string) => {
  const result = await db.delete(savedJobs).where(eq(savedJobs.jobId, jobId));
  return { success: true, deleted: result };
};

export const listSavedJobs = async () =>
  db
    .select({
      id: savedJobs.id,
      jobId: savedJobs.jobId,
      savedAt: savedJobs.savedAt,
      job: jobs,
    })
    .from(savedJobs)
    .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
    .orderBy(desc(savedJobs.savedAt));

export const createApplication = async (jobId: string, notes: string) => {
  const job = await getJobById(jobId);
  if (!job) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: { error: API_ERROR_JOB_NOT_FOUND },
    };
  }

  const existing = await db.select().from(applications).where(eq(applications.jobId, jobId));
  if (existing.length > 0) {
    return {
      status: null,
      body: { message: API_MESSAGE_ALREADY_APPLIED, application: existing[0] },
    };
  }

  const now = new Date().toISOString();
  const newApplication = {
    id: generateId(),
    jobId,
    status: "applied",
    appliedDate: now,
    notes,
    timeline: [
      {
        status: "applied",
        date: now,
        notes: "Application submitted",
      },
    ],
  };

  await db.insert(applications).values(newApplication);
  gamificationService.trackActionFireAndForget(
    "jobApplications",
    ROUTE_GAMIFICATION_XP.jobApplications,
    "job_applied",
  );
  return {
    status: 201,
    body: newApplication,
  };
};

export const updateApplication = async (
  id: string,
  newStatus: string | undefined,
  notes: string | undefined,
) => {
  const existing = await db.select().from(applications).where(eq(applications.id, id));
  if (existing.length === 0) {
    return {
      status: HTTP_STATUS_NOT_FOUND,
      body: { error: API_ERROR_APPLICATION_NOT_FOUND },
    };
  }

  const app = existing[0];
  const timeline = app.timeline || [];

  if (newStatus && newStatus !== app.status) {
    timeline.push({
      status: newStatus,
      date: new Date().toISOString(),
      notes: notes || "",
    });
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
    timeline,
  };

  if (newStatus) updates.status = newStatus;
  if (notes !== undefined) updates.notes = notes;

  await db.update(applications).set(updates).where(eq(applications.id, id));
  const updated = await db.select().from(applications).where(eq(applications.id, id));
  return {
    status: null,
    body: updated[0],
  };
};

export const listApplications = async () =>
  db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      status: applications.status,
      appliedDate: applications.appliedDate,
      notes: applications.notes,
      timeline: applications.timeline,
      createdAt: applications.createdAt,
      updatedAt: applications.updatedAt,
      job: jobs,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.appliedDate));
