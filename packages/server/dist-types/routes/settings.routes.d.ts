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
                    aiRouting: import("@bao/shared").AIRouting;
                    providerDiagnostics: Partial<Record<"gemini" | "claude" | "openai" | "huggingface" | "local", import("@bao/shared").AIProviderDiagnostic>> | undefined;
                    preferredProvider: string | null;
                    preferredModel: string | null;
                    theme: import("@bao/shared").AppDataTheme;
                    brandSettings: import("@bao/shared").BrandSettings;
                    geminiApiKey: string | null;
                    openaiApiKey: string | null;
                    claudeApiKey: string | null;
                    huggingfaceToken: string | null;
                    hasGeminiKey: boolean;
                    hasOpenaiKey: boolean;
                    hasClaudeKey: boolean;
                    hasHuggingfaceToken: boolean;
                    hasEmailTransportPassword: boolean;
                    hasLocalKey: boolean;
                    id: string;
                    notifications: Record<string, boolean> | null;
                    automationSettings: import("@bao/shared").AutomationSettings | null;
                    emailTransportSettings: import("@bao/shared").EmailTransportSettings | null;
                    localModelEndpoint: string | null;
                    localModelName: string | null;
                    language: string | null;
                    updatedAt: string;
                    createdAt: string;
                } | {
                    error: string;
                };
            };
        };
    };
} & {
    settings: {
        put: {
            body: {
                aiRouting?: {
                    chat: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    interviewQuestions: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    interviewFeedback: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    resume: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    coverLetter: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    emailResponse: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    jobMatch: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    scrapeEnrichment: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                    automationFieldMapping: {
                        model?: string | undefined;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    };
                } | undefined;
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
                    defaultBrowser?: "chrome" | "chromium" | "edge" | undefined;
                    enableSmartSelectors?: boolean | undefined;
                    autoSaveScreenshots?: boolean | undefined;
                    speech?: {
                        locale: string;
                        stt: {
                            provider: "openai" | "huggingface" | "local" | "browser" | "custom";
                            model: string;
                            endpoint: string;
                        };
                        tts: {
                            provider: "openai" | "huggingface" | "local" | "browser" | "custom";
                            model: string;
                            format: "mp3" | "wav";
                            endpoint: string;
                            voice: string;
                        };
                    } | undefined;
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
                        hitmarkerEnabled: boolean;
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
                            type: "greenhouse" | "lever" | "recruitee" | "workable" | "ashby" | "smartrecruiters" | "teamtailor" | "workday";
                            token: string;
                            enabled: boolean;
                            priority: number;
                        }[];
                        gamingPortals: {
                            name: string;
                            id: "hitmarker" | "grackle" | "workwithindies" | "remotegamejobs" | "gamesjobsdirect" | "pocketgamer";
                            source: string;
                            enabled: boolean;
                            fallbackUrl: string;
                        }[];
                    } | undefined;
                } | undefined;
                emailTransportSettings?: {
                    host?: string | undefined;
                    port?: number | undefined;
                    security?: "tls" | "starttls" | "plain" | undefined;
                    username?: string | undefined;
                    fromEmail?: string | undefined;
                    fromName?: string | undefined;
                    authMethod?: "plain" | "login" | undefined;
                    connectionTimeoutSeconds?: number | undefined;
                } | undefined;
                preferredProvider?: "gemini" | "claude" | "openai" | "huggingface" | "local" | undefined;
                preferredModel?: string | undefined;
                theme?: "corporate" | "business" | "bao-dark" | "bao-light" | undefined;
                language?: "en-US" | "es-ES" | "fr-FR" | "ja-JP" | undefined;
                brandSettings?: {
                    name?: string | undefined;
                    assistantName?: string | undefined;
                    apiName?: string | undefined;
                    logoPath?: string | undefined;
                    faviconPath?: string | undefined;
                    content?: {
                        tagline?: string | undefined;
                        defaultTitle?: string | undefined;
                        defaultDescription?: string | undefined;
                        contentOverrides?: {} | undefined;
                    } | undefined;
                    typography?: {
                        fontStylesheetUrl?: string | undefined;
                        displayFontFamily?: string | undefined;
                        bodyFontFamily?: string | undefined;
                        monoFontFamily?: string | undefined;
                    } | undefined;
                    lightTheme?: {
                        error?: string | undefined;
                        success?: string | undefined;
                        base100?: string | undefined;
                        base200?: string | undefined;
                        base300?: string | undefined;
                        baseContent?: string | undefined;
                        primary?: string | undefined;
                        primaryContent?: string | undefined;
                        secondary?: string | undefined;
                        secondaryContent?: string | undefined;
                        accent?: string | undefined;
                        accentContent?: string | undefined;
                        neutral?: string | undefined;
                        neutralContent?: string | undefined;
                        info?: string | undefined;
                        infoContent?: string | undefined;
                        successContent?: string | undefined;
                        warning?: string | undefined;
                        warningContent?: string | undefined;
                        errorContent?: string | undefined;
                        radiusSelector?: string | undefined;
                        radiusField?: string | undefined;
                        radiusBox?: string | undefined;
                        sizeSelector?: string | undefined;
                        sizeField?: string | undefined;
                        border?: string | undefined;
                        depth?: string | undefined;
                        noise?: string | undefined;
                    } | undefined;
                    darkTheme?: {
                        error?: string | undefined;
                        success?: string | undefined;
                        base100?: string | undefined;
                        base200?: string | undefined;
                        base300?: string | undefined;
                        baseContent?: string | undefined;
                        primary?: string | undefined;
                        primaryContent?: string | undefined;
                        secondary?: string | undefined;
                        secondaryContent?: string | undefined;
                        accent?: string | undefined;
                        accentContent?: string | undefined;
                        neutral?: string | undefined;
                        neutralContent?: string | undefined;
                        info?: string | undefined;
                        infoContent?: string | undefined;
                        successContent?: string | undefined;
                        warning?: string | undefined;
                        warningContent?: string | undefined;
                        errorContent?: string | undefined;
                        radiusSelector?: string | undefined;
                        radiusField?: string | undefined;
                        radiusBox?: string | undefined;
                        sizeSelector?: string | undefined;
                        sizeField?: string | undefined;
                        border?: string | undefined;
                        depth?: string | undefined;
                        noise?: string | undefined;
                    } | undefined;
                } | undefined;
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
                    emailTransportPassword?: string | undefined;
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
                    model?: string | undefined;
                    provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                    key: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        valid: boolean;
                        provider: "local";
                        diagnosticCode: "healthy" | "unconfigured" | "unreachable" | "empty-model-list" | "invalid-model" | "timeout" | "error";
                        message: string | undefined;
                        availableModels: readonly string[] | undefined;
                        selectedModel: string | undefined;
                        error?: undefined;
                    } | {
                        valid: boolean;
                        provider: "gemini" | "claude" | "openai" | "huggingface";
                        error: string;
                        diagnosticCode?: undefined;
                        message?: undefined;
                        availableModels?: undefined;
                        selectedModel?: undefined;
                    } | {
                        valid: boolean;
                        provider: "gemini" | "claude" | "openai" | "huggingface";
                        diagnosticCode: "healthy" | "error";
                        message: string | undefined;
                        availableModels?: undefined;
                        selectedModel?: undefined;
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
                    gamification: string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null;
                    applications: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    resumes: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    chatHistory: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    coverLetters: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    interviewSessions: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    portfolioProjects: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    savedJobs: (string | number | boolean | never[] | {
                        [x: string]: never;
                    } | null)[];
                    skillMappings: (string | number | boolean | never[] | {
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
