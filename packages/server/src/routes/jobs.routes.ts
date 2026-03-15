import {
  DECIMAL_RADIX,
  AI_DEFAULT_TEMPERATURE,
  API_ERROR_APPLICATION_NOT_FOUND,
  API_ERROR_JOB_NOT_FOUND,
  API_ERROR_UNKNOWN,
  DEFAULT_UNSPECIFIED_LABEL,
  API_MESSAGE_ALREADY_APPLIED,
  API_MESSAGE_JOB_ALREADY_SAVED,
  API_MESSAGE_JOB_REFRESH_COMPLETE,
  AI_MAX_TOKENS_MATCH,
  generateId,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
  JOB_DEFAULT_RECOMMENDATION_REASON,
  JOB_DEFAULT_RECOMMENDATION_SCORE,
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_QUERY_DEFAULT_LIMIT,
  JOB_QUERY_DEFAULT_PAGE,
  JOB_QUERY_MAX_LIMIT,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
  ROUTE_GAMIFICATION_XP,
  SCHEMA_MAX_LENGTH_DESCRIPTION,
  SCHEMA_MAX_LENGTH_ID,
  SCHEMA_MAX_LENGTH_LABEL,
  SCHEMA_MAX_LENGTH_SHORT,
  SCHEMA_MAX_LENGTH_TINY,
  safeParseJson,
  settle,
} from "@bao/shared";
import { and, desc, eq, like, or } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { applications, jobs, savedJobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { gamificationService } from "../services/gamification-service";
import { JobAggregator } from "../services/jobs/job-aggregator";
import { createServerLogger } from "../utils/logger";

type JobRecommendationMatch = {
  jobIndex: number;
  matchScore: number;
  matchReason: string;
};

type JobRow = typeof jobs.$inferSelect;
type UserProfileRow = typeof userProfile.$inferSelect;
type JobListQuery = {
  q?: string;
  location?: string;
  remote?: string;
  experienceLevel?: string;
  studioType?: string;
  platform?: string;
  genre?: string;
  page?: string;
  limit?: string;
};
type JobRecommendation = JobRow & {
  matchScore: number;
  matchReason: string;
  rank: number;
};
type JobRecommendationsResponse = {
  recommendations: JobRecommendation[];
  reason: string;
  aiPowered: boolean;
  provider?: string;
};

const jobsRoutesLogger = createServerLogger("jobs-routes");
const RECOMMENDATION_JSON_REGEX = /\[[\s\S]*\]/;

function isJobRecommendationMatch(value: unknown): value is JobRecommendationMatch {
  return (
    typeof value === "object" &&
    value !== null &&
    "jobIndex" in value &&
    typeof value.jobIndex === "number" &&
    Number.isFinite(value.jobIndex) &&
    "matchScore" in value &&
    typeof value.matchScore === "number" &&
    Number.isFinite(value.matchScore) &&
    "matchReason" in value &&
    typeof value.matchReason === "string"
  );
}

const toRecentPostingRecommendations = (recentJobs: JobRow[]): JobRecommendation[] => {
  return recentJobs.map((job, index) => ({
    ...job,
    matchScore: JOB_DEFAULT_RECOMMENDATION_SCORE,
    matchReason: JOB_DEFAULT_RECOMMENDATION_REASON,
    rank: index + 1,
  }));
};

const toFallbackRecommendations = (
  recentJobs: JobRow[],
  reason: string,
): JobRecommendationsResponse => ({
  recommendations: toRecentPostingRecommendations(recentJobs),
  reason,
  aiPowered: false,
});

const buildRecommendationPrompt = (profile: UserProfileRow, recentJobs: JobRow[]): string => {
  const userSkills = [...(profile.technicalSkills || []), ...(profile.softSkills || [])].join(", ");
  const userExperience =
    profile.currentRole && profile.currentCompany
      ? `${profile.currentRole} at ${profile.currentCompany}`
      : profile.summary || "Gaming professional";
  const userGoals =
    typeof profile.careerGoals === "object" && profile.careerGoals !== null
      ? JSON.stringify(profile.careerGoals)
      : "Career growth in gaming industry";
  const jobsSummary = recentJobs
    .map(
      (job, idx) =>
        `Job ${idx + 1}: ${job.title} at ${job.company} - ${job.location} - ${job.experienceLevel || DEFAULT_UNSPECIFIED_LABEL}`,
    )
    .join("\n");

  return `You are a career matching AI assistant. Analyze these jobs against the user profile and score each job from 0-100 based on match quality.

User Profile:
- Skills: ${userSkills || DEFAULT_UNSPECIFIED_LABEL}
- Experience: ${userExperience}
- Career Goals: ${userGoals}
- Years of Experience: ${profile.yearsExperience || DEFAULT_UNSPECIFIED_LABEL}

Available Jobs:
${jobsSummary}

Return a JSON array with match analysis for each job. Format:
[
  {
    "jobIndex": 0,
    "matchScore": 85,
    "matchReason": "Strong skills alignment with technical requirements"
  }
]

Provide realistic scores based on skills match, experience level alignment, and career goals fit.`;
};

const parseRecommendationMatches = (responseContent: string): JobRecommendationMatch[] => {
  const jsonMatch = responseContent.match(RECOMMENDATION_JSON_REGEX);
  if (!jsonMatch) return [];
  const parsed = safeParseJson(jsonMatch[0]);
  return Array.isArray(parsed) ? parsed.filter(isJobRecommendationMatch) : [];
};

const mapRecommendationMatches = (
  recentJobs: JobRow[],
  matches: JobRecommendationMatch[],
): JobRecommendation[] => {
  return matches
    .map((match) => {
      const job = recentJobs[match.jobIndex];
      if (!job) return null;
      return {
        ...job,
        matchScore: match.matchScore,
        matchReason: match.matchReason,
        rank: 0,
      };
    })
    .filter((job): job is JobRecommendation => job !== null)
    .sort((a, b) => b.matchScore - a.matchScore)
    .map((job, index) => ({
      ...job,
      rank: index + 1,
    }));
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

const listJobs = async (query: JobListQuery) => {
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

const getRecommendations = async (): Promise<JobRecommendationsResponse> => {
  const profileRows = await db.select().from(userProfile).limit(1);
  const profile = profileRows[0];
  const recentJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.postedDate))
    .limit(JOB_QUERY_DEFAULT_LIMIT);
  if (!profile || recentJobs.length === 0) {
    return toFallbackRecommendations(
      recentJobs,
      profile ? "No jobs available" : "Create your profile for personalized recommendations",
    );
  }

  const settingsResult = await settle(db.select().from(settings).limit(1));
  if (settingsResult.status === "rejected") {
    jobsRoutesLogger.error("Job recommendations error:", settingsResult.reason);
    const details =
      settingsResult.reason instanceof Error ? settingsResult.reason.message : API_ERROR_UNKNOWN;
    return toFallbackRecommendations(recentJobs, `Error generating recommendations: ${details}`);
  }

  const aiService = AIService.fromSettings(settingsResult.value[0]);
  const response = await aiService.generate(buildRecommendationPrompt(profile, recentJobs), {
    temperature: AI_DEFAULT_TEMPERATURE,
    maxTokens: AI_MAX_TOKENS_MATCH,
  });
  if (response.error) {
    return toFallbackRecommendations(recentJobs, `AI recommendations failed: ${response.error}`);
  }

  const matches = parseRecommendationMatches(response.content);
  if (matches.length === 0) {
    return toFallbackRecommendations(recentJobs, "AI analysis completed but no matches found");
  }

  return {
    recommendations: mapRecommendationMatches(recentJobs, matches),
    reason: "AI-powered personalized job recommendations",
    aiPowered: true,
    provider: response.provider,
  };
};

export const jobsRoutes = new Elysia({ prefix: "/jobs" })
  .get("/", async ({ query }) => listJobs(query), {
    query: t.Object({
      q: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
      location: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_SHORT })),
      remote: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
      experienceLevel: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
      studioType: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
      platform: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
      genre: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
      page: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
      limit: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_TINY })),
    }),
  })
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await db.select().from(jobs).where(eq(jobs.id, params.id));
      if (rows.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_JOB_NOT_FOUND };
      }
      return rows[0];
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
    },
  )
  .post(
    "/save",
    async ({ body, set }) => {
      const { jobId } = body;

      // Check if job exists
      const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (jobRows.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_JOB_NOT_FOUND };
      }

      // Check if already saved
      const existing = await db.select().from(savedJobs).where(eq(savedJobs.jobId, jobId));
      if (existing.length > 0) {
        return { message: API_MESSAGE_JOB_ALREADY_SAVED, saved: existing[0] };
      }

      const newSaved = {
        id: generateId(),
        jobId,
        savedAt: new Date().toISOString(),
      };

      await db.insert(savedJobs).values(newSaved);
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "jobsSaved",
        ROUTE_GAMIFICATION_XP.jobsSaved,
        "job_saved",
      );
      return newSaved;
    },
    {
      body: t.Object({
        jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
    },
  )
  .delete(
    "/save/:jobId",
    async ({ params }) => {
      const result = await db.delete(savedJobs).where(eq(savedJobs.jobId, params.jobId));
      return { success: true, deleted: result };
    },
    {
      params: t.Object({
        jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
    },
  )
  .get("/saved", async () => {
    const saved = await db
      .select({
        id: savedJobs.id,
        jobId: savedJobs.jobId,
        savedAt: savedJobs.savedAt,
        job: jobs,
      })
      .from(savedJobs)
      .leftJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .orderBy(desc(savedJobs.savedAt));

    return saved;
  })
  .post(
    "/apply",
    async ({ body, set }) => {
      const { jobId, notes = "" } = body;

      // Check if job exists
      const jobRows = await db.select().from(jobs).where(eq(jobs.id, jobId));
      if (jobRows.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_JOB_NOT_FOUND };
      }

      // Check if already applied
      const existing = await db.select().from(applications).where(eq(applications.jobId, jobId));
      if (existing.length > 0) {
        return { message: API_MESSAGE_ALREADY_APPLIED, application: existing[0] };
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
      set.status = HTTP_STATUS_CREATED;
      gamificationService.trackActionFireAndForget(
        "jobApplications",
        ROUTE_GAMIFICATION_XP.jobApplications,
        "job_applied",
      );
      return newApplication;
    },
    {
      body: t.Object({
        jobId: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
        notes: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
      }),
    },
  )
  .put(
    "/apply/:id",
    async ({ params, body, set }) => {
      const { status: newStatus, notes } = body;

      const existing = await db.select().from(applications).where(eq(applications.id, params.id));
      if (existing.length === 0) {
        set.status = HTTP_STATUS_NOT_FOUND;
        return { error: API_ERROR_APPLICATION_NOT_FOUND };
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

      await db.update(applications).set(updates).where(eq(applications.id, params.id));

      const updated = await db.select().from(applications).where(eq(applications.id, params.id));
      return updated[0];
    },
    {
      params: t.Object({
        id: t.String({ maxLength: SCHEMA_MAX_LENGTH_ID }),
      }),
      body: t.Object({
        status: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_LABEL })),
        notes: t.Optional(t.String({ maxLength: SCHEMA_MAX_LENGTH_DESCRIPTION })),
      }),
    },
  )
  .get("/applications", async () => {
    const apps = await db
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

    return apps;
  })
  .get("/recommendations", async () => {
    return getRecommendations();
  })
  .post("/refresh", async ({ set }) => {
    const aggregator = new JobAggregator();
    const refreshResult = await settle(aggregator.refreshJobs());
    if (refreshResult.status === "rejected") {
      jobsRoutesLogger.error("Job refresh error:", refreshResult.reason);
      set.status = HTTP_STATUS_INTERNAL_SERVER_ERROR;
      return {
        message: `Job refresh failed: ${refreshResult.reason instanceof Error ? refreshResult.reason.message : API_ERROR_UNKNOWN}`,
        status: "failed",
        totalJobs: 0,
        newJobs: 0,
        updatedJobs: 0,
      };
    }

    return {
      message: API_MESSAGE_JOB_REFRESH_COMPLETE,
      status: "completed",
      totalJobs: refreshResult.value.total,
      newJobs: refreshResult.value.new,
      updatedJobs: refreshResult.value.updated,
    };
  });

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((entry) => entry === value);
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsedValue = Number.parseInt(value, DECIMAL_RADIX);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }
  return parsedValue;
}
