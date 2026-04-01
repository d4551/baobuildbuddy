import { Elysia } from "elysia";
export declare const gamificationRoutes: Elysia<string, {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
}, {
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
            };
        };
    };
} & {
    [x: string]: {
        "award-xp": {
            post: {
                body: {
                    reason: string;
                    amount: number;
                } & {};
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
                        xp: number;
                        level: number;
                        leveledUp: boolean;
                        levelUp: import("@bao/shared/types/gamification").LevelUpResult | null;
                        reason: string;
                        message: string;
                        error?: undefined;
                    };
                    422: {
                        type: "validation";
                        on: string;
                        summary?: string;
                        message?: string;
                        found?: unknown;
                        property?: string;
                        expected?: string;
                    };
                };
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
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                message: string;
                                completed: boolean;
                                challengeId?: undefined;
                                totalXP?: undefined;
                                level?: undefined;
                            } | {
                                message: string;
                                challengeId: string;
                                completed: boolean;
                                totalXP: number;
                                level: number;
                            };
                            422: {
                                type: "validation";
                                on: string;
                                summary?: string;
                                message?: string;
                                found?: unknown;
                                property?: string;
                                expected?: string;
                            };
                        };
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
            };
        };
    };
} & {
    [x: string]: {
        monthly: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        totalXP: number;
                        levelsGained: number;
                        achievementsUnlocked: number;
                        challengesCompleted: number;
                        actionsCount: number;
                        streakDays: number;
                    };
                };
            };
        };
    };
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
