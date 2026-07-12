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
        };
    };
} & {
    [x: string]: {
        put: {
            body: {} & {
                aiRouting?: ({
                    automationFieldMapping: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    chat: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    coverLetter: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    emailResponse: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    interviewFeedback: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    interviewQuestions: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    jobMatch: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    resume: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                    scrapeEnrichment: {
                        provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                    } & {
                        model?: string | undefined;
                    };
                } & {}) | undefined;
                automationSettings?: ({} & {
                    autoSaveScreenshots?: boolean | undefined;
                    defaultBrowser?: "chrome" | "chromium" | "edge" | undefined;
                    defaultTimeout?: number | undefined;
                    enableSmartSelectors?: boolean | undefined;
                    headless?: boolean | undefined;
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
                            readonly type: "ashby" | "greenhouse" | "lever" | "recruitee" | "smartrecruiters" | "teamtailor" | "workable" | "workday";
                            readonly enabled: boolean;
                            readonly priority: number;
                        }[];
                        readonly gamingPortals: {
                            readonly id: "gamesjobsdirect" | "grackle" | "hitmarker" | "pocketgamer" | "remotegamejobs" | "workwithindies";
                            readonly name: string;
                            readonly source: string;
                            readonly fallbackUrl: string;
                            readonly enabled: boolean;
                        }[];
                    } | undefined;
                    maxConcurrentRuns?: number | undefined;
                    screenshotRetention?: number | undefined;
                    speech?: {
                        readonly locale: string;
                        readonly stt: {
                            provider: "browser" | "custom" | "huggingface" | "local" | "openai";
                            model: string;
                            endpoint: string;
                        };
                        readonly tts: {
                            provider: "browser" | "custom" | "huggingface" | "local" | "openai";
                            model: string;
                            endpoint: string;
                            voice: string;
                            format: "mp3" | "wav";
                        };
                    } | undefined;
                }) | undefined;
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
                emailTransportSettings?: ({} & {
                    authMethod?: "login" | "plain" | undefined;
                    connectionTimeoutSeconds?: number | undefined;
                    fromEmail?: string | undefined;
                    fromName?: string | undefined;
                    host?: string | undefined;
                    port?: number | undefined;
                    security?: "plain" | "starttls" | "tls" | undefined;
                    username?: string | undefined;
                }) | undefined;
                language?: "en-US" | "es-ES" | "fr-FR" | "ja-JP" | undefined;
                notifications?: ({} & {
                    achievements?: boolean | undefined;
                    dailyChallenges?: boolean | undefined;
                    jobAlerts?: boolean | undefined;
                    levelUp?: boolean | undefined;
                }) | undefined;
                preferredModel?: string | undefined;
                preferredProvider?: "claude" | "gemini" | "huggingface" | "local" | "openai" | undefined;
                theme?: "bao-dark" | "bao-light" | "business" | "corporate" | undefined;
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
                    on: string;
                    summary?: string;
                    message?: string;
                    found?: unknown;
                    property?: string;
                    expected?: string;
                };
            };
        };
    } & {
        "job-taxonomy": {
            put: {
                body: {
                    readonly keywords: {
                        readonly id: string;
                        readonly category: "genre" | "hybrid-location" | "platform" | "remote-location" | "requirement" | "role" | "technology";
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
                        type: 'validation';
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
        "api-keys": {
            put: {
                body: {} & {
                    claudeApiKey?: string | undefined;
                    emailTransportPassword?: string | undefined;
                    geminiApiKey?: string | undefined;
                    huggingfaceToken?: string | undefined;
                    localModelEndpoint?: string | undefined;
                    localModelName?: string | undefined;
                    openaiApiKey?: string | undefined;
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
        "test-api-key": {
            post: {
                body: {
                    key: string;
                    provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                } & {
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
    } & {
        import: {
            post: {
                body: {
                    applications: unknown[];
                    chatHistory: unknown[];
                    coverLetters: unknown[];
                    exportedAt: string;
                    gamification: unknown;
                    interviewSessions: unknown[];
                    portfolio: unknown;
                    portfolioProjects: unknown[];
                    profile: unknown;
                    resumes: unknown[];
                    savedJobs: unknown[];
                    settings: unknown;
                    skillMappings: unknown[];
                    version: "1.0";
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("../services/data-service-contracts").ImportResult;
                    422: {
                        type: 'validation';
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
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
}>;
