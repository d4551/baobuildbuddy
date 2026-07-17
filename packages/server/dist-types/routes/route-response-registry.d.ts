export declare const ROUTE_RESPONSE_REGISTRY: {
    readonly ai: {
        readonly chat: {
            readonly 200: import("typebox").TUnknown;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly analyzeResume: {
            readonly 200: import("typebox").TUnknown;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly generateCoverLetter: {
            readonly 200: import("typebox").TUnknown;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly matchJobs: {
            readonly 200: import("typebox").TUnknown;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly models: {
            readonly 200: import("typebox").TUnknown;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly usage: {
            readonly 200: import("typebox").TUnknown;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly automationAction: {
            readonly 200: import("typebox").TUnknown;
            readonly 400: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 409: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 422: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
    };
    readonly automation: {
        readonly run: import("typebox").TObject<{
            id: import("typebox").TString;
            type: import("typebox").TUnion<[import("typebox").TLiteral<"scrape">, import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"email">]>;
            status: import("typebox").TUnion<[import("typebox").TLiteral<"pending">, import("typebox").TLiteral<"running">, import("typebox").TLiteral<"success">, import("typebox").TLiteral<"error">]>;
            jobId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            userId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            input: import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>;
            output: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>, import("typebox").TNull]>;
            screenshots: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
            error: import("typebox").TUnion<[import("typebox").TString, import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                source: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>, import("typebox").TNull]>;
            progress: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            currentStep: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            totalSteps: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            startedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            completedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            createdAt: import("typebox").TString;
            updatedAt: import("typebox").TString;
            exitCode: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            timedOut: import("typebox").TBoolean;
            aborted: import("typebox").TBoolean;
            executionMs: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
        }>;
        readonly capabilities: import("typebox").TObject<{
            generatedAt: import("typebox").TString;
            summary: import("typebox").TObject<{
                total: import("typebox").TNumber;
                configured: import("typebox").TNumber;
                manualRunAvailable: import("typebox").TNumber;
                scheduledRunAvailable: import("typebox").TNumber;
                runHistoryAvailable: import("typebox").TNumber;
                liveUpdatesAvailable: import("typebox").TNumber;
            }>;
            capabilities: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                category: import("typebox").TUnion<[import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"scrape">]>;
                name: import("typebox").TString;
                target: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"jobs_hitmarker">, import("typebox").TLiteral<"jobs_grackle">, import("typebox").TLiteral<"jobs_workwithindies">, import("typebox").TLiteral<"jobs_remotegamejobs">, import("typebox").TLiteral<"jobs_gamesjobsdirect">, import("typebox").TLiteral<"jobs_pocketgamer">]>, import("typebox").TNull]>;
                implemented: import("typebox").TBoolean;
                configured: import("typebox").TBoolean;
                enabled: import("typebox").TBoolean;
                manualRunAvailable: import("typebox").TBoolean;
                scheduledRunAvailable: import("typebox").TBoolean;
                runHistoryAvailable: import("typebox").TBoolean;
                liveUpdatesAvailable: import("typebox").TBoolean;
                issues: import("typebox").TArray<import("typebox").TObject<{
                    code: import("typebox").TUnion<import("typebox").TLiteral<"portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable">[]>;
                    portalId: import("typebox").TOptional<import("typebox").TString>;
                    portalName: import("typebox").TOptional<import("typebox").TString>;
                }>>;
            }>>;
        }>;
        readonly error: import("typebox").TObject<{
            error: import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>;
        }>;
        readonly errors: {
            readonly 400: import("typebox").TObject<{
                error: import("typebox").TObject<{
                    code: import("typebox").TString;
                    message: import("typebox").TString;
                    details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                }>;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TObject<{
                    code: import("typebox").TString;
                    message: import("typebox").TString;
                    details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                }>;
            }>;
            readonly 409: import("typebox").TObject<{
                error: import("typebox").TObject<{
                    code: import("typebox").TString;
                    message: import("typebox").TString;
                    details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                }>;
            }>;
            readonly 422: import("typebox").TObject<{
                error: import("typebox").TObject<{
                    code: import("typebox").TString;
                    message: import("typebox").TString;
                    details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                }>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TObject<{
                    code: import("typebox").TString;
                    message: import("typebox").TString;
                    details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                }>;
            }>;
        };
    };
    readonly auth: {
        readonly status: {
            readonly 200: import("typebox").TObject<{
                configured: import("typebox").TBoolean;
                authRequired: import("typebox").TBoolean;
                bootstrapRequired: import("typebox").TBoolean;
                setupTokenConfigured: import("typebox").TBoolean;
            }>;
        };
        readonly configured: {
            readonly 200: import("typebox").TObject<{
                configured: import("typebox").TBoolean;
            }>;
        };
        readonly init: {
            readonly 200: import("typebox").TObject<{
                configured: import("typebox").TBoolean;
                apiKey: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 400: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 403: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
    };
    readonly coverLetters: {
        readonly list: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                company: import("typebox").TString;
                position: import("typebox").TString;
                jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>>;
        };
        readonly entity: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                company: import("typebox").TString;
                position: import("typebox").TString;
                jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            201: import("typebox").TObject<{
                id: import("typebox").TString;
                company: import("typebox").TString;
                position: import("typebox").TString;
                jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly delete: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly generate: {
            200: import("typebox").TUnknown;
            201: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
            503: import("typebox").TUnknown;
        };
        readonly export: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
    };
    readonly gamification: {
        readonly progress: {
            200: import("typebox").TObject<{
                xp: import("typebox").TNumber;
                level: import("typebox").TNumber;
                achievements: import("typebox").TArray<import("typebox").TString>;
                dailyChallenges: import("typebox").TRecord<"^.*$", import("typebox").TArray<import("typebox").TString>>;
                longestStreak: import("typebox").TNumber;
                currentStreak: import("typebox").TNumber;
                lastActiveDate: import("typebox").TOptional<import("typebox").TString>;
                stats: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
                xpForNextLevel: import("typebox").TOptional<import("typebox").TNumber>;
                streak: import("typebox").TOptional<import("typebox").TNumber>;
            }>;
        };
        readonly awardXp: {
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
        readonly achievements: {
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
        readonly challenges: {
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
        readonly completeChallenge: {
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
        readonly weeklyProgress: {
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
        readonly monthlyStats: {
            200: import("typebox").TObject<{
                totalXP: import("typebox").TNumber;
                levelsGained: import("typebox").TNumber;
                achievementsUnlocked: import("typebox").TNumber;
                challengesCompleted: import("typebox").TNumber;
                actionsCount: import("typebox").TNumber;
                streakDays: import("typebox").TNumber;
            }>;
        };
    };
    readonly interview: {
        readonly createSession: {
            201: import("typebox").TUnknown;
        };
        readonly listSessions: {
            200: import("typebox").TUnknown;
        };
        readonly session: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly submitResponse: {
            200: import("typebox").TUnknown;
            400: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly completeSession: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly stats: {
            200: import("typebox").TObject<{
                totalSessions: import("typebox").TNumber;
                completedSessions: import("typebox").TNumber;
                inProgressSessions: import("typebox").TNumber;
                averageQuestions: import("typebox").TNumber;
                averageResponses: import("typebox").TNumber;
                totalInterviews: import("typebox").TNumber;
                completedInterviews: import("typebox").TNumber;
                averageScore: import("typebox").TNumber;
                improvementTrend: import("typebox").TNumber;
            }>;
        };
    };
    readonly jobs: {
        readonly list: {
            readonly 200: import("typebox").TObject<{
                jobs: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    location: import("typebox").TString;
                    remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                    description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                    matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                    matchReason: import("typebox").TOptional<import("typebox").TString>;
                    rank: import("typebox").TOptional<import("typebox").TNumber>;
                }>>;
                page: import("typebox").TNumber;
                limit: import("typebox").TNumber;
                total: import("typebox").TNumber;
            }>;
        };
        readonly entity: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                title: import("typebox").TString;
                company: import("typebox").TString;
                location: import("typebox").TString;
                remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
                matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                matchReason: import("typebox").TOptional<import("typebox").TString>;
                rank: import("typebox").TOptional<import("typebox").TNumber>;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly save: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TOptional<import("typebox").TString>;
                saved: import("typebox").TOptional<import("typebox").TObject<{
                    id: import("typebox").TString;
                    jobId: import("typebox").TString;
                    savedAt: import("typebox").TString;
                }>>;
                id: import("typebox").TOptional<import("typebox").TString>;
                jobId: import("typebox").TOptional<import("typebox").TString>;
                savedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 201: import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                savedAt: import("typebox").TString;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly deleteSaved: {
            readonly 200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
                deleted: import("typebox").TUnknown;
            }>;
        };
        readonly savedList: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                savedAt: import("typebox").TString;
                job: import("typebox").TUnion<[import("typebox").TObject<{
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    location: import("typebox").TString;
                    remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                    description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                    matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                    matchReason: import("typebox").TOptional<import("typebox").TString>;
                    rank: import("typebox").TOptional<import("typebox").TNumber>;
                }>, import("typebox").TNull]>;
            }>>;
        };
        readonly apply: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TOptional<import("typebox").TString>;
                application: import("typebox").TOptional<import("typebox").TObject<{
                    id: import("typebox").TString;
                    jobId: import("typebox").TString;
                    status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                    appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                id: import("typebox").TOptional<import("typebox").TString>;
                jobId: import("typebox").TOptional<import("typebox").TString>;
                status: import("typebox").TOptional<import("typebox").TString>;
                appliedDate: import("typebox").TOptional<import("typebox").TString>;
                notes: import("typebox").TOptional<import("typebox").TString>;
                timeline: import("typebox").TOptional<import("typebox").TArray<import("typebox").TUnknown>>;
            }>;
            readonly 201: import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly updateApplication: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly applicationsList: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>>;
        };
        readonly recommendations: {
            readonly 200: import("typebox").TObject<{
                recommendations: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    location: import("typebox").TString;
                    remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                    description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                    matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                    matchReason: import("typebox").TOptional<import("typebox").TString>;
                    rank: import("typebox").TOptional<import("typebox").TNumber>;
                }>>;
                reason: import("typebox").TString;
                aiPowered: import("typebox").TBoolean;
                provider: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly refresh: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                status: import("typebox").TString;
                totalJobs: import("typebox").TNumber;
                newJobs: import("typebox").TNumber;
                updatedJobs: import("typebox").TNumber;
            }>;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
    };
    readonly portfolio: {
        readonly profile: {
            200: import("typebox").TUnknown;
        };
        readonly mutation: {
            200: import("typebox").TUnknown;
        };
        readonly projectMutation: {
            200: import("typebox").TUnknown;
            201: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
        readonly projectReorder: {
            200: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
        readonly projectDelete: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly export: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
    };
    readonly resume: {
        readonly questionGenerate: {
            200: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
        readonly questionSynthesize: {
            201: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
        readonly list: {
            200: import("typebox").TUnknown;
        };
        readonly entity: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly create: {
            201: import("typebox").TUnknown;
        };
        readonly update: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly delete: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly export: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
        readonly enhance: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
        readonly score: {
            200: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
            500: import("typebox").TUnknown;
        };
    };
    readonly scraper: {
        readonly operation: {
            readonly 200: import("typebox").TObject<{
                scraped: import("typebox").TNumber;
                upserted: import("typebox").TNumber;
                errors: import("typebox").TArray<import("typebox").TString>;
                enrichment: import("typebox").TObject<{
                    enabled: import("typebox").TBoolean;
                    enrichedRecords: import("typebox").TNumber;
                    warnings: import("typebox").TArray<import("typebox").TString>;
                    provider: import("typebox").TOptional<import("typebox").TString>;
                    model: import("typebox").TOptional<import("typebox").TString>;
                }>;
            }>;
            readonly 400: import("typebox").TObject<{
                error: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly error: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
    readonly search: {
        readonly all: {
            200: import("typebox").TObject<{
                query: import("typebox").TString;
                results: import("typebox").TArray<import("typebox").TObject<{
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"jobs">, import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"skills">, import("typebox").TLiteral<"resumes">]>;
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    subtitle: import("typebox").TString;
                    snippet: import("typebox").TString;
                    relevance: import("typebox").TNumber;
                }>>;
                counts: import("typebox").TObject<{
                    jobs: import("typebox").TNumber;
                    studios: import("typebox").TNumber;
                    skills: import("typebox").TNumber;
                    resumes: import("typebox").TNumber;
                }>;
                totalTime: import("typebox").TNumber;
            }>;
        };
        readonly autocomplete: {
            200: import("typebox").TArray<import("typebox").TObject<{
                text: import("typebox").TString;
                type: import("typebox").TString;
            }>>;
        };
    };
    readonly settings: {
        readonly read: {
            readonly 200: import("typebox").TUnknown;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly update: {
            readonly 200: import("typebox").TUnknown;
            readonly 422: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly jobTaxonomyUpdate: {
            readonly 200: import("typebox").TUnknown;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly apiKeysUpdate: {
            readonly 200: import("typebox").TUnknown;
            readonly 500: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly providerTest: {
            readonly 200: import("typebox").TUnknown;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly export: {
            readonly 200: import("typebox").TUnknown;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly import: {
            readonly 200: import("typebox").TUnknown;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
    };
    readonly skillMapping: {
        readonly list: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                gameExpression: import("typebox").TString;
                transferableSkill: import("typebox").TString;
                industryApplications: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
                evidence: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>;
                confidence: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
                category: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                demandLevel: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                aiGenerated: import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>;
                createdAt: import("typebox").TString;
                updatedAt: import("typebox").TString;
            }>>;
        };
        readonly create: {
            201: import("typebox").TObject<{
                id: import("typebox").TString;
                gameExpression: import("typebox").TString;
                transferableSkill: import("typebox").TString;
                industryApplications: import("typebox").TArray<import("typebox").TString>;
                evidenceSuggestions: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                evidence: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TString;
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    url: import("typebox").TOptional<import("typebox").TString>;
                    verificationStatus: import("typebox").TString;
                }>>;
                confidence: import("typebox").TNumber;
                category: import("typebox").TString;
                demandLevel: import("typebox").TString;
                verified: import("typebox").TBoolean;
                aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
            }>;
        };
        readonly update: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                gameExpression: import("typebox").TString;
                transferableSkill: import("typebox").TString;
                industryApplications: import("typebox").TArray<import("typebox").TString>;
                evidenceSuggestions: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                evidence: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TString;
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    url: import("typebox").TOptional<import("typebox").TString>;
                    verificationStatus: import("typebox").TString;
                }>>;
                confidence: import("typebox").TNumber;
                category: import("typebox").TString;
                demandLevel: import("typebox").TString;
                verified: import("typebox").TBoolean;
                aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
            }>;
            404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly delete: {
            200: import("typebox").TUnknown;
            410: import("typebox").TUnknown;
            404: import("typebox").TUnknown;
        };
        readonly pathways: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                title: import("typebox").TString;
                description: import("typebox").TString;
                detailedDescription: import("typebox").TOptional<import("typebox").TString>;
                matchScore: import("typebox").TNumber;
                stages: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    duration: import("typebox").TString;
                    description: import("typebox").TString;
                    completed: import("typebox").TOptional<import("typebox").TBoolean>;
                    current: import("typebox").TOptional<import("typebox").TBoolean>;
                    requirements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    outcomes: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                requiredSkills: import("typebox").TArray<import("typebox").TString>;
                estimatedTimeToEntry: import("typebox").TString;
                icon: import("typebox").TOptional<import("typebox").TString>;
                averageSalary: import("typebox").TOptional<import("typebox").TObject<{
                    min: import("typebox").TNumber;
                    max: import("typebox").TNumber;
                    currency: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                jobMarketTrend: import("typebox").TString;
            }>>;
        };
        readonly readiness: {
            200: import("typebox").TObject<{
                overallScore: import("typebox").TNumber;
                categories: import("typebox").TObject<{
                    technical: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                    softSkills: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                    industryKnowledge: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                    portfolio: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                }>;
                improvementSuggestions: import("typebox").TArray<import("typebox").TString>;
                nextSteps: import("typebox").TArray<import("typebox").TString>;
                targetRoleReadiness: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
                    roleId: import("typebox").TString;
                    roleTitle: import("typebox").TString;
                    readinessScore: import("typebox").TNumber;
                    missingSkills: import("typebox").TArray<import("typebox").TString>;
                    matchingSkills: import("typebox").TArray<import("typebox").TString>;
                    timeToReady: import("typebox").TOptional<import("typebox").TString>;
                    recommendedActions: import("typebox").TArray<import("typebox").TString>;
                }>>>;
                jobId: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly analysis: {
            200: import("typebox").TObject<{
                message: import("typebox").TString;
                detectedSkills: import("typebox").TArray<import("typebox").TString>;
                suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                recommendations: import("typebox").TArray<import("typebox").TString>;
                provider: import("typebox").TOptional<import("typebox").TString>;
            }>;
            500: import("typebox").TObject<{
                message: import("typebox").TString;
                detectedSkills: import("typebox").TArray<import("typebox").TString>;
                suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                recommendations: import("typebox").TArray<import("typebox").TString>;
                provider: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
    };
    readonly stats: {
        readonly dashboard: {
            readonly 200: import("typebox").TObject<{
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
        };
        readonly weekly: {
            readonly 200: import("typebox").TObject<{
                days: import("typebox").TArray<import("typebox").TObject<{
                    date: import("typebox").TString;
                    actions: import("typebox").TNumber;
                    xpEarned: import("typebox").TNumber;
                }>>;
                topCategory: import("typebox").TString;
                totalXP: import("typebox").TNumber;
            }>;
        };
        readonly career: {
            readonly 200: import("typebox").TObject<{
                skillCoverage: import("typebox").TNumber;
                applicationSuccessRate: import("typebox").TNumber;
                interviewTrend: import("typebox").TArray<import("typebox").TNumber>;
            }>;
        };
    };
    readonly studio: {
        readonly list: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>>;
        };
        readonly entity: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 201: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly delete: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                id: import("typebox").TString;
            }>;
            readonly 404: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                details: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                id: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly analytics: {
            readonly 200: import("typebox").TObject<{
                totalStudios: import("typebox").TNumber;
                byType: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
                bySize: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
                remoteWorkStudios: import("typebox").TNumber;
                topTechnologies: import("typebox").TArray<import("typebox").TObject<{
                    name: import("typebox").TString;
                    count: import("typebox").TNumber;
                }>>;
            }>;
        };
    };
    readonly user: {
        readonly profile: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                email: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                phone: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                linkedin: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                github: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                summary: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                currentRole: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                currentCompany: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                yearsExperience: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
                technicalSkills: import("typebox").TArray<import("typebox").TString>;
                softSkills: import("typebox").TArray<import("typebox").TString>;
                gamingExperience: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
                careerGoals: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
                createdAt: import("typebox").TString;
                updatedAt: import("typebox").TString;
            }>;
        };
    };
};
