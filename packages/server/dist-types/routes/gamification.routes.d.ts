import { Elysia } from "elysia";
export declare const gamificationRoutes: Elysia<"/gamification", {
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
    gamification: {
        progress: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").UserGamificationData;
                };
            };
        };
    };
} & {
    gamification: {
        "award-xp": {
            post: {
                body: {
                    reason: string;
                    amount: number;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        xp: number;
                        level: number;
                        leveledUp: boolean;
                        levelUp: import("@bao/shared").LevelUpResult | null;
                        reason: string;
                        message: string;
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
    gamification: {
        achievements: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").Achievement[];
                };
            };
        };
    };
} & {
    gamification: {
        challenges: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        date: string;
                        challenges: import("@bao/shared").DailyChallenge[];
                        completedCount: number;
                        totalCount: number;
                    };
                };
            };
        };
    };
} & {
    gamification: {
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
    gamification: {
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
                        days: Array<{
                            date: string;
                            actions: number;
                            xpEarned: number;
                        }>;
                        topCategory: string;
                    };
                };
            };
        };
    };
} & {
    gamification: {
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
