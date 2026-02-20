import { eq } from "drizzle-orm";
import { db, sqlite } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { coverLetters } from "../db/schema/cover-letters";
import { gamification } from "../db/schema/gamification";
import { interviewSessions } from "../db/schema/interviews";
import { applications, jobs, savedJobs } from "../db/schema/jobs";
import { portfolioProjects, portfolios } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { DEFAULT_SETTINGS_ID, settings } from "../db/schema/settings";
import { skillMappings } from "../db/schema/skill-mappings";
import { userProfile } from "../db/schema/user";

export const DATA_EXPORT_VERSION = "1.0" as const;

export interface BaoExportData {
  version: typeof DATA_EXPORT_VERSION;
  exportedAt: string;
  profile: unknown | null;
  settings: unknown | null; // API keys redacted
  resumes: unknown[];
  coverLetters: unknown[];
  portfolio: unknown | null;
  portfolioProjects: unknown[];
  interviewSessions: unknown[];
  gamification: unknown | null;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

const asBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

const asNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asUnknownArray = (value: unknown): unknown[] | undefined =>
  Array.isArray(value) ? value : undefined;

const asStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : undefined;

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  isRecord(value) ? value : undefined;

const asStringArrayRecord = (value: unknown): Record<string, string[]> | undefined => {
  if (!isRecord(value)) return undefined;
  const result: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!Array.isArray(entry)) continue;
    result[key] = entry.filter((item): item is string => typeof item === "string");
  }
  return result;
};

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
  if (!id || !company || !position) return null;

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
  if (!id || !portfolioId || !title || !description) return null;

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
    platforms: asStringArray(value.platforms),
    engines: asStringArray(value.engines),
    sortOrder: asNumber(value.sortOrder),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
};

const parseInterviewSessionInsert = (value: unknown): InterviewSessionInsert | null => {
  if (!isRecord(value)) return null;
  const id = asString(value.id);
  const studioId = asString(value.studioId);
  if (!id || !studioId) return null;

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
    id: asString(value.id) ?? "default",
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
  if (!id || !gameExpression || !transferableSkill) return null;

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
  if (!id || !role || !content || !timestamp) return null;

  return {
    id,
    role,
    content,
    timestamp,
    sessionId: asString(value.sessionId),
    createdAt: asString(value.createdAt),
  };
};

export class DataService {
  /**
   * Export all user data as JSON
   * API keys are redacted for security
   */
  async exportAll(): Promise<BaoExportData> {
    const profileRows = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
    const settingsRows = await db
      .select()
      .from(settings)
      .where(eq(settings.id, DEFAULT_SETTINGS_ID));
    const allResumes = await db.select().from(resumes);
    const allCoverLetters = await db.select().from(coverLetters);
    const allPortfolios = await db.select().from(portfolios);
    const allProjects = await db.select().from(portfolioProjects);
    const allInterviews = await db.select().from(interviewSessions);
    const gamRows = await db.select().from(gamification).where(eq(gamification.id, "default"));
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

    try {
      sqlite.exec("BEGIN");

      // Import profile
      if (data.profile) {
        try {
          const existing = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
          if (existing.length > 0) {
            const profile = data.profile as Record<string, unknown>;
            const { id, createdAt, ...rest } = profile;
            await db
              .update(userProfile)
              .set({ ...rest, updatedAt: new Date().toISOString() })
              .where(eq(userProfile.id, "default"));
          } else {
            const profile = data.profile as Record<string, unknown>;
            await db.insert(userProfile).values({ ...profile, id: "default" });
          }
          imported.profile = 1;
        } catch (e) {
          errors.push(`Profile import failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Import settings (skip redacted API keys)
      if (data.settings) {
        try {
          const s = { ...(data.settings as Record<string, unknown>) };
          // Don't overwrite API keys with redacted values
          if (s.geminiApiKey === "***REDACTED***") s.geminiApiKey = undefined;
          if (s.openaiApiKey === "***REDACTED***") s.openaiApiKey = undefined;
          if (s.claudeApiKey === "***REDACTED***") s.claudeApiKey = undefined;
          if (s.huggingfaceToken === "***REDACTED***") s.huggingfaceToken = undefined;
          s.id = undefined;
          s.createdAt = undefined;

          const existing = await db
            .select()
            .from(settings)
            .where(eq(settings.id, DEFAULT_SETTINGS_ID));
          if (existing.length > 0) {
            await db
              .update(settings)
              .set({ ...s, updatedAt: new Date().toISOString() })
              .where(eq(settings.id, DEFAULT_SETTINGS_ID));
          } else {
            await db.insert(settings).values({ ...s, id: DEFAULT_SETTINGS_ID });
          }
          imported.settings = 1;
        } catch (e) {
          errors.push(`Settings import failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Import resumes
      if (data.resumes?.length > 0) {
        let count = 0;
        for (const resume of data.resumes) {
          try {
            const r = parseResumeInsert(resume);
            if (!r) {
              throw new Error("Invalid resume payload");
            }
            await db
              .insert(resumes)
              .values(r)
              .onConflictDoUpdate({
                target: resumes.id,
                set: { ...r, updatedAt: new Date().toISOString() },
              });
            count++;
          } catch (e) {
            const r = isRecord(resume) ? resume : {};
            errors.push(
              `Resume "${r.name}" import failed: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
        imported.resumes = count;
      }

      // Import cover letters
      if (data.coverLetters?.length > 0) {
        let count = 0;
        for (const cl of data.coverLetters) {
          try {
            const c = parseCoverLetterInsert(cl);
            if (!c) {
              throw new Error("Invalid cover letter payload");
            }
            await db
              .insert(coverLetters)
              .values(c)
              .onConflictDoUpdate({
                target: coverLetters.id,
                set: { ...c, updatedAt: new Date().toISOString() },
              });
            count++;
          } catch (e) {
            errors.push(
              `Cover letter import failed: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
        imported.coverLetters = count;
      }

      // Import portfolio projects
      if (data.portfolioProjects?.length > 0) {
        // Ensure portfolio container exists
        if (data.portfolio) {
          try {
            const portfolioRow = parsePortfolioInsert(data.portfolio);
            if (!portfolioRow) {
              throw new Error("Invalid portfolio payload");
            }
            await db.insert(portfolios).values(portfolioRow).onConflictDoNothing();
          } catch {
            /* ignore */
          }
        }

        let count = 0;
        for (const project of data.portfolioProjects) {
          try {
            const p = parsePortfolioProjectInsert(project);
            if (!p) {
              throw new Error("Invalid portfolio project payload");
            }
            await db
              .insert(portfolioProjects)
              .values(p)
              .onConflictDoUpdate({
                target: portfolioProjects.id,
                set: { ...p, updatedAt: new Date().toISOString() },
              });
            count++;
          } catch (e) {
            const p = isRecord(project) ? project : {};
            errors.push(
              `Portfolio project "${p.title}" import failed: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
        imported.portfolioProjects = count;
      }

      // Import interview sessions
      if (data.interviewSessions?.length > 0) {
        let count = 0;
        for (const session of data.interviewSessions) {
          try {
            const sess = parseInterviewSessionInsert(session);
            if (!sess) {
              throw new Error("Invalid interview session payload");
            }
            await db
              .insert(interviewSessions)
              .values(sess)
              .onConflictDoUpdate({
                target: interviewSessions.id,
                set: { ...sess, updatedAt: new Date().toISOString() },
              });
            count++;
          } catch (e) {
            errors.push(
              `Interview session import failed: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
        imported.interviewSessions = count;
      }

      // Import gamification
      if (data.gamification) {
        try {
          const existing = await db
            .select()
            .from(gamification)
            .where(eq(gamification.id, "default"));
          const gam = parseGamificationInsert(data.gamification);
          if (!gam) {
            throw new Error("Invalid gamification payload");
          }
          if (existing.length > 0) {
            const { id, createdAt, ...rest } = gam;
            await db
              .update(gamification)
              .set({ ...rest, updatedAt: new Date().toISOString() })
              .where(eq(gamification.id, "default"));
          } else {
            await db.insert(gamification).values({ ...gam, id: "default" });
          }
          imported.gamification = 1;
        } catch (e) {
          errors.push(`Gamification import failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Import skill mappings
      if (data.skillMappings?.length > 0) {
        let count = 0;
        for (const skill of data.skillMappings) {
          try {
            const sk = parseSkillMappingInsert(skill);
            if (!sk) {
              throw new Error("Invalid skill mapping payload");
            }
            await db
              .insert(skillMappings)
              .values(sk)
              .onConflictDoUpdate({
                target: skillMappings.id,
                set: { ...sk, updatedAt: new Date().toISOString() },
              });
            count++;
          } catch (e) {
            errors.push(
              `Skill mapping import failed: ${e instanceof Error ? e.message : String(e)}`,
            );
          }
        }
        imported.skillMappings = count;
      }

      // Import chat history
      if (data.chatHistory?.length > 0) {
        let count = 0;
        for (const msg of data.chatHistory) {
          try {
            const m = parseChatHistoryInsert(msg);
            if (!m) {
              continue;
            }
            await db.insert(chatHistory).values(m).onConflictDoNothing();
            count++;
          } catch {
            /* skip duplicates silently */
          }
        }
        imported.chatHistory = count;
      }

      sqlite.exec("COMMIT");
    } catch (e) {
      sqlite.exec("ROLLBACK");
      errors.push(`Transaction failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return { imported, skipped, errors };
  }
}

export const dataService = new DataService();
