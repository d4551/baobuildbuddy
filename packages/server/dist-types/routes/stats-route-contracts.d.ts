export declare const automationStatsSchema: import("typebox").TObject<{
    totalRuns: import("typebox").TNumber;
    successfulRuns: import("typebox").TNumber;
    successRate: import("typebox").TNumber;
    todayRuns: import("typebox").TNumber;
    recentRuns: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        type: import("typebox").TString;
        status: import("typebox").TString;
        createdAt: import("typebox").TString;
    }>>;
}>;
export declare const statsDashboardResponseSchema: import("typebox").TObject<{
    profile: import("typebox").TObject<{
        completeness: import("typebox").TNumber;
    }>;
    jobs: import("typebox").TObject<{
        saved: import("typebox").TNumber;
        applied: import("typebox").TNumber;
        interviewing: import("typebox").TNumber;
        offered: import("typebox").TNumber;
    }>;
    resumes: import("typebox").TObject<{
        count: import("typebox").TNumber;
        lastUpdated: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    }>;
    coverLetters: import("typebox").TObject<{
        count: import("typebox").TNumber;
    }>;
    portfolio: import("typebox").TObject<{
        projectCount: import("typebox").TNumber;
    }>;
    interviews: import("typebox").TObject<{
        totalSessions: import("typebox").TNumber;
        averageScore: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
    }>;
    skills: import("typebox").TObject<{
        mappedCount: import("typebox").TNumber;
    }>;
    ai: import("typebox").TObject<{
        chatMessages: import("typebox").TNumber;
        chatSessions: import("typebox").TNumber;
    }>;
    gamification: import("typebox").TObject<{
        level: import("typebox").TNumber;
        xp: import("typebox").TNumber;
        achievements: import("typebox").TNumber;
        streak: import("typebox").TNumber;
    }>;
    automation: import("typebox").TObject<{
        totalRuns: import("typebox").TNumber;
        successfulRuns: import("typebox").TNumber;
        successRate: import("typebox").TNumber;
        todayRuns: import("typebox").TNumber;
        recentRuns: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            type: import("typebox").TString;
            status: import("typebox").TString;
            createdAt: import("typebox").TString;
        }>>;
    }>;
}>;
export declare const statsWeeklyResponseSchema: import("typebox").TObject<{
    days: import("typebox").TArray<import("typebox").TObject<{
        date: import("typebox").TString;
        actions: import("typebox").TNumber;
        xpEarned: import("typebox").TNumber;
    }>>;
    topCategory: import("typebox").TString;
    totalXP: import("typebox").TNumber;
}>;
export declare const statsCareerResponseSchema: import("typebox").TObject<{
    skillCoverage: import("typebox").TNumber;
    applicationSuccessRate: import("typebox").TNumber;
    interviewTrend: import("typebox").TArray<import("typebox").TNumber>;
}>;
