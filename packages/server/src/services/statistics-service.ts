import type {
  AutomationStats,
  CareerProgress,
  DashboardStats,
  WeeklyActivity,
} from "@bao/shared/types/search";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { isRecord } from "@bao/shared/utils/type-guards";
import { STATISTICS_AUTOMATION_RUNS_LIMIT } from "@bao/shared/constants/statistics";
import { count, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { chatHistory } from "../db/schema/chat-history";
import { coverLetters } from "../db/schema/cover-letters";
import { gamification } from "../db/schema/gamification";
import { interviewSessions } from "../db/schema/interviews";
import { applications, savedJobs } from "../db/schema/jobs";
import { portfolioProjects } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import { userProfile } from "../db/schema/user";
import {
  buildCareerProgress,
  buildWeeklyActivity,
  parseActionHistory,
} from "./statistics-service-activity";

export class StatisticsService {
  private async runBestEffort(operation: () => Promise<void>): Promise<void> {
    await operation().then(
      () => undefined,
      () => undefined,
    );
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const profileCompleteness = await this.getProfileCompleteness();
    const jobStats = await this.getJobStats();
    const resumeStats = await this.getResumeStats();
    const clCount = await this.getCoverLetterCount();
    const projectCount = await this.getPortfolioProjectCount();
    const interviewStats = await this.getInterviewStats();
    const mappedCount = await this.getMappedSkillCount();
    const aiStats = await this.getAiStats();
    const gamStats = await this.getGamificationStats();
    const autoStats = await this.getAutomationStats();

    return {
      profile: { completeness: profileCompleteness },
      jobs: jobStats,
      resumes: resumeStats,
      coverLetters: { count: clCount },
      portfolio: { projectCount },
      interviews: interviewStats,
      skills: { mappedCount },
      ai: aiStats,
      gamification: gamStats,
      automation: autoStats,
    };
  }

  private async getProfileCompleteness(): Promise<number> {
    let profileCompleteness = 0;
    await this.runBestEffort(async () => {
      const profileRows = await db
        .select()
        .from(userProfile)
        .where(eq(userProfile.id, DEFAULT_PROFILE_ID));
      const profile = profileRows[0];
      if (!profile) {
        return;
      }
      const fields = [
        profile.name,
        profile.email,
        profile.location,
        profile.summary,
        profile.currentRole,
      ];
      const filled = fields.filter((field) => field && String(field).trim().length > 0).length;
      profileCompleteness = Math.round((filled / fields.length) * 100);
    });
    return profileCompleteness;
  }

  private async getJobStats(): Promise<DashboardStats["jobs"]> {
    const jobStats: DashboardStats["jobs"] = {
      saved: 0,
      applied: 0,
      interviewing: 0,
      offered: 0,
    };
    await this.runBestEffort(async () => {
      const savedCount = await db.select({ count: count() }).from(savedJobs);
      jobStats.saved = savedCount[0]?.count || 0;
      const applicationRows = await db.select().from(applications);
      for (const app of applicationRows) {
        const status = app.status?.toLowerCase() || "";
        if (status === "applied") jobStats.applied++;
        else if (status === "interviewing") jobStats.interviewing++;
        else if (status === "offered") jobStats.offered++;
      }
    });
    return jobStats;
  }

  private async getResumeStats(): Promise<DashboardStats["resumes"]> {
    const resumeStats: DashboardStats["resumes"] = {
      count: 0,
      lastUpdated: null,
    };
    await this.runBestEffort(async () => {
      const resumeCount = await db.select({ count: count() }).from(resumes);
      resumeStats.count = resumeCount[0]?.count || 0;
    });
    return resumeStats;
  }

  private async getCoverLetterCount(): Promise<number> {
    let countValue = 0;
    await this.runBestEffort(async () => {
      const result = await db.select({ count: count() }).from(coverLetters);
      countValue = result[0]?.count || 0;
    });
    return countValue;
  }

  private async getPortfolioProjectCount(): Promise<number> {
    let projectCount = 0;
    await this.runBestEffort(async () => {
      const result = await db.select({ count: count() }).from(portfolioProjects);
      projectCount = result[0]?.count || 0;
    });
    return projectCount;
  }

  private async getInterviewStats(): Promise<DashboardStats["interviews"]> {
    const interviewStats: DashboardStats["interviews"] = {
      totalSessions: 0,
      averageScore: null,
    };
    await this.runBestEffort(async () => {
      const result = await db.select({ count: count() }).from(interviewSessions);
      interviewStats.totalSessions = result[0]?.count || 0;
    });
    return interviewStats;
  }

  private async getMappedSkillCount(): Promise<number> {
    let mappedCount = 0;
    await this.runBestEffort(async () => {
      const result = await db.select({ count: count() }).from(skillMappings);
      mappedCount = result[0]?.count || 0;
    });
    return mappedCount;
  }

  private async getAiStats(): Promise<DashboardStats["ai"]> {
    const aiStats: DashboardStats["ai"] = {
      chatMessages: 0,
      chatSessions: 0,
    };
    await this.runBestEffort(async () => {
      const messageCount = await db.select({ count: count() }).from(chatHistory);
      aiStats.chatMessages = messageCount[0]?.count || 0;
    });
    return aiStats;
  }

  private async getGamificationStats(): Promise<DashboardStats["gamification"]> {
    const gamStats: DashboardStats["gamification"] = {
      level: 1,
      xp: 0,
      achievements: 0,
      streak: 0,
    };
    await this.runBestEffort(async () => {
      const gamRows = await db
        .select()
        .from(gamification)
        .where(eq(gamification.id, DEFAULT_PROFILE_ID));
      const gamificationRow = gamRows[0];
      if (!gamificationRow) {
        return;
      }
      gamStats.level = gamificationRow.level || 1;
      gamStats.xp = gamificationRow.xp || 0;
      gamStats.achievements = Array.isArray(gamificationRow.achievements)
        ? gamificationRow.achievements.length
        : 0;
      gamStats.streak = gamificationRow.currentStreak || 0;
    });
    return gamStats;
  }

  private async getAutomationStats(): Promise<AutomationStats> {
    const automationStats: AutomationStats = {
      totalRuns: 0,
      successfulRuns: 0,
      successRate: 0,
      todayRuns: 0,
      recentRuns: [],
    };
    await this.runBestEffort(async () => {
      const allRuns = await db
        .select()
        .from(automationRuns)
        .orderBy(desc(automationRuns.createdAt))
        .limit(STATISTICS_AUTOMATION_RUNS_LIMIT);
      automationStats.totalRuns = allRuns.length;
      automationStats.successfulRuns = allRuns.filter((run) => run.status === "success").length;
      automationStats.successRate =
        automationStats.totalRuns > 0
          ? Math.round((automationStats.successfulRuns / automationStats.totalRuns) * 100)
          : 0;
      const today = new Date().toISOString().split("T")[0];
      automationStats.todayRuns = allRuns.filter((run) => run.createdAt?.startsWith(today)).length;
      automationStats.recentRuns = allRuns.slice(0, 5).map((run) => ({
        id: run.id,
        type: run.type,
        status: run.status,
        createdAt: run.createdAt,
      }));
    });
    return automationStats;
  }

  async getWeeklyActivity(): Promise<WeeklyActivity> {
    const gamRows = await db
      .select()
      .from(gamification)
      .where(eq(gamification.id, DEFAULT_PROFILE_ID));
    const stats = gamRows[0]?.stats;
    const actionHistory = isRecord(stats) ? parseActionHistory(stats.actionHistory) : [];
    return buildWeeklyActivity(actionHistory);
  }

  async getCareerProgress(): Promise<CareerProgress> {
    let mappedSkills = 0;
    await this.runBestEffort(async () => {
      const skillResult = await db.select({ count: count() }).from(skillMappings);
      mappedSkills = skillResult[0]?.count || 0;
    });

    let applicationStatuses: string[] = [];
    await this.runBestEffort(async () => {
      const allApps = await db.select().from(applications);
      applicationStatuses = allApps.map((application) => application.status || "");
    });

    return buildCareerProgress(mappedSkills, applicationStatuses);
  }
}

export const statisticsService = new StatisticsService();
