export declare const gamificationRoutes: import("elysia/types").AddRoute<string, "local", import("elysia/types").DefaultSingleton, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        progress: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        xp: number;
                        level: number;
                        achievements: string[];
                        dailyChallenges: Record<string, string[]>;
                        longestStreak: number;
                        currentStreak: number;
                        lastActiveDate?: string | undefined;
                        stats: Record<string, unknown>;
                        xpForNextLevel?: number | undefined;
                        streak?: number | undefined;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        "award-xp": {
            post: {
                body: {
                    amount: number;
                    reason: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        xp: number;
                        level: number;
                        leveledUp: boolean;
                        levelUp: {
                            xpGained: number;
                            oldLevel: number;
                            newLevel: number;
                            oldTitle: string;
                            newTitle: string;
                            unlockedFeatures: string[];
                            bonusXP?: number | undefined;
                        } | null;
                        reason: string;
                        message: string;
                    };
                    400: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    422: {
                        type: 'validation';
                        title: 'Validation Error';
                        status: 422;
                        detail?: string;
                        on: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        achievements: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        name: string;
                        description: string;
                        icon: string;
                        iconType: "custom" | "emoji";
                        category: "milestone" | "progress" | "skill" | "social" | "special";
                        xpReward: number;
                        requirements: Record<string, number>;
                        unlocked: boolean;
                        unlockedAt?: string | undefined;
                        rarity: "common" | "epic" | "legendary" | "rare";
                        hidden?: boolean | undefined;
                    }[];
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        challenges: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        date: string;
                        challenges: {
                            id: string;
                            name: string;
                            description: string;
                            icon: string;
                            iconType: "custom" | "emoji";
                            xpReward: number;
                            category: "engagement" | "job_search" | "profile" | "skill_building" | "social";
                            completed: boolean;
                            requirements?: Record<string, number> | undefined;
                            validUntil?: string | undefined;
                            progress?: number | undefined;
                            goal?: number | undefined;
                        }[];
                        completedCount: number;
                        totalCount: number;
                    };
                };
                error: never;
            };
        };
    };
} & {
    [x: string]: {
        challenges: {
            ":id": {
                complete: {
                    post: {
                        body: unknown;
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                message: string;
                                challengeId?: string | undefined;
                                completed: boolean;
                                totalXP?: number | undefined;
                                level?: number | undefined;
                            };
                            201: {
                                message: string;
                                challengeId?: string | undefined;
                                completed: boolean;
                                totalXP?: number | undefined;
                                level?: number | undefined;
                            };
                            400: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
                            };
                        };
                        error: never;
                    };
                };
            };
        };
    };
} & {
    [x: string]: {
        weekly: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        challengesCompleted: number;
                        xpEarned: number;
                        actionsCount: number;
                        days: {
                            date: string;
                            actions: number;
                            xpEarned: number;
                        }[];
                        topCategory: string;
                    };
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", "/monthly", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
    detail: {
        tags: string[];
    };
    response: {
        200: import("typebox").TObject<{
            totalXP: import("typebox").TNumber;
            levelsGained: import("typebox").TNumber;
            achievementsUnlocked: import("typebox").TNumber;
            challengesCompleted: import("typebox").TNumber;
            actionsCount: import("typebox").TNumber;
            streakDays: import("typebox").TNumber;
        }>;
    };
}, {}, `${string}/monthly`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, ({ status }: {
    body: unknown;
    query: Record<string, string | undefined>;
    params: {};
    headers: Record<string, string | undefined>;
    cookie: Record<string, import("elysia").Cookie<unknown>>;
    server: import("elysia").Server | null;
    redirect: import("elysia").redirect;
    set: {
        headers: import("elysia").HTTPHeaders;
        status?: number | keyof import("elysia").StatusMap;
        cookie?: Record<string, import("elysia").BaseCookie>;
    };
    readonly path: string;
    route?: string;
    rid?: string;
    request: Request;
    store: {};
    status: import("elysia").SelectiveStatus<{
        200: {
            totalXP: number;
            levelsGained: number;
            achievementsUnlocked: number;
            challengesCompleted: number;
            actionsCount: number;
            streakDays: number;
        };
    }>;
}) => Promise<import("elysia").ElysiaStatus<200, {
    totalXP: number;
    levelsGained: number;
    achievementsUnlocked: number;
    challengesCompleted: number;
    actionsCount: number;
    streakDays: number;
}, 200>>>;
