import { AI_DEFAULT_TEMPERATURE, AI_MAX_TOKENS_MATCH } from "@bao/shared/constants/ai-generation";
import { API_ERROR_UNKNOWN } from "@bao/shared/constants/api-errors";
import { DEFAULT_UNSPECIFIED_LABEL } from "@bao/shared/constants/default-labels";
import {
  JOB_DEFAULT_RECOMMENDATION_REASON,
  JOB_DEFAULT_RECOMMENDATION_SCORE,
  JOB_QUERY_DEFAULT_LIMIT,
} from "@bao/shared/constants/jobs";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { desc } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { settings } from "../db/schema/settings";
import { userProfile } from "../db/schema/user";
import { AIService } from "../services/ai/ai-service";
import { createServerLogger } from "../utils/logger";

type JobRecommendationMatch = {
  jobIndex: number;
  matchScore: number;
  matchReason: string;
};

type JobRow = typeof jobs.$inferSelect;
type UserProfileRow = typeof userProfile.$inferSelect;
type JobRecommendation = JobRow & {
  matchScore: number;
  matchReason: string;
  rank: number;
};

export type JobRecommendationsResponse = {
  recommendations: JobRecommendation[];
  reason: string;
  aiPowered: boolean;
  provider?: string;
};

const jobsRoutesLogger = createServerLogger("jobs-routes");
const RECOMMENDATION_JSON_REGEX = /\[[\s\S]*\]/;

const isJobRecommendationMatch = (value: unknown): value is JobRecommendationMatch =>
  typeof value === "object" &&
  value !== null &&
  "jobIndex" in value &&
  typeof value.jobIndex === "number" &&
  Number.isFinite(value.jobIndex) &&
  "matchScore" in value &&
  typeof value.matchScore === "number" &&
  Number.isFinite(value.matchScore) &&
  "matchReason" in value &&
  typeof value.matchReason === "string";

const toRecentPostingRecommendations = (recentJobs: JobRow[]): JobRecommendation[] =>
  recentJobs.map((job, index) => ({
    ...job,
    matchScore: JOB_DEFAULT_RECOMMENDATION_SCORE,
    matchReason: JOB_DEFAULT_RECOMMENDATION_REASON,
    rank: index + 1,
  }));

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
): JobRecommendation[] =>
  matches
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

export const getRecommendations = async (): Promise<JobRecommendationsResponse> => {
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
    purpose: "jobMatch",
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
