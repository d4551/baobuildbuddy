import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { coverLetters } from "../db/schema/cover-letters";
import { gamification } from "../db/schema/gamification";
import { interviewSessions } from "../db/schema/interviews";
import { applications, savedJobs } from "../db/schema/jobs";
import { portfolioProjects, portfolios } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { skillMappings } from "../db/schema/skill-mappings";
import { userProfile } from "../db/schema/user";
import { DATA_EXPORT_VERSION } from "./data-service-contracts";
import type { BaoExportData } from "./data-service-contracts";
import { resolveProfileId } from "./data-service-parsers";

const REDACTED_SETTING_KEYS = [
  "geminiApiKey",
  "openaiApiKey",
  "claudeApiKey",
  "huggingfaceToken",
  "emailTransportPassword",
] as const satisfies readonly (keyof typeof settings.$inferSelect)[];

const redactSettings = (value: typeof settings.$inferSelect | undefined): unknown => {
  if (!value) return null;
  const safeSettings = { ...value };
  for (const key of REDACTED_SETTING_KEYS) {
    if (safeSettings[key]) {
      safeSettings[key] = "***REDACTED***";
    }
  }
  return safeSettings;
};

/**
 * Export all user data as JSON.
 * API keys are redacted for security.
 */
export const exportAllData = async (): Promise<BaoExportData> => {
  const profileRows = await db
    .select()
    .from(userProfile)
    .where(eq(userProfile.id, resolveProfileId()));
  const settingsRows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
  const allResumes = await db.select().from(resumes);
  const allCoverLetters = await db.select().from(coverLetters);
  const allPortfolios = await db.select().from(portfolios);
  const allProjects = await db.select().from(portfolioProjects);
  const allInterviews = await db.select().from(interviewSessions);
  const gamRows = await db
    .select()
    .from(gamification)
    .where(eq(gamification.id, resolveProfileId()));
  const allSkills = await db.select().from(skillMappings);
  const allSaved = await db.select().from(savedJobs);
  const allApps = await db.select().from(applications);
  const allChat = await db.select().from(chatHistory);

  return {
    version: DATA_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: profileRows[0] || null,
    settings: redactSettings(settingsRows[0]),
    resumes: allResumes,
    coverLetters: allCoverLetters,
    portfolio: allPortfolios[0] || null,
    portfolioProjects: allProjects,
    interviewSessions: allInterviews,
    gamification: gamRows[0] || null,
    skillMappings: allSkills,
    savedJobs: allSaved,
    applications: allApps,
    chatHistory: allChat,
  };
};
