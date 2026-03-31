import Type, { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
export declare const app: Elysia<"/api", {
    decorator: {};
    store: {
        readonly startTime?: number | undefined;
        readonly endTime?: number | undefined;
        readonly responseTime?: number | undefined;
    };
    derive: {
        readonly log: import("@bogeychan/elysia-logger/types").Logger;
    };
    resolve: {};
}, {
    typebox: {
        readonly HealthResponse: Type.TObject<{
            readonly status: Type.TString;
            readonly timestamp: Type.TString;
            readonly database: Type.TString;
            readonly uptime: Type.TNumber;
        }, "status" | "timestamp" | "database" | "uptime", never> & StandardSchemaV1<unknown, {
            status: string;
            timestamp: string;
            database: string;
            uptime: number;
        } & {}>;
        readonly ErrorResponse: Type.TObject<{
            readonly error: Type.TString;
            readonly code: Type.TOptional<Type.TString>;
            readonly fields: Type.TOptional<Type.TArray<Type.TString>>;
        }, "error", never> & StandardSchemaV1<unknown, {
            error: string;
        } & {
            code?: string | undefined;
            fields?: string[] | undefined;
        }>;
    };
    error: {};
} & {
    error: {};
    typebox: import("@sinclair/typebox").TModule<{}, {}>;
} & {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {};
} & {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
} & {
    schema: {};
    macro: {};
    macroFn: {};
    parser: {};
}, {
    api: {};
} & {
    api: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        status: string;
                        timestamp: string;
                        database: string;
                        uptime: number;
                    } & {};
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
    api: {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            configured: boolean;
                            authRequired: boolean;
                            bootstrapRequired: boolean;
                            setupTokenConfigured: boolean;
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            configured: boolean;
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                post: {
                    body: {} & {
                        setupToken?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            configured: boolean;
                            message: string;
                            apiKey?: undefined;
                        } | {
                            configured: boolean;
                            apiKey: string;
                            message: string;
                        };
                        400: {
                            readonly error: "Setup token is required";
                        };
                        403: {
                            readonly error: "Setup token bootstrap is unavailable";
                        } | {
                            readonly error: "Setup token is invalid";
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
} & {
    api: {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            name: string;
                            email: string | null;
                            phone: string | null;
                            location: string | null;
                            website: string | null;
                            linkedin: string | null;
                            github: string | null;
                            summary: string | null;
                            currentRole: string | null;
                            currentCompany: string | null;
                            yearsExperience: number | null;
                            technicalSkills: string[] | null;
                            softSkills: string[] | null;
                            gamingExperience: Record<string, unknown> | null;
                            careerGoals: Record<string, unknown> | null;
                            createdAt: string;
                            updatedAt: string;
                        } | {
                            id: string;
                            name: string;
                            technicalSkills: never[];
                            softSkills: never[];
                            gamingExperience: {};
                            careerGoals: {};
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                put: {
                    body: {} & {
                        name?: string | undefined;
                        email?: string | undefined;
                        location?: string | undefined;
                        summary?: string | undefined;
                        gamingExperience?: Record<string, unknown> | undefined;
                        website?: string | undefined;
                        phone?: string | undefined;
                        linkedin?: string | undefined;
                        github?: string | undefined;
                        currentRole?: string | undefined;
                        currentCompany?: string | undefined;
                        yearsExperience?: number | undefined;
                        technicalSkills?: string[] | undefined;
                        softSkills?: string[] | undefined;
                        careerGoals?: Record<string, unknown> | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            name: string;
                            email: string | null;
                            phone: string | null;
                            location: string | null;
                            website: string | null;
                            linkedin: string | null;
                            github: string | null;
                            summary: string | null;
                            currentRole: string | null;
                            currentCompany: string | null;
                            yearsExperience: number | null;
                            technicalSkills: string[] | null;
                            softSkills: string[] | null;
                            gamingExperience: Record<string, unknown> | null;
                            careerGoals: Record<string, unknown> | null;
                            createdAt: string;
                            updatedAt: string;
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
} & {
    api: {
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
                        200: import("./services/data-service-contracts").BaoExportData;
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
                        200: import("./services/data-service-contracts").ImportResult;
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
} & {
    api: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
                    genre?: string | undefined;
                    platform?: string | undefined;
                    studioType?: string | undefined;
                    location?: string | undefined;
                    remote?: string | undefined;
                    experienceLevel?: string | undefined;
                    limit?: string | undefined;
                    page?: string | undefined;
                    q?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        jobs: {
                            id: string;
                            source: string | null;
                            type: string | null;
                            createdAt: string;
                            updatedAt: string;
                            company: string;
                            studioType: string | null;
                            title: string;
                            location: string;
                            remote: boolean | null;
                            hybrid: boolean | null;
                            salary: Record<string, unknown> | null;
                            description: string | null;
                            requirements: string[] | null;
                            technologies: string[] | null;
                            experienceLevel: string | null;
                            postedDate: string | null;
                            url: string | null;
                            gameGenres: string[] | null;
                            platforms: string[] | null;
                            contentHash: string | null;
                            tags: string[] | null;
                            companyLogo: string | null;
                            applicationUrl: string | null;
                            enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                        }[];
                        page: number;
                        limit: number;
                        total: number;
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
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            title: string;
                            company: string;
                            location: string;
                            remote: boolean | null;
                            hybrid: boolean | null;
                            salary: Record<string, unknown> | null;
                            description: string | null;
                            requirements: string[] | null;
                            technologies: string[] | null;
                            experienceLevel: string | null;
                            type: string | null;
                            postedDate: string | null;
                            url: string | null;
                            source: string | null;
                            studioType: string | null;
                            gameGenres: string[] | null;
                            platforms: string[] | null;
                            contentHash: string | null;
                            tags: string[] | null;
                            companyLogo: string | null;
                            applicationUrl: string | null;
                            enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                            createdAt: string;
                            updatedAt: string;
                        } | {
                            error: string;
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
            save: {
                post: {
                    body: {
                        jobId: string;
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            jobId: string;
                            savedAt: string;
                        } | {
                            error: string;
                            message?: undefined;
                            saved?: undefined;
                        } | {
                            message: string;
                            saved: {
                                id: string;
                                jobId: string;
                                savedAt: string;
                            };
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
            save: {
                ":jobId": {
                    delete: {
                        body: unknown;
                        params: {
                            jobId: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                deleted: void;
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
    } & {
        [x: string]: {
            saved: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            jobId: string;
                            savedAt: string;
                            job: {
                                id: string;
                                title: string;
                                company: string;
                                location: string;
                                remote: boolean | null;
                                hybrid: boolean | null;
                                salary: Record<string, unknown> | null;
                                description: string | null;
                                requirements: string[] | null;
                                technologies: string[] | null;
                                experienceLevel: string | null;
                                type: string | null;
                                postedDate: string | null;
                                url: string | null;
                                source: string | null;
                                studioType: string | null;
                                gameGenres: string[] | null;
                                platforms: string[] | null;
                                contentHash: string | null;
                                tags: string[] | null;
                                companyLogo: string | null;
                                applicationUrl: string | null;
                                enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                                createdAt: string;
                                updatedAt: string;
                            } | null;
                        }[];
                    };
                };
            };
        };
    } & {
        [x: string]: {
            apply: {
                post: {
                    body: {
                        jobId: string;
                    } & {
                        notes?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            jobId: string;
                            status: string;
                            appliedDate: string;
                            notes: string;
                            timeline: {
                                status: string;
                                date: string;
                                notes: string;
                            }[];
                        } | {
                            error: string;
                            message?: undefined;
                            application?: undefined;
                        } | {
                            message: string;
                            application: {
                                id: string;
                                jobId: string;
                                status: string | null;
                                appliedDate: string;
                                notes: string | null;
                                timeline: unknown[] | null;
                                createdAt: string;
                                updatedAt: string;
                            };
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
            apply: {
                ":id": {
                    put: {
                        body: {} & {
                            status?: string | undefined;
                            notes?: string | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                id: string;
                                jobId: string;
                                status: string | null;
                                appliedDate: string;
                                notes: string | null;
                                timeline: unknown[] | null;
                                createdAt: string;
                                updatedAt: string;
                            } | {
                                error: string;
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
    } & {
        [x: string]: {
            applications: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            jobId: string;
                            status: string | null;
                            appliedDate: string;
                            notes: string | null;
                            timeline: unknown[] | null;
                            createdAt: string;
                            updatedAt: string;
                            job: {
                                id: string;
                                title: string;
                                company: string;
                                location: string;
                                remote: boolean | null;
                                hybrid: boolean | null;
                                salary: Record<string, unknown> | null;
                                description: string | null;
                                requirements: string[] | null;
                                technologies: string[] | null;
                                experienceLevel: string | null;
                                type: string | null;
                                postedDate: string | null;
                                url: string | null;
                                source: string | null;
                                studioType: string | null;
                                gameGenres: string[] | null;
                                platforms: string[] | null;
                                contentHash: string | null;
                                tags: string[] | null;
                                companyLogo: string | null;
                                applicationUrl: string | null;
                                enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                                createdAt: string;
                                updatedAt: string;
                            } | null;
                        }[];
                    };
                };
            };
        };
    } & {
        [x: string]: {
            recommendations: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/jobs-route-recommendations").JobRecommendationsResponse;
                    };
                };
            };
        };
    } & {
        [x: string]: {
            refresh: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            status: string;
                            totalJobs: number;
                            newJobs: number;
                            updatedJobs: number;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        [x: string]: {
            [x: string]: {
                post: {
                    body: {
                        targetRole: string;
                    } & {
                        experienceLevel?: string | undefined;
                        studioName?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            details: string;
                            questions?: undefined;
                        } | {
                            questions: import("./services/cv-questionnaire-service").CvQuestion[];
                            error?: undefined;
                            details?: undefined;
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
            [x: string]: {
                post: {
                    body: {
                        questionsAndAnswers: ({
                            id: string;
                            category: string;
                            question: string;
                            answer: string;
                        } & {})[];
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/resume").ResumeData | {
                            error: string;
                            details: string;
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
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData[];
                };
            };
        };
    } & {
        [x: string]: {
            post: {
                body: {} & {
                    skills?: ({} & {
                        gaming?: string[] | undefined;
                        technical?: string[] | undefined;
                        soft?: string[] | undefined;
                    }) | undefined;
                    name?: string | undefined;
                    template?: "creative" | "gaming" | "executive" | "technical" | "modern" | "classic" | "minimal" | "google-xyz" | undefined;
                    personalInfo?: ({} & {
                        portfolio?: string | undefined;
                        name?: string | undefined;
                        email?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        phone?: string | undefined;
                        github?: string | undefined;
                        linkedIn?: string | undefined;
                    }) | undefined;
                    summary?: string | undefined;
                    experience?: ({
                        company: string;
                        title: string;
                        startDate: string;
                    } & {
                        achievements?: string[] | undefined;
                        location?: string | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        endDate?: string | undefined;
                    })[] | undefined;
                    education?: ({
                        degree: string;
                        year: string;
                        field: string;
                        school: string;
                    } & {
                        gpa?: string | undefined;
                    })[] | undefined;
                    projects?: ({
                        title: string;
                        description: string;
                    } & {
                        link?: string | undefined;
                        technologies?: string[] | undefined;
                    })[] | undefined;
                    gamingExperience?: ({} & {
                        platforms?: string | undefined;
                        gameEngines?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    }) | undefined;
                    theme?: "light" | "dark" | undefined;
                    isDefault?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData;
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
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/resume").ResumeData | {
                            error: string;
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
            ":id": {
                put: {
                    body: {} & {
                        skills?: ({} & {
                            gaming?: string[] | undefined;
                            technical?: string[] | undefined;
                            soft?: string[] | undefined;
                        }) | undefined;
                        name?: string | undefined;
                        template?: "creative" | "gaming" | "executive" | "technical" | "modern" | "classic" | "minimal" | "google-xyz" | undefined;
                        personalInfo?: ({} & {
                            portfolio?: string | undefined;
                            name?: string | undefined;
                            email?: string | undefined;
                            location?: string | undefined;
                            website?: string | undefined;
                            phone?: string | undefined;
                            github?: string | undefined;
                            linkedIn?: string | undefined;
                        }) | undefined;
                        summary?: string | undefined;
                        experience?: ({
                            company: string;
                            title: string;
                            startDate: string;
                        } & {
                            achievements?: string[] | undefined;
                            location?: string | undefined;
                            description?: string | undefined;
                            technologies?: string[] | undefined;
                            endDate?: string | undefined;
                        })[] | undefined;
                        education?: ({
                            degree: string;
                            year: string;
                            field: string;
                            school: string;
                        } & {
                            gpa?: string | undefined;
                        })[] | undefined;
                        projects?: ({
                            title: string;
                            description: string;
                        } & {
                            link?: string | undefined;
                            technologies?: string[] | undefined;
                        })[] | undefined;
                        gamingExperience?: ({} & {
                            platforms?: string | undefined;
                            gameEngines?: string | undefined;
                            genres?: string | undefined;
                            shippedTitles?: string | undefined;
                        }) | undefined;
                        theme?: "light" | "dark" | undefined;
                        isDefault?: boolean | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/resume").ResumeData | {
                            error: string;
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
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            success?: undefined;
                            id?: undefined;
                        } | {
                            success: boolean;
                            id: string;
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
            ":id": {
                export: {
                    post: {
                        body: {} & {
                            format?: string | undefined;
                            template?: "creative" | "gaming" | "executive" | "technical" | "modern" | "classic" | "minimal" | "google-xyz" | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: Response | {
                                error: string;
                                details?: undefined;
                            } | {
                                error: string;
                                details: string;
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
    } & {
        [x: string]: {
            ":id": {
                "ai-enhance": {
                    post: {
                        body: {} & {
                            section?: string | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                details?: undefined;
                                resume?: undefined;
                                suggestions?: undefined;
                                section?: undefined;
                            } | {
                                error: string;
                                details: string;
                                resume?: undefined;
                                suggestions?: undefined;
                                section?: undefined;
                            } | {
                                resume: import("@bao/shared/types/resume").ResumeData;
                                suggestions: import("@bao/shared/utils/json").JsonArray;
                                section: string;
                                error?: undefined;
                                details?: undefined;
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
    } & {
        [x: string]: {
            ":id": {
                "ai-score": {
                    post: {
                        body: {
                            jobId: string;
                        } & {};
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                details?: undefined;
                                resumeId?: undefined;
                                jobId?: undefined;
                                score?: undefined;
                                strengths?: undefined;
                                improvements?: undefined;
                                keywords?: undefined;
                                analysis?: undefined;
                            } | {
                                error: string;
                                details: string;
                                resumeId?: undefined;
                                jobId?: undefined;
                                score?: undefined;
                                strengths?: undefined;
                                improvements?: undefined;
                                keywords?: undefined;
                                analysis?: undefined;
                            } | {
                                resumeId: string;
                                jobId: string;
                                score: number;
                                strengths: string[];
                                improvements: string[];
                                keywords: string[];
                                analysis: Record<string, unknown>;
                                error?: undefined;
                                details?: undefined;
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
    api: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        company: string;
                        position: string;
                        jobInfo: Record<string, unknown> | null;
                        content: Record<string, unknown> | null;
                        template: string | null;
                        createdAt: string;
                        updatedAt: string;
                    }[];
                };
            };
        };
    } & {
        [x: string]: {
            post: {
                body: {
                    company: string;
                    position: string;
                } & {
                    content?: Record<string, unknown> | undefined;
                    jobInfo?: Record<string, unknown> | undefined;
                    template?: "professional" | "creative" | "gaming" | "executive" | "technical" | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        company: string;
                        position: string;
                        jobInfo: Record<string, unknown>;
                        content: Record<string, unknown>;
                        template: "professional" | "creative" | "gaming" | "executive" | "technical";
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
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo: Record<string, unknown> | null;
                            content: Record<string, unknown> | null;
                            template: string | null;
                            createdAt: string;
                            updatedAt: string;
                        } | {
                            error: string;
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
            ":id": {
                put: {
                    body: {} & {
                        content?: Record<string, unknown> | undefined;
                        company?: string | undefined;
                        position?: string | undefined;
                        jobInfo?: Record<string, unknown> | undefined;
                        template?: "professional" | "creative" | "gaming" | "executive" | "technical" | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo: Record<string, unknown> | null;
                            content: Record<string, unknown> | null;
                            template: string | null;
                            createdAt: string;
                            updatedAt: string;
                        } | {
                            error: string;
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
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            success?: undefined;
                            id?: undefined;
                        } | {
                            success: boolean;
                            id: string;
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
            [x: string]: {
                post: {
                    body: {
                        company: string;
                        position: string;
                    } & {
                        resumeId?: string | undefined;
                        jobInfo?: Record<string, unknown> | undefined;
                        template?: "professional" | "creative" | "gaming" | "executive" | "technical" | undefined;
                        save?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            details?: undefined;
                            message?: undefined;
                            content?: undefined;
                            coverLetter?: undefined;
                        } | {
                            error: string;
                            details: string;
                            message?: undefined;
                            content?: undefined;
                            coverLetter?: undefined;
                        } | {
                            message: string;
                            content: {
                                introduction: string;
                                body: string;
                                conclusion: string;
                            };
                            error?: undefined;
                            details?: undefined;
                            coverLetter?: undefined;
                        } | {
                            message: string;
                            coverLetter: {
                                id: string;
                                company: string;
                                position: string;
                                jobInfo: Record<string, unknown>;
                                content: {
                                    introduction: string;
                                    body: string;
                                    conclusion: string;
                                };
                                template: "professional" | "creative" | "gaming" | "executive" | "technical";
                            };
                            error?: undefined;
                            details?: undefined;
                            content?: undefined;
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
            ":id": {
                export: {
                    post: {
                        body: {} & {
                            format?: string | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: Response | {
                                error: string;
                                details: string;
                            } | {
                                error: string;
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
    api: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/portfolio").PortfolioData;
                };
            };
        };
    } & {
        [x: string]: {
            put: {
                body: {
                    metadata: Record<string, unknown>;
                } & {};
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/portfolio").PortfolioData;
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
            projects: {
                post: {
                    body: {
                        title: string;
                        description: string;
                    } & {
                        role?: string | undefined;
                        sortOrder?: number | undefined;
                        technologies?: string[] | undefined;
                        platforms?: string[] | undefined;
                        tags?: string[] | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        featured?: boolean | undefined;
                        engines?: string[] | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/portfolio").PortfolioProject | {
                            error: string;
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
            projects: {
                reorder: {
                    post: {
                        body: {
                            orderedIds: string[];
                        } & {};
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared/types/portfolio").PortfolioData | {
                                error: string;
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
    } & {
        [x: string]: {
            projects: {
                ":id": {
                    put: {
                        body: {} & {
                            role?: string | undefined;
                            sortOrder?: number | undefined;
                            title?: string | undefined;
                            description?: string | undefined;
                            technologies?: string[] | undefined;
                            platforms?: string[] | undefined;
                            tags?: string[] | undefined;
                            image?: string | undefined;
                            liveUrl?: string | undefined;
                            githubUrl?: string | undefined;
                            featured?: boolean | undefined;
                            engines?: string[] | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared/types/portfolio").PortfolioProject | {
                                error: string;
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
    } & {
        [x: string]: {
            projects: {
                ":id": {
                    delete: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                error: string;
                                success?: undefined;
                                id?: undefined;
                            } | {
                                success: boolean;
                                id: string;
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
        };
    } & {
        [x: string]: {
            export: {
                post: {
                    body: {} & {
                        format?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: Response | {
                            error: string;
                            details?: undefined;
                        } | {
                            error: string;
                            details: string;
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
} & {
    api: {
        [x: string]: {
            sessions: {
                post: {
                    body: {} & {
                        studioId?: string | undefined;
                        config?: ({} & {
                            duration?: number | undefined;
                            technologies?: string[] | undefined;
                            experienceLevel?: string | undefined;
                            voiceSettings?: ({} & {
                                language?: string | undefined;
                                microphoneId?: string | undefined;
                                speakerId?: string | undefined;
                                voiceId?: string | undefined;
                                rate?: number | undefined;
                                pitch?: number | undefined;
                                volume?: number | undefined;
                            }) | undefined;
                            roleType?: string | undefined;
                            roleCategory?: string | undefined;
                            focusAreas?: string[] | undefined;
                            questionCount?: number | undefined;
                            includeTechnical?: boolean | undefined;
                            includeBehavioral?: boolean | undefined;
                            includeStudioSpecific?: boolean | undefined;
                            enableVoiceMode?: boolean | undefined;
                            interviewMode?: "job" | "studio" | undefined;
                            conversationStyle?: "natural" | "structured" | undefined;
                            targetJob?: ({
                                id: string;
                                company: string;
                                title: string;
                                location: string;
                            } & {
                                source?: string | undefined;
                                description?: string | undefined;
                                requirements?: string[] | undefined;
                                technologies?: string[] | undefined;
                                postedDate?: string | undefined;
                                url?: string | undefined;
                            }) | undefined;
                            candidateContext?: ({} & {
                                resumeId?: string | undefined;
                                portfolioId?: string | undefined;
                                coverLetterId?: string | undefined;
                            }) | undefined;
                        }) | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
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
        [x: string]: {
            sessions: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/interview-route-contracts").SessionPayload[];
                    };
                };
            };
        };
    } & {
        [x: string]: {
            sessions: {
                ":id": {
                    get: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("./routes/interview-route-contracts").SessionPayload | {
                                error: string;
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
    } & {
        [x: string]: {
            sessions: {
                ":id": {
                    response: {
                        post: {
                            body: {
                                response: string;
                            } & {
                                questionId?: string | undefined;
                                questionIndex?: number | undefined;
                            };
                            params: {
                                id: string;
                            } & {};
                            query: unknown;
                            headers: unknown;
                            response: {
                                200: {
                                    error: string;
                                } | {
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
            };
        };
    } & {
        [x: string]: {
            sessions: {
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
                                    error: string;
                                } | {
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
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            totalSessions: number;
                            completedSessions: number;
                            inProgressSessions: number;
                            averageQuestions: number;
                            averageResponses: number;
                            totalInterviews: number;
                            completedInterviews: number;
                            averageScore: number;
                            improvementTrend: number;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
                    type?: string | undefined;
                    size?: string | undefined;
                    remoteWork?: string | undefined;
                    q?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        name: string;
                        logo: string | null;
                        website: string | null;
                        location: string | null;
                        size: string | null;
                        type: string | null;
                        description: string | null;
                        games: string[] | null;
                        technologies: string[] | null;
                        culture: Record<string, unknown> | null;
                        interviewStyle: string | null;
                        remoteWork: boolean | null;
                        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                        createdAt: string;
                        updatedAt: string;
                    }[];
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
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            name: string;
                            logo: string | null;
                            website: string | null;
                            location: string | null;
                            size: string | null;
                            type: string | null;
                            description: string | null;
                            games: string[] | null;
                            technologies: string[] | null;
                            culture: Record<string, unknown> | null;
                            interviewStyle: string | null;
                            remoteWork: boolean | null;
                            enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                            createdAt: string;
                            updatedAt: string;
                        } | {
                            error: string;
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
            post: {
                body: {
                    name: string;
                } & {
                    type?: string | undefined;
                    location?: string | undefined;
                    description?: string | undefined;
                    technologies?: string[] | undefined;
                    platforms?: string[] | undefined;
                    website?: string | undefined;
                    size?: string | undefined;
                    culture?: Record<string, unknown> | undefined;
                    remoteWork?: boolean | undefined;
                    genres?: string[] | undefined;
                    founded?: string | undefined;
                    benefits?: string[] | undefined;
                    socialMedia?: Record<string, string> | undefined;
                    notableGames?: string[] | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        name: string;
                        description: string | null;
                        website: string | null;
                        location: string | null;
                        type: string | null;
                        size: string | null;
                        founded: string | null;
                        remoteWork: boolean | undefined;
                        technologies: string[];
                        genres: string[];
                        platforms: string[];
                        culture: Record<string, unknown> | null;
                        benefits: string[];
                        socialMedia: Record<string, string> | null;
                        notableGames: string[];
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
            ":id": {
                put: {
                    body: {} & {
                        name?: string | undefined;
                        type?: string | undefined;
                        location?: string | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        platforms?: string[] | undefined;
                        website?: string | undefined;
                        size?: string | undefined;
                        culture?: Record<string, unknown> | undefined;
                        remoteWork?: boolean | undefined;
                        genres?: string[] | undefined;
                        founded?: string | undefined;
                        benefits?: string[] | undefined;
                        socialMedia?: Record<string, string> | undefined;
                        notableGames?: string[] | undefined;
                    };
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            name: string;
                            logo: string | null;
                            website: string | null;
                            location: string | null;
                            size: string | null;
                            type: string | null;
                            description: string | null;
                            games: string[] | null;
                            technologies: string[] | null;
                            culture: Record<string, unknown> | null;
                            interviewStyle: string | null;
                            remoteWork: boolean | null;
                            enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                            createdAt: string;
                            updatedAt: string;
                        } | {
                            error: string;
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
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            message?: undefined;
                            id?: undefined;
                        } | {
                            message: string;
                            id: string;
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
            analytics: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/studio.routes").StudioAnalytics;
                    };
                };
            };
        };
    };
} & {
    api: {
        [x: string]: {
            [x: string]: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/jobs").ScraperOperationResult | {
                            error: string;
                            details: string;
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                post: {
                    body: unknown;
                    params: {
                        portalId: string;
                    } & {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/jobs").ScraperOperationResult | {
                            error: string;
                            details: string;
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
} & {
    api: {
        [x: string]: {};
    } & {
        [x: string]: {
            chat: {
                post: {
                    body: {
                        message: string;
                    } & {
                        sessionId?: string | undefined;
                        context?: ({
                            source: string;
                            route: {
                                path: string;
                                params: Record<string, string>;
                                query: Record<string, string>;
                            } & {
                                name?: string | undefined;
                            };
                            state: {
                                hasResumes: boolean;
                                resumeCount: number;
                                hasJobs: boolean;
                                jobCount: number;
                                hasStudios: boolean;
                                studioCount: number;
                                hasInterviewSessions: boolean;
                                interviewSessionCount: number;
                                hasPortfolioProjects: boolean;
                                portfolioProjectCount: number;
                            } & {};
                        } & {
                            domain?: string | undefined;
                            entity?: ({
                                id: string;
                                type: string;
                            } & {
                                label?: string | undefined;
                            }) | undefined;
                        }) | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            sessionId: string | null | undefined;
                            timestamp: string;
                            provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                            model: string;
                            followUps: string[];
                            contextDomain: "resume" | "job_search" | "interview" | "portfolio" | "skills" | "automation" | "general";
                        } | {
                            error: string;
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
            "analyze-resume": {
                post: {
                    body: {
                        resumeId: string;
                    } & {
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            message?: undefined;
                            resumeId?: undefined;
                            jobId?: undefined;
                            analysis?: undefined;
                            provider?: undefined;
                            model?: undefined;
                        } | {
                            message: string;
                            resumeId: string;
                            jobId: string | null;
                            analysis: import("./routes/ai-route-contracts").ResumeAnalysisResult;
                            provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                            model: string;
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
            "generate-cover-letter": {
                post: {
                    body: {
                        resumeId: string;
                        company: string;
                        position: string;
                    } & {
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            message?: undefined;
                            content?: undefined;
                            provider?: undefined;
                            model?: undefined;
                        } | {
                            message: string;
                            content: import("./routes/ai-route-contracts").CoverLetterSections;
                            provider: "openai" | "huggingface" | "local" | "gemini" | "claude";
                            model: string;
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
            "match-jobs": {
                post: {
                    body: {} & {
                        skills?: string[] | undefined;
                        resumeId?: string | undefined;
                        preferences?: Record<string, string | number | boolean> | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/ai-route-contracts").MatchJobsResponse | {
                            error: string;
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
            models: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./services/ai/control-plane").AIControlPlaneState | {
                            providers: {
                                id: "openai" | "huggingface" | "local" | "gemini" | "claude";
                                nameKey: string;
                                descriptionKey: string;
                                iconId: "openai" | "huggingface" | "local" | "gemini" | "claude";
                                models: string[];
                                available: boolean;
                                health: "unconfigured";
                            }[];
                            error: string;
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            usage: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            totalMessages: number;
                            userMessages: number;
                            assistantMessages: number;
                            sessions: number;
                            recentActivity: {
                                timestamp: string;
                                role: string;
                                sessionId: string | null;
                            }[];
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            "automation-action": {
                post: {
                    body: {
                        resumeId: string;
                        action: string;
                        jobUrl: string;
                    } & {
                        jobId?: string | undefined;
                        coverLetterId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            error: string;
                            runId?: undefined;
                            status?: undefined;
                            message?: undefined;
                        } | {
                            runId: string;
                            status: string;
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
    };
} & {
    api: {
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
                    body: {} & {
                        reason?: string | undefined;
                        amount?: number | undefined;
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
                            params: {} & {
                                id?: string | undefined;
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
                        200: import("./services/gamification-definitions").WeeklyProgressResult;
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
    };
} & {
    api: {
        [x: string]: {};
    } & {
        [x: string]: {
            mappings: {
                get: {
                    body: unknown;
                    params: {};
                    query: {} & {
                        search?: string | undefined;
                        category?: string | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            gameExpression: string;
                            transferableSkill: string;
                            industryApplications: string[] | null;
                            evidence: unknown[] | null;
                            confidence: number | null;
                            category: string | null;
                            demandLevel: string | null;
                            aiGenerated: boolean | null;
                            createdAt: string;
                            updatedAt: string;
                        }[];
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
            mappings: {
                post: {
                    body: {
                        gameExpression: string;
                        transferableSkill: string;
                    } & {
                        category?: string | undefined;
                        industryApplications?: string[] | undefined;
                        evidence?: Record<string, unknown>[] | undefined;
                        confidence?: number | undefined;
                        demandLevel?: string | undefined;
                        aiGenerated?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/skill-mapping").SkillMapping;
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
            mappings: {
                ":id": {
                    put: {
                        body: {} & {
                            category?: string | undefined;
                            gameExpression?: string | undefined;
                            transferableSkill?: string | undefined;
                            industryApplications?: string[] | undefined;
                            evidence?: Record<string, unknown>[] | undefined;
                            confidence?: number | undefined;
                            demandLevel?: string | undefined;
                            aiGenerated?: boolean | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared/types/skill-mapping").SkillMapping | {
                                error: string;
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
    } & {
        [x: string]: {
            mappings: {
                ":id": {
                    delete: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            [x: number]: {
                                error: string;
                                id: string;
                                message?: undefined;
                            } | {
                                message: string;
                                id: string;
                                error?: undefined;
                            };
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            pathways: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/skill-mapping").CareerPathway[];
                    };
                };
            };
        };
    } & {
        [x: string]: {
            readiness: {
                get: {
                    body: unknown;
                    params: {};
                    query: {} & {
                        jobId?: string | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/skill-mapping").ReadinessAssessment | {
                            jobId: string;
                            overallScore: number;
                            categories: {
                                technical: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                                softSkills: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                                industryKnowledge: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                                portfolio: import("@bao/shared/types/skill-mapping").CategoryAssessment;
                            };
                            improvementSuggestions: import("@bao/shared/types/skill-mapping").SkillReadinessImprovementId[];
                            nextSteps: import("@bao/shared/types/skill-mapping").SkillReadinessNextStepId[];
                            targetRoleReadiness?: import("@bao/shared/types/skill-mapping").RoleReadiness[];
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
            "ai-analyze": {
                post: {
                    body: {} & {
                        resume?: Record<string, unknown> | undefined;
                        gameExperience?: Record<string, unknown> | undefined;
                        autoCreateMappings?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            detectedSkills: string[];
                            suggestedMappings: Record<string, unknown>[];
                            recommendations: string[];
                            provider?: string;
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
} & {
    api: {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: {} & {
                        types?: string | ("skills" | "studios" | "jobs" | "resumes")[] | undefined;
                        q?: string | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: import("./services/search-service").UnifiedSearchResult;
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
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: {} & {
                        prefix?: string | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: {
                            text: string;
                            type: string;
                        }[];
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
} & {
    api: {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/search").DashboardStats;
                    };
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/search").WeeklyActivity;
                    };
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/search").CareerProgress;
                    };
                };
            };
        };
    };
} & {
    api: {
        [x: string]: {};
    } & {
        [x: string]: {
            verify: {
                context: {
                    get: {
                        body: unknown;
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {} & {
                                resumeId?: string | undefined;
                            };
                            404: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
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
    } & {
        [x: string]: {
            "job-apply": {
                post: {
                    body: {
                        resumeId: string;
                        jobUrl: string;
                    } & {
                        jobId?: string | undefined;
                        coverLetterId?: string | undefined;
                        customAnswers?: Record<string, string> | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        200: {} & {
                            error?: string | ({} & {
                                code?: string | undefined;
                                source?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | null | undefined;
                            id?: string | undefined;
                            aborted?: boolean | undefined;
                            type?: "scrape" | "job_apply" | "email" | undefined;
                            output?: Record<string, unknown> | null | undefined;
                            input?: Record<string, unknown> | null | undefined;
                            progress?: number | null | undefined;
                            screenshots?: string[] | null | undefined;
                            status?: "error" | "success" | "pending" | "running" | undefined;
                            jobId?: string | null | undefined;
                            userId?: string | null | undefined;
                            currentStep?: number | null | undefined;
                            totalSteps?: number | null | undefined;
                            exitCode?: number | null | undefined;
                            timedOut?: boolean | undefined;
                            executionMs?: number | null | undefined;
                            startedAt?: string | null | undefined;
                            completedAt?: string | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        400: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        409: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        422: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            "job-apply": {
                schedule: {
                    post: {
                        body: {
                            resumeId: string;
                            jobUrl: string;
                            runAt: string;
                        } & {
                            jobId?: string | undefined;
                            coverLetterId?: string | undefined;
                            customAnswers?: Record<string, string> | undefined;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            500: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            200: {} & {
                                error?: string | ({} & {
                                    code?: string | undefined;
                                    source?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | null | undefined;
                                id?: string | undefined;
                                aborted?: boolean | undefined;
                                type?: "scrape" | "job_apply" | "email" | undefined;
                                output?: Record<string, unknown> | null | undefined;
                                input?: Record<string, unknown> | null | undefined;
                                progress?: number | null | undefined;
                                screenshots?: string[] | null | undefined;
                                status?: "error" | "success" | "pending" | "running" | undefined;
                                jobId?: string | null | undefined;
                                userId?: string | null | undefined;
                                currentStep?: number | null | undefined;
                                totalSteps?: number | null | undefined;
                                exitCode?: number | null | undefined;
                                timedOut?: boolean | undefined;
                                executionMs?: number | null | undefined;
                                startedAt?: string | null | undefined;
                                completedAt?: string | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            };
                            400: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            404: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            409: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            422: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            "email-response": {
                post: {
                    body: {
                        message: string;
                        subject: string;
                    } & {
                        sender?: string | undefined;
                        tone?: "professional" | "friendly" | "concise" | undefined;
                        recipientEmail?: string | undefined;
                        deliverAfterGeneration?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        200: {} & {
                            provider?: string | undefined;
                            model?: string | undefined;
                            status?: "success" | undefined;
                            recipientEmail?: string | undefined;
                            runId?: string | undefined;
                            reply?: string | undefined;
                            delivered?: boolean | undefined;
                            deliveredAt?: string | undefined;
                            messageId?: string | undefined;
                        };
                        400: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        409: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        422: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            "email-response": {
                schedule: {
                    post: {
                        body: {
                            message: string;
                            subject: string;
                            runAt: string;
                        } & {
                            sender?: string | undefined;
                            tone?: "professional" | "friendly" | "concise" | undefined;
                            recipientEmail?: string | undefined;
                            deliverAfterGeneration?: boolean | undefined;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            500: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            200: {} & {
                                error?: string | ({} & {
                                    code?: string | undefined;
                                    source?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | null | undefined;
                                id?: string | undefined;
                                aborted?: boolean | undefined;
                                type?: "scrape" | "job_apply" | "email" | undefined;
                                output?: Record<string, unknown> | null | undefined;
                                input?: Record<string, unknown> | null | undefined;
                                progress?: number | null | undefined;
                                screenshots?: string[] | null | undefined;
                                status?: "error" | "success" | "pending" | "running" | undefined;
                                jobId?: string | null | undefined;
                                userId?: string | null | undefined;
                                currentStep?: number | null | undefined;
                                totalSteps?: number | null | undefined;
                                exitCode?: number | null | undefined;
                                timedOut?: boolean | undefined;
                                executionMs?: number | null | undefined;
                                startedAt?: string | null | undefined;
                                completedAt?: string | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            };
                            400: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            404: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            409: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            422: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            scrape: {
                post: {
                    body: {
                        target: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios";
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        200: {} & {
                            error?: string | ({} & {
                                code?: string | undefined;
                                source?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | null | undefined;
                            id?: string | undefined;
                            aborted?: boolean | undefined;
                            type?: "scrape" | "job_apply" | "email" | undefined;
                            output?: Record<string, unknown> | null | undefined;
                            input?: Record<string, unknown> | null | undefined;
                            progress?: number | null | undefined;
                            screenshots?: string[] | null | undefined;
                            status?: "error" | "success" | "pending" | "running" | undefined;
                            jobId?: string | null | undefined;
                            userId?: string | null | undefined;
                            currentStep?: number | null | undefined;
                            totalSteps?: number | null | undefined;
                            exitCode?: number | null | undefined;
                            timedOut?: boolean | undefined;
                            executionMs?: number | null | undefined;
                            startedAt?: string | null | undefined;
                            completedAt?: string | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        400: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        404: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        409: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        422: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            scrape: {
                schedule: {
                    post: {
                        body: {
                            target: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios";
                            runAt: string;
                        } & {};
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            500: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            200: {} & {
                                error?: string | ({} & {
                                    code?: string | undefined;
                                    source?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | null | undefined;
                                id?: string | undefined;
                                aborted?: boolean | undefined;
                                type?: "scrape" | "job_apply" | "email" | undefined;
                                output?: Record<string, unknown> | null | undefined;
                                input?: Record<string, unknown> | null | undefined;
                                progress?: number | null | undefined;
                                screenshots?: string[] | null | undefined;
                                status?: "error" | "success" | "pending" | "running" | undefined;
                                jobId?: string | null | undefined;
                                userId?: string | null | undefined;
                                currentStep?: number | null | undefined;
                                totalSteps?: number | null | undefined;
                                exitCode?: number | null | undefined;
                                timedOut?: boolean | undefined;
                                executionMs?: number | null | undefined;
                                startedAt?: string | null | undefined;
                                completedAt?: string | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            };
                            400: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            404: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            409: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            422: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                        };
                    };
                };
            };
        };
    } & {
        [x: string]: {
            capabilities: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        500: {} & {
                            error?: ({} & {
                                code?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | undefined;
                        };
                        200: {} & {
                            summary?: ({} & {
                                configured?: number | undefined;
                                manualRunAvailable?: number | undefined;
                                scheduledRunAvailable?: number | undefined;
                                runHistoryAvailable?: number | undefined;
                                liveUpdatesAvailable?: number | undefined;
                                total?: number | undefined;
                            }) | undefined;
                            capabilities?: ({} & {
                                name?: string | undefined;
                                id?: string | undefined;
                                category?: "scrape" | "job_apply" | undefined;
                                enabled?: boolean | undefined;
                                target?: "jobs_hitmarker" | "jobs_grackle" | "jobs_workwithindies" | "jobs_remotegamejobs" | "jobs_gamesjobsdirect" | "jobs_pocketgamer" | "studios" | null | undefined;
                                issues?: string[] | undefined;
                                configured?: boolean | undefined;
                                implemented?: boolean | undefined;
                                manualRunAvailable?: boolean | undefined;
                                scheduledRunAvailable?: boolean | undefined;
                                runHistoryAvailable?: boolean | undefined;
                                liveUpdatesAvailable?: boolean | undefined;
                            })[] | undefined;
                            generatedAt?: string | undefined;
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
            runs: {
                get: {
                    body: unknown;
                    params: {};
                    query: {} & {
                        type?: "scrape" | "job_apply" | "email" | undefined;
                        status?: "error" | "success" | "pending" | "running" | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: ({} & {
                            error?: string | ({} & {
                                code?: string | undefined;
                                source?: string | undefined;
                                message?: string | undefined;
                                details?: Record<string, unknown> | undefined;
                            }) | null | undefined;
                            id?: string | undefined;
                            aborted?: boolean | undefined;
                            type?: "scrape" | "job_apply" | "email" | undefined;
                            output?: Record<string, unknown> | null | undefined;
                            input?: Record<string, unknown> | null | undefined;
                            progress?: number | null | undefined;
                            screenshots?: string[] | null | undefined;
                            status?: "error" | "success" | "pending" | "running" | undefined;
                            jobId?: string | null | undefined;
                            userId?: string | null | undefined;
                            currentStep?: number | null | undefined;
                            totalSteps?: number | null | undefined;
                            exitCode?: number | null | undefined;
                            timedOut?: boolean | undefined;
                            executionMs?: number | null | undefined;
                            startedAt?: string | null | undefined;
                            completedAt?: string | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        })[];
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
            runs: {
                ":id": {
                    get: {
                        body: unknown;
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {} & {
                                error?: string | ({} & {
                                    code?: string | undefined;
                                    source?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | null | undefined;
                                id?: string | undefined;
                                aborted?: boolean | undefined;
                                type?: "scrape" | "job_apply" | "email" | undefined;
                                output?: Record<string, unknown> | null | undefined;
                                input?: Record<string, unknown> | null | undefined;
                                progress?: number | null | undefined;
                                screenshots?: string[] | null | undefined;
                                status?: "error" | "success" | "pending" | "running" | undefined;
                                jobId?: string | null | undefined;
                                userId?: string | null | undefined;
                                currentStep?: number | null | undefined;
                                totalSteps?: number | null | undefined;
                                exitCode?: number | null | undefined;
                                timedOut?: boolean | undefined;
                                executionMs?: number | null | undefined;
                                startedAt?: string | null | undefined;
                                completedAt?: string | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            };
                            400: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
                            };
                            404: {} & {
                                error?: ({} & {
                                    code?: string | undefined;
                                    message?: string | undefined;
                                    details?: Record<string, unknown> | undefined;
                                }) | undefined;
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
    api: {
        [x: string]: {
            ":runId": {
                ":index": {
                    get: {
                        body: unknown;
                        params: {
                            index: string;
                            runId: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: unknown;
                            400: {} & {
                                error?: string | undefined;
                            };
                            404: {} & {
                                error?: string | undefined;
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
    api: {
        [x: string]: {
            subscribe: {
                body: {
                    type?: "subscribe" | "unsubscribe" | undefined;
                    runId?: string | undefined;
                };
                params: {};
                query: {};
                headers: {};
                response: {
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
    api: {
        [x: string]: {
            subscribe: {
                body: {
                    content?: string | undefined;
                    sessionId?: string | undefined;
                };
                params: {};
                query: {};
                headers: {};
                response: {
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
    api: {
        [x: string]: {
            subscribe: {
                body: {
                    content?: string | undefined;
                    type?: string | undefined;
                    sessionId?: string | undefined;
                    studioId?: string | undefined;
                    config?: ({} & {
                        duration?: number | undefined;
                        technologies?: string[] | undefined;
                        experienceLevel?: string | undefined;
                        voiceSettings?: ({} & {
                            language?: string | undefined;
                            microphoneId?: string | undefined;
                            speakerId?: string | undefined;
                            voiceId?: string | undefined;
                            rate?: number | undefined;
                            pitch?: number | undefined;
                            volume?: number | undefined;
                        }) | undefined;
                        roleType?: string | undefined;
                        roleCategory?: string | undefined;
                        focusAreas?: string[] | undefined;
                        questionCount?: number | undefined;
                        includeTechnical?: boolean | undefined;
                        includeBehavioral?: boolean | undefined;
                        includeStudioSpecific?: boolean | undefined;
                        enableVoiceMode?: boolean | undefined;
                        interviewMode?: "job" | "studio" | undefined;
                        conversationStyle?: "natural" | "structured" | undefined;
                        targetJob?: ({
                            id: string;
                            company: string;
                            title: string;
                            location: string;
                        } & {
                            source?: string | undefined;
                            description?: string | undefined;
                            requirements?: string[] | undefined;
                            technologies?: string[] | undefined;
                            postedDate?: string | undefined;
                            url?: string | undefined;
                        }) | undefined;
                        candidateContext?: ({} & {
                            resumeId?: string | undefined;
                            portfolioId?: string | undefined;
                            coverLetterId?: string | undefined;
                        }) | undefined;
                    }) | undefined;
                };
                params: {};
                query: {};
                headers: {};
                response: {
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
    standaloneSchema: {};
    response: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
} & {
    derive: {};
    resolve: {};
    schema: {};
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
export type App = typeof app;
