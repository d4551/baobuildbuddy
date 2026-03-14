import {
  API_ERROR_INVALID_COVER_LETTER_PAYLOAD,
  API_ERROR_INVALID_GAMIFICATION_PAYLOAD,
  API_ERROR_INVALID_INTERVIEW_SESSION_PAYLOAD,
  API_ERROR_INVALID_PORTFOLIO_PAYLOAD,
  API_ERROR_INVALID_PORTFOLIO_PROJECT_PAYLOAD,
  API_ERROR_INVALID_RESUME_PAYLOAD,
  API_ERROR_INVALID_SKILL_MAPPING_PAYLOAD,
  DEFAULT_PROFILE_ID,
  asBoolean,
  asNumber,
  asRecord,
  asString,
  asStringArray,
  asUnknownArray,
  isRecord,
  settle,
  toErrorMessage,
} from "@bao/shared";
import { eq } from "drizzle-orm";
import { db, sqlite } from "../db/client";
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

export const DATA_EXPORT_VERSION = "1.0" as const;

export interface BaoExportData {
  version: string;
  exportedAt: string;
  profile: unknown;
  settings: unknown; // API keys redacted
  resumes: unknown[];
  coverLetters: unknown[];
  portfolio: unknown;
  portfolioProjects: unknown[];
  interviewSessions: unknown[];
  gamification: unknown;
  skillMappings: unknown[];
  savedJobs: unknown[];
  applications: unknown[];
  chatHistory: unknown[];
}

export interface ImportResult {
  imported: Record<string, number>;
  skipped: Record<string, number>;
  errors: string[];
}

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

const omitImportMetadata = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([key]) => key !== "id" && key !== "createdAt"));

const parseResumeInsert = (value: unknown): ResumeInsert | null => {
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

const parseCoverLetterInsert = (value: unknown): CoverLetterInsert | null => {
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

const parsePortfolioInsert = (value: unknown): PortfolioInsert | null => {
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

const parsePortfolioProjectInsert = (value: unknown): PortfolioProjectInsert | null => {
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

const parseInterviewSessionInsert = (value: unknown): InterviewSessionInsert | null => {
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

const parseGamificationInsert = (value: unknown): GamificationInsert | null => {
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

const parseSkillMappingInsert = (value: unknown): SkillMappingInsert | null => {
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

const parseChatHistoryInsert = (value: unknown): ChatHistoryInsert | null => {
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

const runWithErrorHandler = async (
  operation: () => Promise<void>,
  onError: (message: string) => void,
): Promise<void> => {
  await operation().then(
    () => undefined,
    (error: unknown) => {
      onError(toErrorMessage(error));
    },
  );
};

const runIgnoringErrors = async (operation: () => Promise<void>): Promise<void> => {
  await operation().then(
    () => undefined,
    () => undefined,
  );
};

export class DataService {
  /**
   * Export all user data as JSON
   * API keys are redacted for security
   */
  async exportAll(): Promise<BaoExportData> {
    const profileRows = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
    const settingsRows = await db
      .select()
      .from(settings)
      .where(eq(settings.id, DEFAULT_SETTINGS_ID));
    const allResumes = await db.select().from(resumes);
    const allCoverLetters = await db.select().from(coverLetters);
    const allPortfolios = await db.select().from(portfolios);
    const allProjects = await db.select().from(portfolioProjects);
    const allInterviews = await db.select().from(interviewSessions);
    const gamRows = await db
      .select()
      .from(gamification)
      .where(eq(gamification.id, DEFAULT_PROFILE_ID));
    const allSkills = await db.select().from(skillMappings);
    const allSaved = await db.select().from(savedJobs);
    const allApps = await db.select().from(applications);
    const allChat = await db.select().from(chatHistory);

    // Redact API keys
    let safeSettings: unknown = null;
    if (settingsRows[0]) {
      const s = { ...settingsRows[0] };
      if (s.geminiApiKey) s.geminiApiKey = "***REDACTED***";
      if (s.openaiApiKey) s.openaiApiKey = "***REDACTED***";
      if (s.claudeApiKey) s.claudeApiKey = "***REDACTED***";
      if (s.huggingfaceToken) s.huggingfaceToken = "***REDACTED***";
      safeSettings = s;
    }

    return {
      version: DATA_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      profile: profileRows[0] || null,
      settings: safeSettings,
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
  }

  /**
   * Import data from a BaoBuildBuddy export JSON
   * Uses a transaction for atomicity
   */
  async importAll(data: BaoExportData): Promise<ImportResult> {
    const imported: Record<string, number> = {};
    const skipped: Record<string, number> = {};
    const errors: string[] = [];

    if (data.version !== DATA_EXPORT_VERSION) {
      errors.push(`Unsupported export version: ${data.version}`);
      return { imported, skipped, errors };
    }

    sqlite.exec("BEGIN");
    const transactionResult = await settle(this.executeImportTransaction(data, imported, errors));
    if (transactionResult.status === "rejected") {
      sqlite.exec("ROLLBACK");
      errors.push(`Transaction failed: ${toErrorMessage(transactionResult.reason)}`);
    }

    return { imported, skipped, errors };
  }

  private async executeImportTransaction(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    await this.importProfileSection(data, imported, errors);
    await this.importSettingsSection(data, imported, errors);
    await this.importResumesSection(data, imported, errors);
    await this.importCoverLettersSection(data, imported, errors);
    await this.importPortfolioProjectsSection(data, imported, errors);
    await this.importInterviewSessionsSection(data, imported, errors);
    await this.importGamificationSection(data, imported, errors);
    await this.importSkillMappingsSection(data, imported, errors);
    await this.importChatHistorySection(data, imported);
    sqlite.exec("COMMIT");
  }

  private sanitizeImportedSettings(value: unknown): Record<string, unknown> {
    const settingsRecord = isRecord(value) ? { ...value } : {};
    const apiKeys = ["geminiApiKey", "openaiApiKey", "claudeApiKey", "huggingfaceToken"] as const;
    for (const key of apiKeys) {
      if (settingsRecord[key] === "***REDACTED***") {
        settingsRecord[key] = undefined;
      }
    }
    settingsRecord.id = undefined;
    settingsRecord.createdAt = undefined;
    return settingsRecord;
  }

  private async runTasksSequentially(tasks: Array<() => Promise<void>>, index = 0): Promise<void> {
    if (index >= tasks.length) {
      return;
    }
    await tasks[index]?.();
    await this.runTasksSequentially(tasks, index + 1);
  }

  private async importProfileSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!data.profile) {
      return;
    }

    await runWithErrorHandler(
      async () => {
        const existing = await db
          .select()
          .from(userProfile)
          .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
        const profile = isRecord(data.profile) ? data.profile : {};
        if (existing.length > 0) {
          const rest = omitImportMetadata(profile);
          await db
            .update(userProfile)
            .set({ ...rest, updatedAt: new Date().toISOString() })
            .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
        } else {
          await db.insert(userProfile).values({ ...profile, id: DEFAULT_PROFILE_ID });
        }
        imported.profile = 1;
      },
      (message) => {
        errors.push(`Profile import failed: ${message}`);
      },
    );
  }

  private async importSettingsSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!data.settings) {
      return;
    }

    await runWithErrorHandler(
      async () => {
        const normalized = this.sanitizeImportedSettings(data.settings);
        const existing = await db
          .select()
          .from(settings)
          .where(eq(settings.id, DEFAULT_SETTINGS_ID));
        if (existing.length > 0) {
          await db
            .update(settings)
            .set({ ...normalized, updatedAt: new Date().toISOString() })
            .where(eq(settings.id, DEFAULT_SETTINGS_ID));
        } else {
          await db.insert(settings).values({ ...normalized, id: DEFAULT_SETTINGS_ID });
        }
        imported.settings = 1;
      },
      (message) => {
        errors.push(`Settings import failed: ${message}`);
      },
    );
  }

  private async importResumesSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!(data.resumes?.length > 0)) {
      return;
    }

    let count = 0;
    const tasks = data.resumes.map(
      (resume) => async () =>
        runWithErrorHandler(
          async () => {
            const parsedResume = parseResumeInsert(resume);
            if (!parsedResume) throw new Error(API_ERROR_INVALID_RESUME_PAYLOAD);
            await db
              .insert(resumes)
              .values(parsedResume)
              .onConflictDoUpdate({
                target: resumes.id,
                set: { ...parsedResume, updatedAt: new Date().toISOString() },
              });
            count++;
          },
          (message) => {
            const record = isRecord(resume) ? resume : {};
            errors.push(`Resume "${asString(record.name) ?? "unknown"}" import failed: ${message}`);
          },
        ),
    );
    await this.runTasksSequentially(tasks);
    imported.resumes = count;
  }

  private async importCoverLettersSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!(data.coverLetters?.length > 0)) {
      return;
    }

    let count = 0;
    const tasks = data.coverLetters.map(
      (coverLetter) => async () =>
        runWithErrorHandler(
          async () => {
            const parsedCoverLetter = parseCoverLetterInsert(coverLetter);
            if (!parsedCoverLetter) throw new Error(API_ERROR_INVALID_COVER_LETTER_PAYLOAD);
            await db
              .insert(coverLetters)
              .values(parsedCoverLetter)
              .onConflictDoUpdate({
                target: coverLetters.id,
                set: { ...parsedCoverLetter, updatedAt: new Date().toISOString() },
              });
            count++;
          },
          (message) => {
            errors.push(`Cover letter import failed: ${message}`);
          },
        ),
    );
    await this.runTasksSequentially(tasks);
    imported.coverLetters = count;
  }

  private async importPortfolioProjectsSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!(data.portfolioProjects?.length > 0)) {
      return;
    }

    if (data.portfolio) {
      await runIgnoringErrors(async () => {
        const portfolioRow = parsePortfolioInsert(data.portfolio);
        if (!portfolioRow) throw new Error(API_ERROR_INVALID_PORTFOLIO_PAYLOAD);
        await db.insert(portfolios).values(portfolioRow).onConflictDoNothing();
      });
    }

    let count = 0;
    const tasks = data.portfolioProjects.map(
      (project) => async () =>
        runWithErrorHandler(
          async () => {
            const parsedProject = parsePortfolioProjectInsert(project);
            if (!parsedProject) throw new Error(API_ERROR_INVALID_PORTFOLIO_PROJECT_PAYLOAD);
            await db
              .insert(portfolioProjects)
              .values(parsedProject)
              .onConflictDoUpdate({
                target: portfolioProjects.id,
                set: { ...parsedProject, updatedAt: new Date().toISOString() },
              });
            count++;
          },
          (message) => {
            const record = isRecord(project) ? project : {};
            errors.push(
              `Portfolio project "${asString(record.title) ?? "unknown"}" import failed: ${message}`,
            );
          },
        ),
    );
    await this.runTasksSequentially(tasks);
    imported.portfolioProjects = count;
  }

  private async importInterviewSessionsSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!(data.interviewSessions?.length > 0)) {
      return;
    }

    let count = 0;
    const tasks = data.interviewSessions.map(
      (session) => async () =>
        runWithErrorHandler(
          async () => {
            const parsedSession = parseInterviewSessionInsert(session);
            if (!parsedSession) throw new Error(API_ERROR_INVALID_INTERVIEW_SESSION_PAYLOAD);
            await db
              .insert(interviewSessions)
              .values(parsedSession)
              .onConflictDoUpdate({
                target: interviewSessions.id,
                set: { ...parsedSession, updatedAt: new Date().toISOString() },
              });
            count++;
          },
          (message) => {
            errors.push(`Interview session import failed: ${message}`);
          },
        ),
    );
    await this.runTasksSequentially(tasks);
    imported.interviewSessions = count;
  }

  private async importGamificationSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!data.gamification) {
      return;
    }

    await runWithErrorHandler(
      async () => {
        const existing = await db
          .select()
          .from(gamification)
          .where(eq(gamification.id, DEFAULT_PROFILE_ID));
        const parsedGamification = parseGamificationInsert(data.gamification);
        if (!parsedGamification) throw new Error(API_ERROR_INVALID_GAMIFICATION_PAYLOAD);
        if (existing.length > 0) {
          const rest = omitImportMetadata(parsedGamification);
          await db
            .update(gamification)
            .set({ ...rest, updatedAt: new Date().toISOString() })
            .where(eq(gamification.id, DEFAULT_PROFILE_ID));
        } else {
          await db.insert(gamification).values({ ...parsedGamification, id: DEFAULT_PROFILE_ID });
        }
        imported.gamification = 1;
      },
      (message) => {
        errors.push(`Gamification import failed: ${message}`);
      },
    );
  }

  private async importSkillMappingsSection(
    data: BaoExportData,
    imported: Record<string, number>,
    errors: string[],
  ): Promise<void> {
    if (!(data.skillMappings?.length > 0)) {
      return;
    }

    let count = 0;
    const tasks = data.skillMappings.map(
      (skill) => async () =>
        runWithErrorHandler(
          async () => {
            const parsedSkill = parseSkillMappingInsert(skill);
            if (!parsedSkill) throw new Error(API_ERROR_INVALID_SKILL_MAPPING_PAYLOAD);
            await db
              .insert(skillMappings)
              .values(parsedSkill)
              .onConflictDoUpdate({
                target: skillMappings.id,
                set: { ...parsedSkill, updatedAt: new Date().toISOString() },
              });
            count++;
          },
          (message) => {
            errors.push(`Skill mapping import failed: ${message}`);
          },
        ),
    );
    await this.runTasksSequentially(tasks);
    imported.skillMappings = count;
  }

  private async importChatHistorySection(
    data: BaoExportData,
    imported: Record<string, number>,
  ): Promise<void> {
    if (!(data.chatHistory?.length > 0)) {
      return;
    }

    let count = 0;
    const tasks = data.chatHistory.map(
      (message) => async () =>
        runIgnoringErrors(async () => {
          const parsedMessage = parseChatHistoryInsert(message);
          if (!parsedMessage) {
            return;
          }
          await db.insert(chatHistory).values(parsedMessage).onConflictDoNothing();
          count++;
        }),
    );
    await this.runTasksSequentially(tasks);
    imported.chatHistory = count;
  }
}

export const dataService = new DataService();
