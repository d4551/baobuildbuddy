import {
  JOB_EXPERIENCE_LEVELS,
  JOB_GAME_GENRES,
  JOB_QUERY_DEFAULT_LIMIT,
  JOB_QUERY_DEFAULT_PAGE,
  JOB_QUERY_MAX_LIMIT,
  JOB_STUDIO_TYPES,
  JOB_SUPPORTED_PLATFORMS,
  generateId,
  safeParseJson,
} from "@bao/shared";
import { and, desc, eq, like, or } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../db/client";
import { applications, jobs, savedJobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { JobAggregator } from "../services/jobs/job-aggregator";
import { createServerLogger } from "../utils/logger";

type JobRecommendationMatch = {
  jobIndex: number;
  matchScore: number;
  matchReason: string;
};

const jobsRoutesLogger = createServerLogger("jobs-routes");

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

export const jobsRoutes = new Elysia({ prefix: "/jobs" })
  .get(
    "/",
    async ({ query }) => {
      const {
        q = "",
        location = "",
        remote,
        experienceLevel,
        studioType,
        platform,
        genre,
        page = String(JOB_QUERY_DEFAULT_PAGE),
        limit = String(JOB_QUERY_DEFAULT_LIMIT),
      } = query;

      const pageNum = parsePositiveInteger(page, JOB_QUERY_DEFAULT_PAGE);
      const requestedLimit = parsePositiveInteger(limit, JOB_QUERY_DEFAULT_LIMIT);
      const limitNum = Math.min(requestedLimit, JOB_QUERY_MAX_LIMIT);
      const offset = (pageNum - 1) * limitNum;

      const conditions = [];

      if (q) {
        conditions.push(
          or(
            like(jobs.title, `%${q}%`),
            like(jobs.company, `%${q}%`),
            like(jobs.description, `%${q}%`),
          ),
        );
      }

      if (location) {
        conditions.push(like(jobs.location, `%${location}%`));
      }

      if (remote === "true") {
        conditions.push(eq(jobs.remote, true));
      }

      if (experienceLevel && isOneOf(JOB_EXPERIENCE_LEVELS, experienceLevel)) {
        conditions.push(eq(jobs.experienceLevel, experienceLevel));
      }

      if (studioType && isOneOf(JOB_STUDIO_TYPES, studioType)) {
        conditions.push(eq(jobs.studioType, studioType));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const results = await db
        .select()
        .from(jobs)
        .where(whereClause)
        .orderBy(desc(jobs.postedDate))
        .limit(limitNum)
        .offset(offset);

      // Filter by platform/genre in memory since they're JSON arrays
      let filtered = results;
      if (platform && isOneOf(JOB_SUPPORTED_PLATFORMS, platform)) {
        filtered = filtered.filter((job) => job.platforms?.includes(platform));
      }
      if (genre && isOneOf(JOB_GAME_GENRES, genre)) {
        filtered = filtered.filter((job) => job.gameGenres?.includes(genre));
      }

      return {
        jobs: filtered,
        page: pageNum,
        limit: limitNum,
        total: filtered.length,
      };
    },
    {
      query: t.Object({
        q: t.Optional(t.String({ maxLength: 200 })),
        location: t.Optional(t.String({ maxLength: 200 })),
        remote: t.Optional(t.String({ maxLength: 10 })),
        experienceLevel: t.Optional(t.String({ maxLength: 50 })),
        studioType: t.Optional(t.String({ maxLength: 50 })),
        platform: t.Optional(t.String({ maxLength: 50 })),
        genre: t.Optional(t.String({ maxLength: 50 })),
        page: t.Optional(t.String({ maxLength: 10 })),
        limit: t.Optional(t.String({ maxLength: 10 })),
      }),
    },
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      const rows = await db.select().from(jobs).where(eq(jobs.id, params.id));
      if (rows.length === 0) {
        set.status = 404;
        return { error: "Job not found" };
      }
      return rows[0];
    },
    {
      params: t.Object({
        id: t.String({ maxLength: 100 }),
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
        set.status = 404;
        return { error: "Job not found" };
      }

      // Check if already saved
      const existing = await db.select().from(savedJobs).where(eq(savedJobs.jobId, jobId));
      if (existing.length > 0) {
        return { message: "Job already saved", saved: existing[0] };
      }

      const newSaved = {
        id: generateId(),
        jobId,
        savedAt: new Date().toISOString(),
      };

      await db.insert(savedJobs).values(newSaved);
      set.status = 201;
      return newSaved;
    },
    {
      body: t.Object({
        jobId: t.String({ maxLength: 100 }),
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
        jobId: t.String({ maxLength: 100 }),
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
        set.status = 404;
        return { error: "Job not found" };
      }

      // Check if already applied
      const existing = await db.select().from(applications).where(eq(applications.jobId, jobId));
      if (existing.length > 0) {
        return { message: "Already applied to this job", application: existing[0] };
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
      set.status = 201;
      return newApplication;
    },
    {
      body: t.Object({
        jobId: t.String({ maxLength: 100 }),
        notes: t.Optional(t.String({ maxLength: 5000 })),
      }),
    },
  )
  .put(
    "/apply/:id",
    async ({ params, body, set }) => {
      const { status: newStatus, notes } = body;

      const existing = await db.select().from(applications).where(eq(applications.id, params.id));
      if (existing.length === 0) {
        set.status = 404;
        return { error: "Application not found" };
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
        id: t.String({ maxLength: 100 }),
      }),
      body: t.Object({
        status: t.Optional(t.String({ maxLength: 50 })),
        notes: t.Optional(t.String({ maxLength: 5000 })),
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
    const profileRows = await db.select().from(userProfile).limit(1);
    const profile = profileRows.length > 0 ? profileRows[0] : null;

    const recentJobs = await db.select().from(jobs).orderBy(desc(jobs.postedDate)).limit(20);

    if (!profile || recentJobs.length === 0) {
      return {
        recommendations: recentJobs.map((job, index) => ({
          ...job,
          matchScore: 50,
          matchReason: "Recent posting",
          rank: index + 1,
        })),
        reason: profile
          ? "No jobs available"
          : "Create your profile for personalized recommendations",
        aiPowered: false,
      };
    }

    return db
      .select()
      .from(settings)
      .limit(1)
      .then(async (settingsRows) => {
        const aiService = AIService.fromSettings(settingsRows[0]);

        const userSkills = [...(profile.technicalSkills || []), ...(profile.softSkills || [])].join(
          ", ",
        );

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
              `Job ${idx + 1}: ${job.title} at ${job.company} - ${job.location} - ${job.experienceLevel || "Not specified"}`,
          )
          .join("\n");

        const prompt = `You are a career matching AI assistant. Analyze these jobs against the user profile and score each job from 0-100 based on match quality.

User Profile:
- Skills: ${userSkills || "Not specified"}
- Experience: ${userExperience}
- Career Goals: ${userGoals}
- Years of Experience: ${profile.yearsExperience || "Not specified"}

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

        const response = await aiService.generate(prompt, {
          temperature: 0.3,
          maxTokens: 1500,
        });

        if (response.error) {
          return {
            recommendations: recentJobs.map((job, index) => ({
              ...job,
              matchScore: 50,
              matchReason: "AI analysis unavailable",
              rank: index + 1,
            })),
            reason: `AI recommendations failed: ${response.error}`,
            aiPowered: false,
          };
        }

        let matchedJobs: JobRecommendationMatch[] = [];

        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = safeParseJson(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            matchedJobs = parsed.filter(isJobRecommendationMatch);
          }
        }

        if (matchedJobs.length === 0) {
          return {
            recommendations: recentJobs.map((job, index) => ({
              ...job,
              matchScore: 50,
              matchReason: "Recent posting",
              rank: index + 1,
            })),
            reason: "AI analysis completed but no matches found",
            aiPowered: false,
          };
        }

        const recommendations = matchedJobs
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
          .filter((job) => job !== null)
          .sort((a, b) => (b?.matchScore || 0) - (a?.matchScore || 0))
          .map((job, index) => ({
            ...job,
            rank: index + 1,
          }));

        return {
          recommendations,
          reason: "AI-powered personalized job recommendations",
          aiPowered: true,
          provider: response.provider,
        };
      })
      .catch((error: unknown) => {
        jobsRoutesLogger.error("Job recommendations error:", error);
        return {
          recommendations: recentJobs.map((job, index) => ({
            ...job,
            matchScore: 50,
            matchReason: "Recent posting",
            rank: index + 1,
          })),
          reason: `Error generating recommendations: ${error instanceof Error ? error.message : "Unknown error"}`,
          aiPowered: false,
        };
      });
  })
  .post("/refresh", async ({ set }) => {
    const aggregator = new JobAggregator();

    return aggregator
      .refreshJobs()
      .then((result) => {
        return {
          message: "Job refresh completed successfully",
          status: "completed",
          totalJobs: result.total,
          newJobs: result.new,
          updatedJobs: result.updated,
        };
      })
      .catch((error: unknown) => {
        jobsRoutesLogger.error("Job refresh error:", error);
        set.status = 500;
        return {
          message: `Job refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          status: "failed",
          totalJobs: 0,
          newJobs: 0,
          updatedJobs: 0,
        };
      });
  });

function isOneOf<T extends string>(values: readonly T[], value: string): value is T {
  return values.some((entry) => entry === value);
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsedValue = Number.parseInt(value, 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 1) {
    return fallback;
  }
  return parsedValue;
}
