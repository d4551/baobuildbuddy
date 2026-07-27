import type { Static } from "typebox";
export declare const awardXpBodySchema: import("typebox").TObject<{
    amount: import("typebox").TNumber;
    reason: import("typebox").TString;
}>;
export type AwardXpBody = Static<typeof awardXpBodySchema>;
export declare const challengeIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type ChallengeIdParams = Static<typeof challengeIdParamsSchema>;
export declare const awardXpBody: import("typebox").TObject<{
    amount: import("typebox").TNumber;
    reason: import("typebox").TString;
}>;
export declare const challengeIdParams: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export declare const gamificationProgressResponseSchema: import("typebox").TObject<{
    xp: import("typebox").TNumber;
    level: import("typebox").TNumber;
    achievements: import("typebox").TArray<import("typebox").TString>;
    dailyChallenges: import("typebox").TRecord<"^.*$", import("typebox").TArray<import("typebox").TString>>;
    longestStreak: import("typebox").TNumber;
    currentStreak: import("typebox").TNumber;
    lastActiveDate: import("typebox").TOptional<import("typebox").TString>;
    stats: import("typebox").TObject<{
        profileComplete: import("typebox").TOptional<import("typebox").TNumber>;
        skillsMapped: import("typebox").TOptional<import("typebox").TNumber>;
        portfolioItems: import("typebox").TOptional<import("typebox").TNumber>;
        jobApplications: import("typebox").TOptional<import("typebox").TNumber>;
        chatSessions: import("typebox").TOptional<import("typebox").TNumber>;
        resumesGenerated: import("typebox").TOptional<import("typebox").TNumber>;
        coverLettersGenerated: import("typebox").TOptional<import("typebox").TNumber>;
        savedJobs: import("typebox").TOptional<import("typebox").TNumber>;
        jobsSaved: import("typebox").TOptional<import("typebox").TNumber>;
        interviewScore: import("typebox").TOptional<import("typebox").TNumber>;
        dataExported: import("typebox").TOptional<import("typebox").TNumber>;
        earlyLogin: import("typebox").TOptional<import("typebox").TNumber>;
        totalTimeSpent: import("typebox").TOptional<import("typebox").TNumber>;
        featuresUsed: import("typebox").TOptional<import("typebox").TNumber>;
        dailyStreak: import("typebox").TOptional<import("typebox").TNumber>;
        weeklyProgress: import("typebox").TOptional<import("typebox").TNumber>;
        interviewsCompleted: import("typebox").TOptional<import("typebox").TNumber>;
        studiosExplored: import("typebox").TOptional<import("typebox").TNumber>;
        actionHistory: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
            action: import("typebox").TString;
            xpGained: import("typebox").TNumber;
            multiplier: import("typebox").TOptional<import("typebox").TNumber>;
            timestamp: import("typebox").TString;
        }>>>;
    }>;
    xpForNextLevel: import("typebox").TOptional<import("typebox").TNumber>;
    streak: import("typebox").TOptional<import("typebox").TNumber>;
}>;
export declare const levelUpResultSchema: import("typebox").TObject<{
    xpGained: import("typebox").TNumber;
    oldLevel: import("typebox").TNumber;
    newLevel: import("typebox").TNumber;
    oldTitle: import("typebox").TString;
    newTitle: import("typebox").TString;
    unlockedFeatures: import("typebox").TArray<import("typebox").TString>;
    bonusXP: import("typebox").TOptional<import("typebox").TNumber>;
}>;
export declare const awardXpResponseSchema: import("typebox").TObject<{
    xp: import("typebox").TNumber;
    level: import("typebox").TNumber;
    leveledUp: import("typebox").TBoolean;
    levelUp: import("typebox").TUnion<[import("typebox").TObject<{
        xpGained: import("typebox").TNumber;
        oldLevel: import("typebox").TNumber;
        newLevel: import("typebox").TNumber;
        oldTitle: import("typebox").TString;
        newTitle: import("typebox").TString;
        unlockedFeatures: import("typebox").TArray<import("typebox").TString>;
        bonusXP: import("typebox").TOptional<import("typebox").TNumber>;
    }>, import("typebox").TNull]>;
    reason: import("typebox").TString;
    message: import("typebox").TString;
}>;
export declare const achievementResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    name: import("typebox").TString;
    description: import("typebox").TString;
    icon: import("typebox").TString;
    iconType: import("typebox").TUnion<[import("typebox").TLiteral<"emoji">, import("typebox").TLiteral<"custom">]>;
    category: import("typebox").TUnion<[import("typebox").TLiteral<"progress">, import("typebox").TLiteral<"social">, import("typebox").TLiteral<"skill">, import("typebox").TLiteral<"special">, import("typebox").TLiteral<"milestone">]>;
    xpReward: import("typebox").TNumber;
    requirements: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
    unlocked: import("typebox").TBoolean;
    unlockedAt: import("typebox").TOptional<import("typebox").TString>;
    rarity: import("typebox").TUnion<[import("typebox").TLiteral<"common">, import("typebox").TLiteral<"rare">, import("typebox").TLiteral<"epic">, import("typebox").TLiteral<"legendary">]>;
    hidden: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export declare const dailyChallengeResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    name: import("typebox").TString;
    description: import("typebox").TString;
    icon: import("typebox").TString;
    iconType: import("typebox").TUnion<[import("typebox").TLiteral<"emoji">, import("typebox").TLiteral<"custom">]>;
    xpReward: import("typebox").TNumber;
    category: import("typebox").TUnion<[import("typebox").TLiteral<"profile">, import("typebox").TLiteral<"job_search">, import("typebox").TLiteral<"skill_building">, import("typebox").TLiteral<"social">, import("typebox").TLiteral<"engagement">]>;
    completed: import("typebox").TBoolean;
    requirements: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TNumber>>;
    validUntil: import("typebox").TOptional<import("typebox").TString>;
    progress: import("typebox").TOptional<import("typebox").TNumber>;
    goal: import("typebox").TOptional<import("typebox").TNumber>;
}>;
export declare const challengesListResponseSchema: import("typebox").TObject<{
    date: import("typebox").TString;
    challenges: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
        description: import("typebox").TString;
        icon: import("typebox").TString;
        iconType: import("typebox").TUnion<[import("typebox").TLiteral<"emoji">, import("typebox").TLiteral<"custom">]>;
        xpReward: import("typebox").TNumber;
        category: import("typebox").TUnion<[import("typebox").TLiteral<"profile">, import("typebox").TLiteral<"job_search">, import("typebox").TLiteral<"skill_building">, import("typebox").TLiteral<"social">, import("typebox").TLiteral<"engagement">]>;
        completed: import("typebox").TBoolean;
        requirements: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TNumber>>;
        validUntil: import("typebox").TOptional<import("typebox").TString>;
        progress: import("typebox").TOptional<import("typebox").TNumber>;
        goal: import("typebox").TOptional<import("typebox").TNumber>;
    }>>;
    completedCount: import("typebox").TNumber;
    totalCount: import("typebox").TNumber;
}>;
export declare const challengeCompleteResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    challengeId: import("typebox").TOptional<import("typebox").TString>;
    completed: import("typebox").TBoolean;
    totalXP: import("typebox").TOptional<import("typebox").TNumber>;
    level: import("typebox").TOptional<import("typebox").TNumber>;
}>;
export declare const weeklyProgressResponseSchema: import("typebox").TObject<{
    challengesCompleted: import("typebox").TNumber;
    xpEarned: import("typebox").TNumber;
    actionsCount: import("typebox").TNumber;
    days: import("typebox").TArray<import("typebox").TObject<{
        date: import("typebox").TString;
        actions: import("typebox").TNumber;
        xpEarned: import("typebox").TNumber;
    }>>;
    topCategory: import("typebox").TString;
}>;
export declare const monthlyStatsResponseSchema: import("typebox").TObject<{
    totalXP: import("typebox").TNumber;
    levelsGained: import("typebox").TNumber;
    achievementsUnlocked: import("typebox").TNumber;
    challengesCompleted: import("typebox").TNumber;
    actionsCount: import("typebox").TNumber;
    streakDays: import("typebox").TNumber;
}>;
export declare const gamificationProgressResponses: {
    200: import("typebox").TObject<{
        xp: import("typebox").TNumber;
        level: import("typebox").TNumber;
        achievements: import("typebox").TArray<import("typebox").TString>;
        dailyChallenges: import("typebox").TRecord<"^.*$", import("typebox").TArray<import("typebox").TString>>;
        longestStreak: import("typebox").TNumber;
        currentStreak: import("typebox").TNumber;
        lastActiveDate: import("typebox").TOptional<import("typebox").TString>;
        stats: import("typebox").TObject<{
            profileComplete: import("typebox").TOptional<import("typebox").TNumber>;
            skillsMapped: import("typebox").TOptional<import("typebox").TNumber>;
            portfolioItems: import("typebox").TOptional<import("typebox").TNumber>;
            jobApplications: import("typebox").TOptional<import("typebox").TNumber>;
            chatSessions: import("typebox").TOptional<import("typebox").TNumber>;
            resumesGenerated: import("typebox").TOptional<import("typebox").TNumber>;
            coverLettersGenerated: import("typebox").TOptional<import("typebox").TNumber>;
            savedJobs: import("typebox").TOptional<import("typebox").TNumber>;
            jobsSaved: import("typebox").TOptional<import("typebox").TNumber>;
            interviewScore: import("typebox").TOptional<import("typebox").TNumber>;
            dataExported: import("typebox").TOptional<import("typebox").TNumber>;
            earlyLogin: import("typebox").TOptional<import("typebox").TNumber>;
            totalTimeSpent: import("typebox").TOptional<import("typebox").TNumber>;
            featuresUsed: import("typebox").TOptional<import("typebox").TNumber>;
            dailyStreak: import("typebox").TOptional<import("typebox").TNumber>;
            weeklyProgress: import("typebox").TOptional<import("typebox").TNumber>;
            interviewsCompleted: import("typebox").TOptional<import("typebox").TNumber>;
            studiosExplored: import("typebox").TOptional<import("typebox").TNumber>;
            actionHistory: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
                action: import("typebox").TString;
                xpGained: import("typebox").TNumber;
                multiplier: import("typebox").TOptional<import("typebox").TNumber>;
                timestamp: import("typebox").TString;
            }>>>;
        }>;
        xpForNextLevel: import("typebox").TOptional<import("typebox").TNumber>;
        streak: import("typebox").TOptional<import("typebox").TNumber>;
    }>;
};
export declare const awardXpResponses: {
    200: import("typebox").TObject<{
        xp: import("typebox").TNumber;
        level: import("typebox").TNumber;
        leveledUp: import("typebox").TBoolean;
        levelUp: import("typebox").TUnion<[import("typebox").TObject<{
            xpGained: import("typebox").TNumber;
            oldLevel: import("typebox").TNumber;
            newLevel: import("typebox").TNumber;
            oldTitle: import("typebox").TString;
            newTitle: import("typebox").TString;
            unlockedFeatures: import("typebox").TArray<import("typebox").TString>;
            bonusXP: import("typebox").TOptional<import("typebox").TNumber>;
        }>, import("typebox").TNull]>;
        reason: import("typebox").TString;
        message: import("typebox").TString;
    }>;
    400: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const achievementsResponses: {
    200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
        description: import("typebox").TString;
        icon: import("typebox").TString;
        iconType: import("typebox").TUnion<[import("typebox").TLiteral<"emoji">, import("typebox").TLiteral<"custom">]>;
        category: import("typebox").TUnion<[import("typebox").TLiteral<"progress">, import("typebox").TLiteral<"social">, import("typebox").TLiteral<"skill">, import("typebox").TLiteral<"special">, import("typebox").TLiteral<"milestone">]>;
        xpReward: import("typebox").TNumber;
        requirements: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
        unlocked: import("typebox").TBoolean;
        unlockedAt: import("typebox").TOptional<import("typebox").TString>;
        rarity: import("typebox").TUnion<[import("typebox").TLiteral<"common">, import("typebox").TLiteral<"rare">, import("typebox").TLiteral<"epic">, import("typebox").TLiteral<"legendary">]>;
        hidden: import("typebox").TOptional<import("typebox").TBoolean>;
    }>>;
};
export declare const challengesListResponses: {
    200: import("typebox").TObject<{
        date: import("typebox").TString;
        challenges: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            name: import("typebox").TString;
            description: import("typebox").TString;
            icon: import("typebox").TString;
            iconType: import("typebox").TUnion<[import("typebox").TLiteral<"emoji">, import("typebox").TLiteral<"custom">]>;
            xpReward: import("typebox").TNumber;
            category: import("typebox").TUnion<[import("typebox").TLiteral<"profile">, import("typebox").TLiteral<"job_search">, import("typebox").TLiteral<"skill_building">, import("typebox").TLiteral<"social">, import("typebox").TLiteral<"engagement">]>;
            completed: import("typebox").TBoolean;
            requirements: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TNumber>>;
            validUntil: import("typebox").TOptional<import("typebox").TString>;
            progress: import("typebox").TOptional<import("typebox").TNumber>;
            goal: import("typebox").TOptional<import("typebox").TNumber>;
        }>>;
        completedCount: import("typebox").TNumber;
        totalCount: import("typebox").TNumber;
    }>;
};
export declare const challengeCompleteResponses: {
    200: import("typebox").TObject<{
        message: import("typebox").TString;
        challengeId: import("typebox").TOptional<import("typebox").TString>;
        completed: import("typebox").TBoolean;
        totalXP: import("typebox").TOptional<import("typebox").TNumber>;
        level: import("typebox").TOptional<import("typebox").TNumber>;
    }>;
    201: import("typebox").TObject<{
        message: import("typebox").TString;
        challengeId: import("typebox").TOptional<import("typebox").TString>;
        completed: import("typebox").TBoolean;
        totalXP: import("typebox").TOptional<import("typebox").TNumber>;
        level: import("typebox").TOptional<import("typebox").TNumber>;
    }>;
    400: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const weeklyProgressResponses: {
    200: import("typebox").TObject<{
        challengesCompleted: import("typebox").TNumber;
        xpEarned: import("typebox").TNumber;
        actionsCount: import("typebox").TNumber;
        days: import("typebox").TArray<import("typebox").TObject<{
            date: import("typebox").TString;
            actions: import("typebox").TNumber;
            xpEarned: import("typebox").TNumber;
        }>>;
        topCategory: import("typebox").TString;
    }>;
};
export declare const monthlyStatsResponses: {
    200: import("typebox").TObject<{
        totalXP: import("typebox").TNumber;
        levelsGained: import("typebox").TNumber;
        achievementsUnlocked: import("typebox").TNumber;
        challengesCompleted: import("typebox").TNumber;
        actionsCount: import("typebox").TNumber;
        streakDays: import("typebox").TNumber;
    }>;
};
