import type { DashboardStats } from "@bao/shared";
import { describe, expect, it } from "vitest";
import {
  FLOW_PROFILE_COMPLETENESS_THRESHOLD,
  createFlowEngineInput,
  resolveFlowRecommendations,
} from "./flow-engine";

interface FlowStatsOverrides {
  profileCompleteness?: number;
  resumeCount?: number;
  coverLetterCount?: number;
  portfolioProjectCount?: number;
  savedJobs?: number;
  appliedJobs?: number;
  interviewSessions?: number;
}

function createDashboardStats(overrides: FlowStatsOverrides = {}): DashboardStats {
  return {
    profile: {
      completeness: overrides.profileCompleteness ?? 1,
    },
    jobs: {
      saved: overrides.savedJobs ?? 0,
      applied: overrides.appliedJobs ?? 0,
      interviewing: 0,
      offered: 0,
    },
    resumes: {
      count: overrides.resumeCount ?? 0,
      lastUpdated: null,
    },
    coverLetters: {
      count: overrides.coverLetterCount ?? 0,
    },
    portfolio: {
      projectCount: overrides.portfolioProjectCount ?? 0,
    },
    interviews: {
      totalSessions: overrides.interviewSessions ?? 0,
      averageScore: null,
    },
    skills: {
      mappedCount: 0,
    },
    ai: {
      chatMessages: 0,
      chatSessions: 0,
    },
    gamification: {
      level: 1,
      xp: 0,
      achievements: 0,
      streak: 0,
    },
    automation: {
      totalRuns: 0,
      successfulRuns: 0,
      successRate: 0,
      todayRuns: 0,
      recentRuns: [],
    },
  };
}

describe("resolveFlowRecommendations", () => {
  it("routes users without setup to the setup flow", () => {
    const result = resolveFlowRecommendations({
      stats: createDashboardStats({ profileCompleteness: 0 }),
      readiness: {
        isProfileComplete: false,
        isSetupComplete: false,
      },
    });

    expect(result.flowStage).toBe("setup");
    expect(result.primaryAction.id).toBe("setup");
  });

  it("routes setup-complete users without resume assets to resume customization", () => {
    const result = resolveFlowRecommendations({
      stats: createDashboardStats({
        profileCompleteness: 1,
        resumeCount: 0,
        coverLetterCount: 0,
        portfolioProjectCount: 0,
      }),
    });

    expect(result.flowStage).toBe("resumeAssets");
    expect(result.primaryAction.id).toBe("resume");
  });

  it("routes resume-ready users with no applications to the apply automation flow", () => {
    const result = resolveFlowRecommendations({
      stats: createDashboardStats({
        profileCompleteness: 1,
        resumeCount: 1,
        coverLetterCount: 1,
        portfolioProjectCount: 1,
        savedJobs: 4,
        appliedJobs: 0,
      }),
    });

    expect(result.flowStage).toBe("applicationAutomation");
    expect(result.primaryAction.id).toBe("automationApply");
  });

  it("prioritizes interview and AI continuation for fully progressed users", () => {
    const result = resolveFlowRecommendations({
      stats: createDashboardStats({
        profileCompleteness: 1,
        resumeCount: 1,
        coverLetterCount: 1,
        portfolioProjectCount: 1,
        savedJobs: 4,
        appliedJobs: 3,
        interviewSessions: 2,
      }),
    });

    expect(result.flowStage).toBe("optimize");
    expect(result.primaryAction.id).toBe("interview");
    expect(result.recommendedActions[0]?.id).toBe("aiChat");
  });
});

describe("createFlowEngineInput", () => {
  it("uses canonical readiness thresholds unless explicitly overridden", () => {
    const belowThreshold = createFlowEngineInput(
      createDashboardStats({ profileCompleteness: FLOW_PROFILE_COMPLETENESS_THRESHOLD - 0.01 }),
    );
    const aboveThreshold = createFlowEngineInput(
      createDashboardStats({ profileCompleteness: FLOW_PROFILE_COMPLETENESS_THRESHOLD }),
    );

    expect(belowThreshold.readiness?.isProfileComplete).toBe(false);
    expect(aboveThreshold.readiness?.isProfileComplete).toBe(true);
    expect(aboveThreshold.readiness?.isSetupComplete).toBe(true);
  });
});
