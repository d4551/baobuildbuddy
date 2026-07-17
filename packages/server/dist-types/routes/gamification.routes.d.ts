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
                    200: import("@bao/shared/types/gamification").UserGamificationData;
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
                        error: string;
                        xp?: undefined;
                        level?: undefined;
                        leveledUp?: undefined;
                        levelUp?: undefined;
                        reason?: undefined;
                        message?: undefined;
                    } | {
                        error?: undefined;
                        xp: number;
                        level: number;
                        leveledUp: boolean;
                        levelUp: import("@bao/shared/types/gamification").LevelUpResult | null;
                        reason: string;
                        message: string;
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
                    200: import("@bao/shared/types/gamification").Achievement[];
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
                        challenges: import("@bao/shared/types/gamification").DailyChallenge[];
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
                                level?: undefined;
                                message: string;
                                completed: boolean;
                                challengeId?: undefined;
                                totalXP?: undefined;
                            } | {
                                message: string;
                                challengeId: string;
                                completed: boolean;
                                totalXP: number;
                                level: number;
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
                    200: import("../services/gamification-definitions").WeeklyProgressResult;
                };
                error: never;
            };
        };
    };
}, import("elysia/types").DefaultEphemeral, import("elysia/types").DefaultEphemeral, "get", "/monthly", import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<import("elysia").InputSchema<never>, {}, `${string}/monthly`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, () => Promise<{
    totalXP: number;
    levelsGained: number;
    achievementsUnlocked: number;
    challengesCompleted: number;
    actionsCount: number;
    streakDays: number;
}>>;
