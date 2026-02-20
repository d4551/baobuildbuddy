import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "../db/client";
import { automationRuns } from "../db/schema/automation-runs";
import { chatHistory } from "../db/schema/chat-history";
import { coverLetters } from "../db/schema/cover-letters";
import { gamification } from "../db/schema/gamification";
import { interviewSessions } from "../db/schema/interviews";
import { applications, jobs, savedJobs } from "../db/schema/jobs";
import { portfolioProjects } from "../db/schema/portfolios";
import { resumes } from "../db/schema/resumes";
import { skillMappings } from "../db/schema/skill-mappings";
import { userProfile } from "../db/schema/user";

interface AutomationStats {
  totalRuns: number;
  successfulRuns: number;
  successRate: number;
  todayRuns: number;
  recentRuns: Array<{ id: string; type: string; status: string; createdAt: string }>;
}

interface DashboardStats {
  profile: { completeness: number };
  jobs: { saved: number; applied: number; interviewing: number; offered: number };
  resumes: { count: number; lastUpdated: string | null };
  coverLetters: { count: number };
  portfolio: { projectCount: number };
  interviews: { totalSessions: number; averageScore: number | null };
  skills: { mappedCount: number };
  ai: { chatMessages: number; chatSessions: number };
  gamification: { level: number; xp: number; achievements: number; streak: number };
  automation: AutomationStats;
}

interface WeeklyActivity {
  days: Array<{ date: string; actions: number; xpEarned: number }>;
  topCategory: string;
  totalXP: number;
}

interface CareerProgress {
  skillCoverage: number;
  applicationSuccessRate: number;
  interviewTrend: number[];
}

type ActionHistoryEntry = { action: string; xpGained: number; timestamp: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseActionHistory = (value: unknown): ActionHistoryEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(isRecord)
    .map((entry) => ({
      action: typeof entry.action === "string" ? entry.action : "other",
      xpGained: typeof entry.xpGained === "number" ? entry.xpGained : 0,
      timestamp: typeof entry.timestamp === "string" ? entry.timestamp : "",
    }))
    .filter((entry) => entry.timestamp.length > 0);
};

export class StatisticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    // Profile completeness
    let profileCompleteness = 0;
    try {
      const profileRows = await db.select().from(userProfile).where(eq(userProfile.id, "default"));
      if (profileRows.length > 0) {
        const p = profileRows[0];
        const fields = [p.name, p.email, p.location, p.summary, p.currentRole];
        const filled = fields.filter((f) => f && String(f).trim().length > 0).length;
        profileCompleteness = Math.round((filled / fields.length) * 100);
      }
    } catch {
      /* */
    }

    // Jobs stats
    const jobStats = { saved: 0, applied: 0, interviewing: 0, offered: 0 };
    try {
      const savedCount = await db.select({ count: count() }).from(savedJobs);
      jobStats.saved = savedCount[0]?.count || 0;

      const appRows = await db.select().from(applications);
      for (const app of appRows) {
        const status = app.status?.toLowerCase() || "";
        if (status === "applied") jobStats.applied++;
        else if (status === "interviewing") jobStats.interviewing++;
        else if (status === "offered") jobStats.offered++;
      }
    } catch {
      /* */
    }

    // Resumes
    const resumeStats = { count: 0, lastUpdated: null as string | null };
    try {
      const resumeCount = await db.select({ count: count() }).from(resumes);
      resumeStats.count = resumeCount[0]?.count || 0;
    } catch {
      /* */
    }

    // Cover letters
    let clCount = 0;
    try {
      const clResult = await db.select({ count: count() }).from(coverLetters);
      clCount = clResult[0]?.count || 0;
    } catch {
      /* */
    }

    // Portfolio
    let projectCount = 0;
    try {
      const projResult = await db.select({ count: count() }).from(portfolioProjects);
      projectCount = projResult[0]?.count || 0;
    } catch {
      /* */
    }

    // Interviews
    const interviewStats = { totalSessions: 0, averageScore: null as number | null };
    try {
      const intResult = await db.select({ count: count() }).from(interviewSessions);
      interviewStats.totalSessions = intResult[0]?.count || 0;
    } catch {
      /* */
    }

    // Skills
    let mappedCount = 0;
    try {
      const skillResult = await db.select({ count: count() }).from(skillMappings);
      mappedCount = skillResult[0]?.count || 0;
    } catch {
      /* */
    }

    // AI chat
    const aiStats = { chatMessages: 0, chatSessions: 0 };
    try {
      const msgResult = await db.select({ count: count() }).from(chatHistory);
      aiStats.chatMessages = msgResult[0]?.count || 0;
    } catch {
      /* */
    }

    // Gamification
    const gamStats = { level: 1, xp: 0, achievements: 0, streak: 0 };
    try {
      const gamRows = await db.select().from(gamification).where(eq(gamification.id, "default"));
      if (gamRows.length > 0) {
        const g = gamRows[0];
        gamStats.level = g.level || 1;
        gamStats.xp = g.xp || 0;
        gamStats.achievements = Array.isArray(g.achievements) ? g.achievements.length : 0;
        gamStats.streak = g.currentStreak || 0;
      }
    } catch {
      /* */
    }

    // Automation stats
    const autoStats: AutomationStats = {
      totalRuns: 0,
      successfulRuns: 0,
      successRate: 0,
      todayRuns: 0,
      recentRuns: [],
    };
    try {
      const allRuns = await db
        .select()
        .from(automationRuns)
        .orderBy(desc(automationRuns.createdAt))
        .limit(100);
      autoStats.totalRuns = allRuns.length;
      autoStats.successfulRuns = allRuns.filter((r) => r.status === "success").length;
      autoStats.successRate =
        autoStats.totalRuns > 0
          ? Math.round((autoStats.successfulRuns / autoStats.totalRuns) * 100)
          : 0;
      const today = new Date().toISOString().split("T")[0];
      autoStats.todayRuns = allRuns.filter((r) => r.createdAt?.startsWith(today)).length;
      autoStats.recentRuns = allRuns.slice(0, 5).map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        createdAt: r.createdAt,
      }));
    } catch {
      /* */
    }

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

  async getWeeklyActivity(): Promise<WeeklyActivity> {
    // Get gamification stats for action history
    const gamRows = await db.select().from(gamification).where(eq(gamification.id, "default"));
    const stats = gamRows[0]?.stats;
    const actionHistory = isRecord(stats) ? parseActionHistory(stats.actionHistory) : [];

    const now = new Date();
    const days: Array<{ date: string; actions: number; xpEarned: number }> = [];
    const categoryCounts: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const dayActions = actionHistory.filter((a) => a.timestamp?.startsWith(dateStr));
      const xpEarned = dayActions.reduce((sum, a) => sum + (a.xpGained || 0), 0);

      days.push({ date: dateStr, actions: dayActions.length, xpEarned });

      for (const a of dayActions) {
        const cat = a.action || "other";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }

    const topCategory =
      Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || "none";

    const totalXP = days.reduce((sum, d) => sum + d.xpEarned, 0);

    return { days, topCategory, totalXP };
  }

  async getCareerProgress(): Promise<CareerProgress> {
    let skillCoverage = 0;
    try {
      const skillResult = await db.select({ count: count() }).from(skillMappings);
      const mappedSkills = skillResult[0]?.count || 0;
      skillCoverage = Math.min(100, Math.round((mappedSkills / 20) * 100));
    } catch {
      /* */
    }

    let applicationSuccessRate = 0;
    try {
      const allApps = await db.select().from(applications);
      const offered = allApps.filter((a) => a.status === "offered").length;
      if (allApps.length > 0) {
        applicationSuccessRate = Math.round((offered / allApps.length) * 100);
      }
    } catch {
      /* */
    }

    return {
      skillCoverage,
      applicationSuccessRate,
      interviewTrend: [],
    };
  }
}

export const statisticsService = new StatisticsService();
