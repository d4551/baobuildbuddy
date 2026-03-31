import { Elysia } from "elysia";
export declare const settingsRoutes: Elysia<string, {
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
    [x: string]: {};
} & {
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
                    providerDiagnostics: Partial<Record<"openai" | "huggingface" | "local" | "gemini" | "claude", import("@bao/shared/types/ai").AIProviderDiagnostic>> | undefined;
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
                    id: string;
                    createdAt: string;
                    updatedAt: string;
                    localModelName: string | null;
                    language: string | null;
                    notifications: Record<string, boolean> | null;
                    emailTransportSettings: import("@bao/shared/types/settings-contracts").EmailTransportSettings | null;
                } | {
                    error: string;
                };
            };
        };
    };
} & {
    [x: string]: {
        put: {
            body: {} & {
                theme?: "corporate" | "business" | "bao-dark" | "bao-light" | undefined;
                aiRouting?: ({
                    chat: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    interviewQuestions: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    interviewFeedback: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    resume: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    coverLetter: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    emailResponse: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    jobMatch: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    scrapeEnrichment: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                    automationFieldMapping: {
                        provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    } & {
                        model?: string | undefined;
                    };
                } & {}) | undefined;
                preferredProvider?: "openai" | "huggingface" | "local" | "gemini" | "claude" | undefined;
                preferredModel?: string | undefined;
                language?: "en-US" | "es-ES" | "fr-FR" | "ja-JP" | undefined;
                brandSettings?: {
                    readonly name?: string | undefined;
                    readonly assistantName?: string | undefined;
                    readonly apiName?: string | undefined;
                    readonly logoPath?: string | undefined;
                    readonly faviconPath?: string | undefined;
                    readonly typography?: {
                        readonly fontStylesheetUrl?: string | undefined;
                        readonly displayFontFamily?: string | undefined;
                        readonly bodyFontFamily?: string | undefined;
                        readonly monoFontFamily?: string | undefined;
                    } | undefined;
                    readonly lightTheme?: {
                        readonly base100?: string | undefined;
                        readonly base200?: string | undefined;
                        readonly base300?: string | undefined;
                        readonly baseContent?: string | undefined;
                        readonly primary?: string | undefined;
                        readonly primaryContent?: string | undefined;
                        readonly secondary?: string | undefined;
                        readonly secondaryContent?: string | undefined;
                        readonly accent?: string | undefined;
                        readonly accentContent?: string | undefined;
                        readonly neutral?: string | undefined;
                        readonly neutralContent?: string | undefined;
                        readonly info?: string | undefined;
                        readonly infoContent?: string | undefined;
                        readonly success?: string | undefined;
                        readonly successContent?: string | undefined;
                        readonly warning?: string | undefined;
                        readonly warningContent?: string | undefined;
                        readonly error?: string | undefined;
                        readonly errorContent?: string | undefined;
                        readonly radiusSelector?: string | undefined;
                        readonly radiusField?: string | undefined;
                        readonly radiusBox?: string | undefined;
                        readonly sizeSelector?: string | undefined;
                        readonly sizeField?: string | undefined;
                        readonly border?: string | undefined;
                        readonly depth?: string | undefined;
                        readonly noise?: string | undefined;
                    } | undefined;
                    readonly darkTheme?: {
                        readonly base100?: string | undefined;
                        readonly base200?: string | undefined;
                        readonly base300?: string | undefined;
                        readonly baseContent?: string | undefined;
                        readonly primary?: string | undefined;
                        readonly primaryContent?: string | undefined;
                        readonly secondary?: string | undefined;
                        readonly secondaryContent?: string | undefined;
                        readonly accent?: string | undefined;
                        readonly accentContent?: string | undefined;
                        readonly neutral?: string | undefined;
                        readonly neutralContent?: string | undefined;
                        readonly info?: string | undefined;
                        readonly infoContent?: string | undefined;
                        readonly success?: string | undefined;
                        readonly successContent?: string | undefined;
                        readonly warning?: string | undefined;
                        readonly warningContent?: string | undefined;
                        readonly error?: string | undefined;
                        readonly errorContent?: string | undefined;
                        readonly radiusSelector?: string | undefined;
                        readonly radiusField?: string | undefined;
                        readonly radiusBox?: string | undefined;
                        readonly sizeSelector?: string | undefined;
                        readonly sizeField?: string | undefined;
                        readonly border?: string | undefined;
                        readonly depth?: string | undefined;
                        readonly noise?: string | undefined;
                    } | undefined;
                    readonly content?: {
                        readonly tagline?: string | undefined;
                        readonly defaultTitle?: string | undefined;
                        readonly defaultDescription?: string | undefined;
                        readonly contentOverrides?: Record<string, string> | undefined;
                    } | undefined;
                } | undefined;
                notifications?: ({} & {
                    achievements?: boolean | undefined;
                    dailyChallenges?: boolean | undefined;
                    levelUp?: boolean | undefined;
                    jobAlerts?: boolean | undefined;
                }) | undefined;
                automationSettings?: ({} & {
                    headless?: boolean | undefined;
                    defaultTimeout?: number | undefined;
                    screenshotRetention?: number | undefined;
                    maxConcurrentRuns?: number | undefined;
                    defaultBrowser?: "chrome" | "chromium" | "edge" | undefined;
                    enableSmartSelectors?: boolean | undefined;
                    autoSaveScreenshots?: boolean | undefined;
                    speech?: {
                        readonly locale: string;
                        readonly stt: {
                            provider: "browser" | "openai" | "huggingface" | "local" | "custom";
                            model: string;
                            endpoint: string;
                        };
                        readonly tts: {
                            voice: string;
                            format: "mp3" | "wav";
                            provider: "browser" | "openai" | "huggingface" | "local" | "custom";
                            model: string;
                            endpoint: string;
                        };
                    } | undefined;
                    jobProviders?: {
                        readonly providerTimeoutMs: number;
                        readonly companyBoardResultLimit: number;
                        readonly gamingBoardResultLimit: number;
                        readonly unknownLocationLabel: string;
                        readonly unknownCompanyLabel: string;
                        readonly hitmarkerEnabled: boolean;
                        readonly hitmarkerApiBaseUrl: string;
                        readonly hitmarkerDefaultQuery: string;
                        readonly hitmarkerDefaultLocation: string;
                        readonly greenhouseApiBaseUrl: string;
                        readonly greenhouseMaxPages: number;
                        readonly greenhouseBoards: {
                            readonly board: string;
                            readonly company: string;
                            readonly enabled: boolean;
                        }[];
                        readonly leverApiBaseUrl: string;
                        readonly leverMaxPages: number;
                        readonly leverCompanies: {
                            readonly slug: string;
                            readonly company: string;
                            readonly enabled: boolean;
                        }[];
                        readonly companyBoardApiTemplates: {
                            readonly greenhouse: string;
                            readonly lever: string;
                            readonly recruitee: string;
                            readonly workable: string;
                            readonly ashby: string;
                            readonly smartrecruiters: string;
                            readonly teamtailor: string;
                            readonly workday: string;
                        };
                        readonly companyBoards: {
                            readonly name: string;
                            readonly token: string;
                            readonly type: "greenhouse" | "lever" | "recruitee" | "workable" | "ashby" | "smartrecruiters" | "teamtailor" | "workday";
                            readonly enabled: boolean;
                            readonly priority: number;
                        }[];
                        readonly gamingPortals: {
                            readonly id: "hitmarker" | "grackle" | "workwithindies" | "remotegamejobs" | "gamesjobsdirect" | "pocketgamer";
                            readonly name: string;
                            readonly source: string;
                            readonly fallbackUrl: string;
                            readonly enabled: boolean;
                        }[];
                    } | undefined;
                }) | undefined;
                emailTransportSettings?: ({} & {
                    authMethod?: "plain" | "login" | undefined;
                    port?: number | undefined;
                    fromEmail?: string | undefined;
                    host?: string | undefined;
                    security?: "tls" | "starttls" | "plain" | undefined;
                    username?: string | undefined;
                    fromName?: string | undefined;
                    connectionTimeoutSeconds?: number | undefined;
                }) | undefined;
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
    [x: string]: {
        "job-taxonomy": {
            put: {
                body: {
                    readonly keywords: {
                        readonly id: string;
                        readonly category: "remote-location" | "hybrid-location" | "requirement" | "technology" | "genre" | "platform" | "role";
                        readonly label: string;
                        readonly synonyms: string[];
                        readonly sortOrder: number;
                        readonly enabled: boolean;
                    }[];
                    readonly studioRules: {
                        readonly id: string;
                        readonly studioType: import("@bao/shared/types/jobs").StudioType;
                        readonly keyword: string;
                        readonly sortOrder: number;
                        readonly enabled: boolean;
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
        "api-keys": {
            put: {
                body: {} & {
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
    [x: string]: {
        "test-api-key": {
            post: {
                body: {
                    provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                    key: string;
                } & {
                    model?: string | undefined;
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
                        provider: "openai" | "huggingface" | "gemini" | "claude";
                        error: string;
                        diagnosticCode?: undefined;
                        message?: undefined;
                        availableModels?: undefined;
                        selectedModel?: undefined;
                    } | {
                        valid: boolean;
                        provider: "openai" | "huggingface" | "gemini" | "claude";
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
    [x: string]: {
        export: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/data-service-contracts").BaoExportData;
                };
            };
        };
    };
} & {
    [x: string]: {
        import: {
            post: {
                body: {
                    portfolio: unknown;
                    gamification: unknown;
                    applications: unknown[];
                    resumes: unknown[];
                    settings: unknown;
                    chatHistory: unknown[];
                    coverLetters: unknown[];
                    interviewSessions: unknown[];
                    portfolioProjects: unknown[];
                    savedJobs: unknown[];
                    skillMappings: unknown[];
                    profile: unknown;
                    version: "1.0";
                    exportedAt: string;
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/data-service-contracts").ImportResult;
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
