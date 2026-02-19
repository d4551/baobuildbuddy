import { eq } from "drizzle-orm";
import { db, sqlite } from "../db/client";
import { chatHistory } from "../db/schema/chat-history";
import { coverLetters } from "../db/schema/cover-letters";
import { gamification } from "../db/schema/gamification";
import { interviewSessions } from "../db/schema/interviews";
import { applications, jobs, savedJobs } from "../db/schema/jobs";
import { portfolioProjects, portfolios } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { settings } from "../db/schema/settings";
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

export class DataService {
  /**
   * Export all user data as JSON
   * API keys are redacted for security
   */
  async exportAll(): Promise<BaoExportData> {
    const profileRows = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
    const settingsRows = await db.select().from(settings).where(eq(settings.id, "default"));
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
            const { id, createdAt, ...rest } = data.profile;
            await db
              .update(userProfile)
              .set({ ...rest, updatedAt: new Date().toISOString() })
              .where(eq(userProfile.id, "default"));
          } else {
            await db.insert(userProfile).values({ ...data.profile, id: "default" });
          }
          imported.profile = 1;
        } catch (e) {
          errors.push(`Profile import failed: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      // Import settings (skip redacted API keys)
      if (data.settings) {
        try {
          const s = { ...data.settings };
          // Don't overwrite API keys with redacted values
          if (s.geminiApiKey === "***REDACTED***") s.geminiApiKey = undefined;
          if (s.openaiApiKey === "***REDACTED***") s.openaiApiKey = undefined;
          if (s.claudeApiKey === "***REDACTED***") s.claudeApiKey = undefined;
          if (s.huggingfaceToken === "***REDACTED***") s.huggingfaceToken = undefined;
          s.id = undefined;
          s.createdAt = undefined;

          const existing = await db.select().from(settings).where(eq(settings.id, "default"));
          if (existing.length > 0) {
            await db
              .update(settings)
              .set({ ...s, updatedAt: new Date().toISOString() })
              .where(eq(settings.id, "default"));
          } else {
            await db.insert(settings).values({ ...s, id: "default" });
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
            await db
              .insert(resumes)
              .values(resume)
              .onConflictDoUpdate({
                target: resumes.id,
                set: { ...resume, updatedAt: new Date().toISOString() },
              });
            count++;
          } catch (e) {
            errors.push(
              `Resume "${resume.name}" import failed: ${e instanceof Error ? e.message : String(e)}`,
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
            await db
              .insert(coverLetters)
              .values(cl)
              .onConflictDoUpdate({
                target: coverLetters.id,
                set: { ...cl, updatedAt: new Date().toISOString() },
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
            await db.insert(portfolios).values(data.portfolio).onConflictDoNothing();
          } catch {
            /* ignore */
          }
        }

        let count = 0;
        for (const project of data.portfolioProjects) {
          try {
            await db
              .insert(portfolioProjects)
              .values(project)
              .onConflictDoUpdate({
                target: portfolioProjects.id,
                set: { ...project, updatedAt: new Date().toISOString() },
              });
            count++;
          } catch (e) {
            errors.push(
              `Portfolio project "${project.title}" import failed: ${e instanceof Error ? e.message : String(e)}`,
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
            await db
              .insert(interviewSessions)
              .values(session)
              .onConflictDoUpdate({
                target: interviewSessions.id,
                set: { ...session, updatedAt: new Date().toISOString() },
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
          if (existing.length > 0) {
            const { id, createdAt, ...rest } = data.gamification;
            await db
              .update(gamification)
              .set({ ...rest, updatedAt: new Date().toISOString() })
              .where(eq(gamification.id, "default"));
          } else {
            await db.insert(gamification).values({ ...data.gamification, id: "default" });
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
            await db
              .insert(skillMappings)
              .values(skill)
              .onConflictDoUpdate({
                target: skillMappings.id,
                set: { ...skill, updatedAt: new Date().toISOString() },
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
            await db.insert(chatHistory).values(msg).onConflictDoNothing();
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
