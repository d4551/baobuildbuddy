import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { asBoolean, asNumber, asRecord, asString, asStringArray, asUnknownArray, isRecord } from "@bao/shared/utils/type-guards";
import type { chatHistory } from "../db/schema/chat-history";
import type { coverLetters } from "../db/schema/cover-letters";
import type { gamification } from "../db/schema/gamification";
import type { interviewSessions } from "../db/schema/interviews";
import type { portfolioProjects, portfolios } from "../db/schema/portfolios";
import type { resumes } from "../db/schema/resumes";
import { DEFAULT_SETTINGS_ID } from "../db/schema/settings";
import type { skillMappings } from "../db/schema/skill-mappings";

type ResumeInsert = typeof resumes.$inferInsert;
type CoverLetterInsert = typeof coverLetters.$inferInsert;
type PortfolioInsert = typeof portfolios.$inferInsert;
type PortfolioProjectInsert = typeof portfolioProjects.$inferInsert;
type InterviewSessionInsert = typeof interviewSessions.$inferInsert;
type GamificationInsert = typeof gamification.$inferInsert;
type SkillMappingInsert = typeof skillMappings.$inferInsert;
type ChatHistoryInsert = typeof chatHistory.$inferInsert;

const asStringArrayRecord = (value: unknown): Record<string, string[]> | undefined => {
  if (!isRecord(value)) return;
  const result: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) continue;
    result[key] = entry.filter((item): item is string => typeof item === "string");
  }
  return result;
};

export const omitImportMetadata = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([key]) => key !== "id" && key !== "createdAt"));

export const sanitizeImportedSettings = (value: unknown): Record<string, unknown> => {
  const settingsRecord = isRecord(value) ? { ...value } : {};
  const secretKeys = [
    "geminiApiKey",
    "openaiApiKey",
    "claudeApiKey",
    "huggingfaceToken",
    "emailTransportPassword",
  ] as const;
  for (const key of secretKeys) {
    if (settingsRecord[key] === "***REDACTED***") {
      settingsRecord[key] = undefined;
    }
  }
  settingsRecord.id = undefined;
  settingsRecord.createdAt = undefined;
  return settingsRecord;
};

export const parseResumeInsert = (value: unknown): ResumeInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (!id) return null;

  return {
    id,
    name: asString(value.name),
    personalInfo: asRecord(value.personalInfo),
    summary: asString(value.summary),
    experience: asUnknownArray(value.experience) ?? [],
    education: asUnknownArray(value.education) ?? [],
    skills: asRecord(value.skills),
    projects: asUnknownArray(value.projects) ?? [],
    gamingExperience: asRecord(value.gamingExperience),
    template: asString(value.template),
    theme: asString(value.theme),
    isDefault: asBoolean(value.isDefault),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

export const parseCoverLetterInsert = (value: unknown): CoverLetterInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const company = asString(value.company);
  const position = asString(value.position);
  if (!(id && company && position)) return null;

  return {
    id,
    company,
    position,
    jobInfo: asRecord(value.jobInfo),
    content: asRecord(value.content) ?? {},
    template: asString(value.template),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

export const parsePortfolioInsert = (value: unknown): PortfolioInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  if (!id) return null;
  return {
    id,
    metadata: asRecord(value.metadata),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

export const parsePortfolioProjectInsert = (value: unknown): PortfolioProjectInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const portfolioId = asString(value.portfolioId);
  const title = asString(value.title);
  const description = asString(value.description);
  if (!(id && portfolioId && title && description)) return null;

  return {
    id,
    portfolioId,
    title,
    description,
    technologies: asStringArray(value.technologies) ?? [],
    image: asString(value.image),
    liveUrl: asString(value.liveUrl),
    githubUrl: asString(value.githubUrl),
    tags: asStringArray(value.tags) ?? [],
    featured: asBoolean(value.featured),
    role: asString(value.role),
    platforms: Array.isArray(value.platforms) ? asStringArray(value.platforms) : undefined,
    engines: Array.isArray(value.engines) ? asStringArray(value.engines) : undefined,
    sortOrder: asNumber(value.sortOrder),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

export const parseInterviewSessionInsert = (value: unknown): InterviewSessionInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const studioId = asString(value.studioId);
  if (!(id && studioId)) return null;

  return {
    id,
    studioId,
    config: asRecord(value.config),
    questions: asUnknownArray(value.questions) ?? [],
    responses: asUnknownArray(value.responses) ?? [],
    finalAnalysis: asRecord(value.finalAnalysis),
    status: asString(value.status),
    startTime: asNumber(value.startTime),
    endTime: asNumber(value.endTime),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

export const parseGamificationInsert = (value: unknown): GamificationInsert | null => {
  if (!isRecord(value)) return null;
  return {
    id: asString(value.id) ?? DEFAULT_PROFILE_ID,
    xp: asNumber(value.xp),
    level: asNumber(value.level),
    achievements: asStringArray(value.achievements) ?? [],
    dailyChallenges: asStringArrayRecord(value.dailyChallenges),
    longestStreak: asNumber(value.longestStreak),
    currentStreak: asNumber(value.currentStreak),
    lastActiveDate: asString(value.lastActiveDate),
    stats: asRecord(value.stats),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

export const parseSkillMappingInsert = (value: unknown): SkillMappingInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const gameExpression = asString(value.gameExpression);
  const transferableSkill = asString(value.transferableSkill);
  if (!(id && gameExpression && transferableSkill)) return null;

  return {
    id,
    gameExpression,
    transferableSkill,
    industryApplications: asStringArray(value.industryApplications) ?? [],
    evidence: asUnknownArray(value.evidence) ?? [],
    confidence: asNumber(value.confidence),
    category: asString(value.category),
    demandLevel: asString(value.demandLevel),
    aiGenerated: asBoolean(value.aiGenerated),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

export const parseChatHistoryInsert = (value: unknown): ChatHistoryInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const role = asString(value.role);
  const content = asString(value.content);
  const timestamp = asString(value.timestamp);
  if (!(id && role && content && timestamp)) return null;

  return {
    id,
    role,
    content,
    timestamp,
    sessionId: asString(value.sessionId),
    createdAt: asString(value.createdAt),
  };
};

export const resolveProfileId = (): string => DEFAULT_PROFILE_ID;

export const resolveSettingsId = (): string => DEFAULT_SETTINGS_ID;
