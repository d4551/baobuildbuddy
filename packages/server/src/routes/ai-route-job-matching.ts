import { AI_CHAT_RECENT_JOBS_LIMIT } from "@bao/shared/constants/ai-chat";
import { AI_DEFAULT_TEMPERATURE, AI_MAX_TOKENS_CHAT } from "@bao/shared/constants/ai-generation";
import {
  API_MESSAGE_AI_NO_JOBS_FOR_MATCHING,
  API_MESSAGE_JOB_MATCHING_COMPLETE,
} from "@bao/shared/constants/api-messages";
import { DEFAULT_SCORE_NEUTRAL } from "@bao/shared/constants/jobs";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { safeParseJson } from "@bao/shared/utils/json";
import { settle } from "@bao/shared/utils/promise";
import { asNumber, asStringArray, isRecord } from "@bao/shared/utils/type-guards";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { jobs } from "../db/schema/jobs";
import { resumes } from "../db/schema/resumes";
import { userProfile } from "../db/schema/user";
import { jobMatchPrompt } from "../services/ai/prompts-career";
import { createServerLogger } from "../utils/logger";
import { extractResumeSkills } from "./ai-route-content";
import type { MatchJobsResponse } from "./ai-route-contracts";
import { getAIService } from "./ai-route-support";

const aiRoutesJobMatchingLogger = createServerLogger("ai-route-job-matching");

type MatchProfile = {
  userSkills: string[];
  experience: string;
  goals: string;
};

type JobRow = typeof jobs.$inferSelect;

const parseJsonRecord = (jsonString: string): Record<string, unknown> | null => {
  const cleaned = jsonString
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const parsed = safeParseJson(cleaned);
  return isRecord(parsed) ? parsed : null;
};

const createFallbackJobMatch = (job: JobRow) => ({
  jobId: job.id,
  title: job.title,
  company: job.company,
  location: job.location,
  remote: job.remote ?? false,
  score: DEFAULT_SCORE_NEUTRAL,
  strengths: [],
  concerns: [],
  highlightSkills: [],
});

const mergeUniqueSkills = (existing: string[], additional: string[]): string[] => {
  if (additional.length === 0) {
    return existing;
  }
  return [...new Set([...existing, ...additional])];
};

const buildMatchProfile = async (
  skills: string[] | undefined,
  resumeId?: string,
): Promise<MatchProfile> => {
  const profileRows = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
  const profile = profileRows[0];

  let userSkills = skills || [];
  let experience = "";
  let goals = "";

  if (profile) {
    userSkills = skills || [...(profile.technicalSkills || []), ...(profile.softSkills || [])];
    experience = profile.summary || "";
    goals = profile.careerGoals ? JSON.stringify(profile.careerGoals) : "";
  }

  if (!resumeId) {
    return { userSkills, experience, goals };
  }

  const resumeRows = await db.select().from(resumes).where(eq(resumes.id, resumeId));
  const resume = resumeRows[0];
  if (!resume) {
    return { userSkills, experience, goals };
  }

  if (resume.summary) {
    experience = resume.summary;
  }
  userSkills = mergeUniqueSkills(userSkills, extractResumeSkills(resume));
  return { userSkills, experience, goals };
};

const buildJobMatchPromptText = (profile: MatchProfile, job: JobRow): string =>
  `${jobMatchPrompt(
    {
      skills: profile.userSkills,
      experience: profile.experience,
      goals: profile.goals,
    },
    {
      title: job.title,
      company: job.company,
      description: job.description || "",
      requirements: job.requirements || [],
    },
  )}\n\nRespond with a JSON object containing: score (number 0-100), strengths (string[]), concerns (string[]), highlightSkills (string[]).`;

const analyzeSingleJobMatch = async (
  profile: MatchProfile,
  job: JobRow,
): Promise<MatchJobsResponse["matches"][number]> => {
  const aiService = await getAIService();
  const responseResult = await settle(
    aiService.generate(buildJobMatchPromptText(profile, job), {
      purpose: "jobMatch",
      temperature: AI_DEFAULT_TEMPERATURE,
      maxTokens: AI_MAX_TOKENS_CHAT,
    }),
  );
  if (responseResult.status === "rejected") {
    aiRoutesJobMatchingLogger.error(`Failed to analyze job ${job.id}:`, responseResult.reason);
    return createFallbackJobMatch(job);
  }

  const response = responseResult.value;
  if (response.error) {
    return createFallbackJobMatch(job);
  }

  const parsed = parseJsonRecord(response.content);
  return {
    jobId: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    remote: job.remote ?? false,
    score: asNumber(parsed?.score) ?? DEFAULT_SCORE_NEUTRAL,
    strengths: asStringArray(parsed?.strengths),
    concerns: asStringArray(parsed?.concerns),
    highlightSkills: asStringArray(parsed?.highlightSkills),
  };
};

const buildJobMatchRecommendations = (matches: MatchJobsResponse["matches"]): string[] => {
  const topMatch = matches[0];
  if (!topMatch) {
    return [];
  }
  return [
    `Apply to ${topMatch.title} at ${topMatch.company} (${topMatch.score}% match)`,
    ...topMatch.strengths.slice(0, 2),
  ];
};

export const runJobMatchingFlow = async (
  resumeId: string | undefined,
  skills: string[] | undefined,
): Promise<MatchJobsResponse> => {
  const profile = await buildMatchProfile(skills, resumeId);
  const recentJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.postedDate))
    .limit(AI_CHAT_RECENT_JOBS_LIMIT);

  if (recentJobs.length === 0) {
    return {
      message: API_MESSAGE_AI_NO_JOBS_FOR_MATCHING,
      matches: [],
      recommendations: [],
    };
  }

  const matches = await Promise.all(
    recentJobs.slice(0, 5).map((job) => analyzeSingleJobMatch(profile, job)),
  );
  matches.sort((a, b) => b.score - a.score);

  return {
    message: API_MESSAGE_JOB_MATCHING_COMPLETE,
    matches,
    recommendations: buildJobMatchRecommendations(matches),
  };
};
