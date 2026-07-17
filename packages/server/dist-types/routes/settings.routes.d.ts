import { Elysia } from "elysia";
export declare const settingsRoutes: Elysia<string, "local", {
    decorator: {};
    store: {};
    derive: {};
}, {
    typebox: {};
    error: [];
}, import("elysia/types").DefaultMetadata, {
    [x: string]: {
        get: {
            body: unknown;
            params: {};
            query: unknown;
            headers: unknown;
            response: {
                200: {
                    automationSettings: import("@bao/shared/types/settings-contracts").AutomationSettings | null;
                    localModelEndpoint: string | null;
                    aiRouting: import("@bao/shared/types/ai").AIRouting;
                    providerDiagnostics: Partial<Record<"claude" | "gemini" | "huggingface" | "local" | "openai", import("@bao/shared/types/ai").AIProviderDiagnostic>> | undefined;
                    preferredProvider: string | null;
                    preferredModel: string | null;
                    theme: import("@bao/shared/constants/branding").AppDataTheme;
                    brandSettings: import("@bao/shared/types/settings-contracts").BrandSettings;
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
                    jobTaxonomy: import("@bao/shared/types/jobs-taxonomy").JobTaxonomySettings;
                    createdAt: string;
                    emailTransportSettings: import("@bao/shared/types/settings-contracts").EmailTransportSettings | null;
                    id: string;
                    language: string | null;
                    localModelName: string | null;
                    notifications: Record<string, boolean> | null;
                    updatedAt: string;
                } | {
                    error: string;
                };
            };
            error: never;
        };
    };
} & {
    [x: string]: {
        put: {
            body: {
                aiRouting?: {
                    chat: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    interviewQuestions: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    interviewFeedback: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    resume: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    coverLetter: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    emailResponse: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    jobMatch: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    scrapeEnrichment: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                    automationFieldMapping: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        model?: string | undefined;
                    };
                } | undefined;
                preferredProvider?: "claude" | "gemini" | "huggingface" | "local" | "openai" | undefined;
                preferredModel?: string | undefined;
                theme?: "bao-dark" | "bao-light" | "business" | "corporate" | undefined;
                language?: "en-US" | "es-ES" | "fr-FR" | "ja-JP" | undefined;
                brandSettings?: {
                    name?: string | undefined;
                    assistantName?: string | undefined;
                    apiName?: string | undefined;
                    logoPath?: string | undefined;
                    faviconPath?: string | undefined;
                    typography?: {
                        fontStylesheetUrl?: string | undefined;
                        displayFontFamily?: string | undefined;
                        bodyFontFamily?: string | undefined;
                        monoFontFamily?: string | undefined;
                    } | undefined;
                    lightTheme?: {
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
                        success?: string | undefined;
                        successContent?: string | undefined;
                        warning?: string | undefined;
                        warningContent?: string | undefined;
                        error?: string | undefined;
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
                        success?: string | undefined;
                        successContent?: string | undefined;
                        warning?: string | undefined;
                        warningContent?: string | undefined;
                        error?: string | undefined;
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
                    content?: {
                        tagline?: string | undefined;
                        defaultTitle?: string | undefined;
                        defaultDescription?: string | undefined;
                        contentOverrides?: Record<string, string> | undefined;
                    } | undefined;
                } | undefined;
                notifications?: {
                    achievements?: boolean | undefined;
                    dailyChallenges?: boolean | undefined;
                    jobAlerts?: boolean | undefined;
                    levelUp?: boolean | undefined;
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
                            provider: "browser" | "custom" | "huggingface" | "local" | "openai";
                            model: string;
                            endpoint: string;
                        };
                        tts: {
                            provider: "browser" | "custom" | "huggingface" | "local" | "openai";
                            model: string;
                            endpoint: string;
                            voice: string;
                            format: "mp3" | "wav";
                        };
                    } | undefined;
                    jobProviders?: {
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
                            board: string;
                            company: string;
                            enabled: boolean;
                        }[];
                        leverApiBaseUrl: string;
                        leverMaxPages: number;
                        leverCompanies: {
                            slug: string;
                            company: string;
                            enabled: boolean;
                        }[];
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
                        companyBoards: {
                            name: string;
                            token: string;
                            type: "ashby" | "greenhouse" | "lever" | "recruitee" | "smartrecruiters" | "teamtailor" | "workable" | "workday";
                            enabled: boolean;
                            priority: number;
                        }[];
                        gamingPortals: {
                            id: "gamesjobsdirect" | "grackle" | "hitmarker" | "pocketgamer" | "remotegamejobs" | "workwithindies";
                            name: string;
                            source: string;
                            fallbackUrl: string;
                            enabled: boolean;
                        }[];
                    } | undefined;
                } | undefined;
                emailTransportSettings?: {
                    host?: string | undefined;
                    port?: number | undefined;
                    security?: "plain" | "starttls" | "tls" | undefined;
                    username?: string | undefined;
                    fromEmail?: string | undefined;
                    fromName?: string | undefined;
                    authMethod?: "login" | "plain" | undefined;
                    connectionTimeoutSeconds?: number | undefined;
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
                    error?: undefined;
                    success: boolean;
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
    } & {
        "job-taxonomy": {
            put: {
                body: {
                    keywords: {
                        id: string;
                        category: "genre" | "hybrid-location" | "platform" | "remote-location" | "requirement" | "role" | "technology";
                        label: string;
                        synonyms: string[];
                        sortOrder: number;
                        enabled: boolean;
                    }[];
                    studioRules: {
                        id: string;
                        studioType: import("@bao/shared/types/jobs").StudioType;
                        keyword: string;
                        sortOrder: number;
                        enabled: boolean;
                    }[];
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        success: boolean;
                        jobTaxonomy: import("@bao/shared/types/jobs-taxonomy").JobTaxonomySettings;
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
    } & {
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
    } & {
        "test-api-key": {
            post: {
                body: {
                    provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    key: string;
                    model?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        error?: undefined;
                        valid: boolean;
                        provider: "local";
                        diagnosticCode: "empty-model-list" | "error" | "healthy" | "invalid-model" | "timeout" | "unconfigured" | "unreachable";
                        message: string | undefined;
                        availableModels: readonly string[] | undefined;
                        selectedModel: string | undefined;
                    } | {
                        message?: undefined;
                        availableModels?: undefined;
                        selectedModel?: undefined;
                        valid: boolean;
                        provider: "claude" | "gemini" | "huggingface" | "openai";
                        error: string;
                        diagnosticCode?: undefined;
                    } | {
                        error?: undefined;
                        availableModels?: undefined;
                        selectedModel?: undefined;
                        valid: boolean;
                        provider: "claude" | "gemini" | "huggingface" | "openai";
                        diagnosticCode: "error" | "healthy";
                        message: string | undefined;
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
    } & {
        export: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/data-service-contracts").BaoExportData;
                };
                error: never;
            };
        };
    } & {
        import: {
            post: {
                body: {
                    version: "1.0";
                    exportedAt: string;
                    profile: string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null;
                    settings: string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null;
                    resumes: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                    coverLetters: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                    portfolio: string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null;
                    portfolioProjects: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                    interviewSessions: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                    gamification: string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null;
                    applications: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                    chatHistory: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                    savedJobs: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                    skillMappings: (string | number | boolean | Record<string, string | number | boolean | null>[] | (string | number | boolean | null)[] | Record<string, string | number | boolean | null> | Record<string, string | number | boolean | (string | number | boolean | null)[] | null> | null)[];
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/data-service-contracts").ImportResult;
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
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {};
    error: [];
}>;
