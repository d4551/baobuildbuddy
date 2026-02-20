import type { AutomationSettings } from "@bao/shared";
import { Elysia } from "elysia";
export declare const settingsRoutes: Elysia<"/settings", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
} & {
    error: {};
    typebox: import("@sinclair/typebox").TModule<{}, {}>;
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {
    settings: {};
} & {
    settings: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    error: string;
                } | {
                    geminiApiKey: string | null;
                    openaiApiKey: string | null;
                    claudeApiKey: string | null;
                    huggingfaceToken: string | null;
                    hasGeminiKey: boolean;
                    hasOpenaiKey: boolean;
                    hasClaudeKey: boolean;
                    hasHuggingfaceToken: boolean;
                    hasLocalKey: boolean;
                    id: string;
                    localModelEndpoint: string | null;
                    localModelName: string | null;
                    preferredProvider: string | null;
                    preferredModel: string | null;
                    theme: string | null;
                    language: string | null;
                    notifications: Record<string, boolean> | null;
                    automationSettings: AutomationSettings | null;
                    createdAt: string;
                    updatedAt: string;
                    error?: undefined;
                };
            };
        };
    };
} & {
    settings: {
        put: {
            body: {
                notifications?: {
                    achievements?: boolean | undefined;
                    dailyChallenges?: boolean | undefined;
                    levelUp?: boolean | undefined;
                    jobAlerts?: boolean | undefined;
                } | undefined;
                automationSettings?: {
                    headless?: boolean | undefined;
                    defaultTimeout?: number | undefined;
                    screenshotRetention?: number | undefined;
                    maxConcurrentRuns?: number | undefined;
                    defaultBrowser?: undefined;
                    enableSmartSelectors?: boolean | undefined;
                    autoSaveScreenshots?: boolean | undefined;
                    jobProviders?: {
                        companyBoardApiTemplates: {
                            greenhouse: string;
                            lever: string;
                            recruitee: string;
                            workable: string;
                            ashby: string;
                            smartrecruiters: string;
                            teamtailor: string;
                            workday: string;
                        };
                        providerTimeoutMs: number;
                        companyBoardResultLimit: number;
                        gamingBoardResultLimit: number;
                        unknownLocationLabel: string;
                        unknownCompanyLabel: string;
                        hitmarkerApiBaseUrl: string;
                        hitmarkerDefaultQuery: string;
                        hitmarkerDefaultLocation: string;
                        greenhouseApiBaseUrl: string;
                        greenhouseMaxPages: number;
                        greenhouseBoards: {
                            enabled: boolean;
                            board: string;
                            company: string;
                        }[];
                        leverApiBaseUrl: string;
                        leverMaxPages: number;
                        leverCompanies: {
                            enabled: boolean;
                            company: string;
                            slug: string;
                        }[];
                        companyBoards: {
                            name: string;
                            type: never;
                            token: string;
                            enabled: boolean;
                            priority: number;
                        }[];
                        gamingPortals: {
                            source: string;
                            name: string;
                            id: never;
                            enabled: boolean;
                            fallbackUrl: string;
                        }[];
                    } | undefined;
                } | undefined;
                preferredProvider?: undefined;
                preferredModel?: string | undefined;
                theme?: "bao-light" | "bao-dark" | undefined;
                language?: undefined;
            };
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    success: boolean;
                    error: string;
                } | {
                    success: boolean;
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
} & {
    settings: {
        "api-keys": {
            put: {
                body: {
                    geminiApiKey?: string | undefined;
                    openaiApiKey?: string | undefined;
                    claudeApiKey?: string | undefined;
                    huggingfaceToken?: string | undefined;
                    localModelEndpoint?: string | undefined;
                    localModelName?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
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
    settings: {
        "test-api-key": {
            post: {
                body: {
                    provider: never;
                    key: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        valid: boolean;
                        provider: never;
                        error: string;
                    } | {
                        valid: boolean;
                        provider: never;
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
    settings: {
        export: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/data-service").BaoExportData;
                };
            };
        };
    };
} & {
    settings: {
        import: {
            post: {
                body: {
                    portfolio: string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null;
                    profile: string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null;
                    settings: string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null;
                    applications: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    resumes: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    gamification: string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null;
                    savedJobs: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    coverLetters: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    portfolioProjects: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    interviewSessions: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    skillMappings: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    chatHistory: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    version: "1.0";
                    exportedAt: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/data-service").ImportResult;
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
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}>;
