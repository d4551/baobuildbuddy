import Type, { StandardSchemaV1 } from "baobox";
import { Elysia } from "elysia";
export declare const app: Elysia<"/api", {
    decorator: {};
    store: {
        readonly startTime?: number;
        readonly endTime?: number;
        readonly responseTime?: number;
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
        }, "database" | "status" | "timestamp" | "uptime", never> & StandardSchemaV1<unknown, {
            database: string;
            status: string;
            timestamp: string;
            uptime: number;
        } & {}>;
        readonly ErrorResponse: Type.TObject<{
            readonly error: Type.TString;
            readonly code: Type.TOptional<Type.TString>;
            readonly fields: Type.TOptional<Type.TArray<Type.TString>>;
        }, "error", Type.InferOptionalKeys<{
            readonly error: Type.TString;
            readonly code: Type.TOptional<Type.TString>;
            readonly fields: Type.TOptional<Type.TArray<Type.TString>>;
        }>> & StandardSchemaV1<unknown, {
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
                        database: string;
                        status: string;
                        timestamp: string;
                        uptime: number;
                    } & {};
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
                            error?: undefined;
                            configured: boolean;
                            message: string;
                            apiKey?: undefined;
                        } | {
                            message?: undefined;
                            error: string;
                            configured?: undefined;
                            apiKey?: undefined;
                        } | {
                            error?: undefined;
                            configured: boolean;
                            apiKey: string;
                            message: string;
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
                        careerGoals?: Record<string, unknown> | undefined;
                        currentCompany?: string | undefined;
                        currentRole?: string | undefined;
                        email?: string | undefined;
                        gamingExperience?: Record<string, unknown> | undefined;
                        github?: string | undefined;
                        linkedin?: string | undefined;
                        location?: string | undefined;
                        name?: string | undefined;
                        phone?: string | undefined;
                        softSkills?: string[] | undefined;
                        summary?: string | undefined;
                        technicalSkills?: string[] | undefined;
                        website?: string | undefined;
                        yearsExperience?: number | undefined;
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
                        200: import("./services/data-service-contracts").BaoExportData;
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
                        200: import("./services/data-service-contracts").ImportResult;
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
    };
} & {
    api: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: {} & {
                    experienceLevel?: string | undefined;
                    genre?: string | undefined;
                    limit?: string | undefined;
                    location?: string | undefined;
                    page?: string | undefined;
                    platform?: string | undefined;
                    q?: string | undefined;
                    remote?: string | undefined;
                    studioType?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        jobs: {
                            applicationUrl: string | null;
                            company: string;
                            companyLogo: string | null;
                            contentHash: string | null;
                            createdAt: string;
                            description: string | null;
                            enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
                            experienceLevel: string | null;
                            gameGenres: string[] | null;
                            hybrid: boolean | null;
                            id: string;
                            location: string;
                            platforms: string[] | null;
                            postedDate: string | null;
                            remote: boolean | null;
                            requirements: string[] | null;
                            salary: Record<string, unknown> | null;
                            source: string | null;
                            studioType: string | null;
                            tags: string[] | null;
                            technologies: string[] | null;
                            title: string;
                            type: string | null;
                            updatedAt: string;
                            url: string | null;
                        }[];
                        page: number;
                        limit: number;
                        total: number;
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
                            message?: undefined;
                            error: string;
                            saved?: undefined;
                        } | {
                            error?: undefined;
                            message: string;
                            saved: {
                                id: string;
                                jobId: string;
                                savedAt: string;
                            };
                        } | {
                            id: string;
                            jobId: string;
                            savedAt: string;
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
                            message?: undefined;
                            error: string;
                            application?: undefined;
                        } | {
                            error?: undefined;
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
                        } | {
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
        };
    } & {
        [x: string]: {
            apply: {
                ":id": {
                    put: {
                        body: {} & {
                            notes?: string | undefined;
                            status?: string | undefined;
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
                            error?: undefined;
                            details?: undefined;
                            questions: import("./services/cv-questionnaire-service").CvQuestion[];
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
        };
    } & {
        [x: string]: {
            [x: string]: {
                post: {
                    body: {
                        questionsAndAnswers: ({
                            answer: string;
                            category: string;
                            id: string;
                            question: string;
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
                    education?: ({
                        degree: string;
                        field: string;
                        school: string;
                        year: string;
                    } & {
                        gpa?: string | undefined;
                    })[] | undefined;
                    experience?: ({
                        company: string;
                        startDate: string;
                        title: string;
                    } & {
                        achievements?: string[] | undefined;
                        description?: string | undefined;
                        endDate?: string | undefined;
                        location?: string | undefined;
                        technologies?: string[] | undefined;
                    })[] | undefined;
                    gamingExperience?: ({} & {
                        gameEngines?: string | undefined;
                        genres?: string | undefined;
                        platforms?: string | undefined;
                        shippedTitles?: string | undefined;
                    }) | undefined;
                    isDefault?: boolean | undefined;
                    name?: string | undefined;
                    personalInfo?: ({} & {
                        email?: string | undefined;
                        github?: string | undefined;
                        linkedIn?: string | undefined;
                        location?: string | undefined;
                        name?: string | undefined;
                        phone?: string | undefined;
                        portfolio?: string | undefined;
                        website?: string | undefined;
                    }) | undefined;
                    projects?: ({
                        description: string;
                        title: string;
                    } & {
                        link?: string | undefined;
                        technologies?: string[] | undefined;
                    })[] | undefined;
                    skills?: ({} & {
                        gaming?: string[] | undefined;
                        soft?: string[] | undefined;
                        technical?: string[] | undefined;
                    }) | undefined;
                    summary?: string | undefined;
                    template?: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical" | undefined;
                    theme?: "dark" | "light" | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData;
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
    } & {
        [x: string]: {
            ":id": {
                put: {
                    body: {} & {
                        education?: ({
                            degree: string;
                            field: string;
                            school: string;
                            year: string;
                        } & {
                            gpa?: string | undefined;
                        })[] | undefined;
                        experience?: ({
                            company: string;
                            startDate: string;
                            title: string;
                        } & {
                            achievements?: string[] | undefined;
                            description?: string | undefined;
                            endDate?: string | undefined;
                            location?: string | undefined;
                            technologies?: string[] | undefined;
                        })[] | undefined;
                        gamingExperience?: ({} & {
                            gameEngines?: string | undefined;
                            genres?: string | undefined;
                            platforms?: string | undefined;
                            shippedTitles?: string | undefined;
                        }) | undefined;
                        isDefault?: boolean | undefined;
                        name?: string | undefined;
                        personalInfo?: ({} & {
                            email?: string | undefined;
                            github?: string | undefined;
                            linkedIn?: string | undefined;
                            location?: string | undefined;
                            name?: string | undefined;
                            phone?: string | undefined;
                            portfolio?: string | undefined;
                            website?: string | undefined;
                        }) | undefined;
                        projects?: ({
                            description: string;
                            title: string;
                        } & {
                            link?: string | undefined;
                            technologies?: string[] | undefined;
                        })[] | undefined;
                        skills?: ({} & {
                            gaming?: string[] | undefined;
                            soft?: string[] | undefined;
                            technical?: string[] | undefined;
                        }) | undefined;
                        summary?: string | undefined;
                        template?: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical" | undefined;
                        theme?: "dark" | "light" | undefined;
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
                            success?: undefined;
                            id?: undefined;
                            error: string;
                        } | {
                            error?: undefined;
                            success: boolean;
                            id: string;
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
        };
    } & {
        [x: string]: {
            ":id": {
                export: {
                    post: {
                        body: {} & {
                            format?: string | undefined;
                            template?: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical" | undefined;
                        };
                        params: {
                            id: string;
                        } & {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: Response | {
                                details?: undefined;
                                error: string;
                            } | {
                                error: string;
                                details: string;
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
                                details?: undefined;
                                error: string;
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
                                error?: undefined;
                                details?: undefined;
                                resume: import("@bao/shared/types/resume").ResumeData;
                                suggestions: import("@bao/shared/utils/json").JsonArray;
                                section: string;
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
                                resumeId?: undefined;
                                jobId?: undefined;
                                analysis?: undefined;
                                details?: undefined;
                                error: string;
                                score?: undefined;
                                strengths?: undefined;
                                improvements?: undefined;
                                keywords?: undefined;
                            } | {
                                resumeId?: undefined;
                                jobId?: undefined;
                                analysis?: undefined;
                                error: string;
                                details: string;
                                score?: undefined;
                                strengths?: undefined;
                                improvements?: undefined;
                                keywords?: undefined;
                            } | {
                                error?: undefined;
                                details?: undefined;
                                resumeId: string;
                                jobId: string;
                                score: number;
                                strengths: string[];
                                improvements: string[];
                                keywords: string[];
                                analysis: Record<string, unknown>;
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
                    template?: "creative" | "executive" | "gaming" | "professional" | "technical" | undefined;
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
                        template: "creative" | "executive" | "gaming" | "professional" | "technical";
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
    } & {
        [x: string]: {
            ":id": {
                put: {
                    body: {} & {
                        company?: string | undefined;
                        content?: Record<string, unknown> | undefined;
                        jobInfo?: Record<string, unknown> | undefined;
                        position?: string | undefined;
                        template?: "creative" | "executive" | "gaming" | "professional" | "technical" | undefined;
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
                            error?: undefined;
                            success: boolean;
                            id: string;
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
        };
    } & {
        [x: string]: {
            [x: string]: {
                post: {
                    body: {
                        company: string;
                        position: string;
                    } & {
                        jobInfo?: Record<string, unknown> | undefined;
                        resumeId?: string | undefined;
                        save?: boolean | undefined;
                        template?: "creative" | "executive" | "gaming" | "professional" | "technical" | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message?: undefined;
                            content?: undefined;
                            error: string;
                            coverLetter?: undefined;
                            details?: undefined;
                        } | {
                            message?: undefined;
                            content?: undefined;
                            error: string;
                            details: string;
                            coverLetter?: undefined;
                        } | {
                            error?: undefined;
                            message: string;
                            content: import("./routes/cover-letter-route-generation-support").GeneratedCoverLetterContent;
                            coverLetter?: undefined;
                            details?: undefined;
                        } | {
                            error?: undefined;
                            content?: undefined;
                            message: string;
                            coverLetter: {
                                id: string;
                                company: string;
                                position: string;
                                jobInfo: Record<string, unknown>;
                                content: import("./routes/cover-letter-route-generation-support").GeneratedCoverLetterContent;
                                template: "creative" | "executive" | "gaming" | "professional" | "technical";
                            };
                            details?: undefined;
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
        [x: string]: {
            projects: {
                post: {
                    body: {
                        description: string;
                        title: string;
                    } & {
                        engines?: string[] | undefined;
                        featured?: boolean | undefined;
                        githubUrl?: string | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        platforms?: string[] | undefined;
                        role?: string | undefined;
                        sortOrder?: number | undefined;
                        tags?: string[] | undefined;
                        technologies?: string[] | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/portfolio").PortfolioProject | {
                            error: string;
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
        };
    } & {
        [x: string]: {
            projects: {
                ":id": {
                    put: {
                        body: {} & {
                            description?: string | undefined;
                            engines?: string[] | undefined;
                            featured?: boolean | undefined;
                            githubUrl?: string | undefined;
                            image?: string | undefined;
                            liveUrl?: string | undefined;
                            platforms?: string[] | undefined;
                            role?: string | undefined;
                            sortOrder?: number | undefined;
                            tags?: string[] | undefined;
                            technologies?: string[] | undefined;
                            title?: string | undefined;
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
                                success?: undefined;
                                id?: undefined;
                                error: string;
                            } | {
                                error?: undefined;
                                success: boolean;
                                id: string;
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
    };
} & {
    api: {
        [x: string]: {
            sessions: {
                post: {
                    body: {} & {
                        config?: ({} & {
                            candidateContext?: ({} & {
                                coverLetterId?: string | undefined;
                                portfolioId?: string | undefined;
                                resumeId?: string | undefined;
                            }) | undefined;
                            conversationStyle?: "natural" | "structured" | undefined;
                            duration?: number | undefined;
                            enableVoiceMode?: boolean | undefined;
                            experienceLevel?: string | undefined;
                            focusAreas?: string[] | undefined;
                            includeBehavioral?: boolean | undefined;
                            includeStudioSpecific?: boolean | undefined;
                            includeTechnical?: boolean | undefined;
                            interviewMode?: "job" | "studio" | undefined;
                            questionCount?: number | undefined;
                            roleCategory?: string | undefined;
                            roleType?: string | undefined;
                            targetJob?: ({
                                company: string;
                                id: string;
                                location: string;
                                title: string;
                            } & {
                                description?: string | undefined;
                                postedDate?: string | undefined;
                                requirements?: string[] | undefined;
                                source?: string | undefined;
                                technologies?: string[] | undefined;
                                url?: string | undefined;
                            }) | undefined;
                            technologies?: string[] | undefined;
                            voiceSettings?: ({} & {
                                language?: string | undefined;
                                microphoneId?: string | undefined;
                                pitch?: number | undefined;
                                rate?: number | undefined;
                                speakerId?: string | undefined;
                                voiceId?: string | undefined;
                                volume?: number | undefined;
                            }) | undefined;
                        }) | undefined;
                        studioId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
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
                                    error?: undefined;
                                    message: string;
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
                                    error?: undefined;
                                    message: string;
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
                    q?: string | undefined;
                    remoteWork?: string | undefined;
                    size?: string | undefined;
                    type?: string | undefined;
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
    } & {
        [x: string]: {
            post: {
                body: {
                    name: string;
                } & {
                    benefits?: string[] | undefined;
                    culture?: Record<string, unknown> | undefined;
                    description?: string | undefined;
                    founded?: string | undefined;
                    genres?: string[] | undefined;
                    location?: string | undefined;
                    notableGames?: string[] | undefined;
                    platforms?: string[] | undefined;
                    remoteWork?: boolean | undefined;
                    size?: string | undefined;
                    socialMedia?: Record<string, string> | undefined;
                    technologies?: string[] | undefined;
                    type?: string | undefined;
                    website?: string | undefined;
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
        [x: string]: {
            ":id": {
                put: {
                    body: {} & {
                        benefits?: string[] | undefined;
                        culture?: Record<string, unknown> | undefined;
                        description?: string | undefined;
                        founded?: string | undefined;
                        genres?: string[] | undefined;
                        location?: string | undefined;
                        name?: string | undefined;
                        notableGames?: string[] | undefined;
                        platforms?: string[] | undefined;
                        remoteWork?: boolean | undefined;
                        size?: string | undefined;
                        socialMedia?: Record<string, string> | undefined;
                        technologies?: string[] | undefined;
                        type?: string | undefined;
                        website?: string | undefined;
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
                            message?: undefined;
                            id?: undefined;
                            error: string;
                        } | {
                            error?: undefined;
                            message: string;
                            id: string;
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
                        context?: ({
                            route: {
                                params: Record<string, string>;
                                path: string;
                                query: Record<string, string>;
                            } & {
                                name?: string | undefined;
                            };
                            source: string;
                            state: {
                                hasInterviewSessions: boolean;
                                hasJobs: boolean;
                                hasPortfolioProjects: boolean;
                                hasResumes: boolean;
                                hasStudios: boolean;
                                interviewSessionCount: number;
                                jobCount: number;
                                portfolioProjectCount: number;
                                resumeCount: number;
                                studioCount: number;
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
                        sessionId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            sessionId: string | null | undefined;
                            timestamp: string;
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            model: string;
                            followUps: string[];
                            contextDomain: "automation" | "general" | "interview" | "job_search" | "portfolio" | "resume" | "skills";
                        } | {
                            error: string;
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
                            error?: undefined;
                            message: string;
                            resumeId: string;
                            jobId: string | null;
                            analysis: import("./routes/ai-route-contracts").ResumeAnalysisResult;
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            model: string;
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
        };
    } & {
        [x: string]: {
            "generate-cover-letter": {
                post: {
                    body: {
                        company: string;
                        position: string;
                        resumeId: string;
                    } & {
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message?: undefined;
                            provider?: undefined;
                            model?: undefined;
                            error: string;
                            content?: undefined;
                        } | {
                            error?: undefined;
                            message: string;
                            content: import("./routes/ai-route-contracts").CoverLetterSections;
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            model: string;
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
        };
    } & {
        [x: string]: {
            "match-jobs": {
                post: {
                    body: {} & {
                        preferences?: Record<string, string | number | boolean> | undefined;
                        resumeId?: string | undefined;
                        skills?: string[] | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/ai-route-contracts").MatchJobsResponse | {
                            error: string;
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
                                id: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                nameKey: string;
                                descriptionKey: string;
                                iconId: "claude" | "gemini" | "huggingface" | "local" | "openai";
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
                        action: string;
                        jobUrl: string;
                        resumeId: string;
                    } & {
                        coverLetterId?: string | undefined;
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message?: undefined;
                            error: string;
                            runId?: undefined;
                            status?: undefined;
                        } | {
                            error?: undefined;
                            runId: string;
                            status: string;
                            message: string;
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
                    body: {
                        amount: number;
                        reason: string;
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message?: undefined;
                            error: string;
                            xp?: undefined;
                            level?: undefined;
                            leveledUp?: undefined;
                            levelUp?: undefined;
                            reason?: undefined;
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
                        category?: string | undefined;
                        search?: string | undefined;
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
    } & {
        [x: string]: {
            mappings: {
                post: {
                    body: {
                        gameExpression: string;
                        transferableSkill: string;
                    } & {
                        aiGenerated?: boolean | undefined;
                        category?: string | undefined;
                        confidence?: number | undefined;
                        demandLevel?: string | undefined;
                        evidence?: Record<string, unknown>[] | undefined;
                        industryApplications?: string[] | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/skill-mapping").SkillMapping;
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
    } & {
        [x: string]: {
            mappings: {
                ":id": {
                    put: {
                        body: {} & {
                            aiGenerated?: boolean | undefined;
                            category?: string | undefined;
                            confidence?: number | undefined;
                            demandLevel?: string | undefined;
                            evidence?: Record<string, unknown>[] | undefined;
                            gameExpression?: string | undefined;
                            industryApplications?: string[] | undefined;
                            transferableSkill?: string | undefined;
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
                                message?: undefined;
                                error: string;
                                id: string;
                            } | {
                                error?: undefined;
                                message: string;
                                id: string;
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
                            jobId: string;
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
        };
    } & {
        [x: string]: {
            "ai-analyze": {
                post: {
                    body: {} & {
                        autoCreateMappings?: boolean | undefined;
                        gameExperience?: Record<string, unknown> | undefined;
                        resume?: Record<string, unknown> | undefined;
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
    };
} & {
    api: {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: {} & {
                        q?: string | undefined;
                        types?: string | ("jobs" | "resumes" | "skills" | "studios")[] | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: import("./services/search-service").UnifiedSearchResult;
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
                            200: {
                                resumeId: string;
                            } & {};
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
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
        };
    } & {
        [x: string]: {
            "job-apply": {
                post: {
                    body: {
                        jobUrl: string;
                        resumeId: string;
                    } & {
                        coverLetterId?: string | undefined;
                        customAnswers?: Record<string, string> | undefined;
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            aborted: boolean;
                            completedAt: string | null;
                            createdAt: string;
                            currentStep: number | null;
                            error: string | ({
                                code: string;
                                message: string;
                                source: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            executionMs: number | null;
                            exitCode: number | null;
                            id: string;
                            input: Record<string, unknown> | null;
                            jobId: string | null;
                            output: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            startedAt: string | null;
                            status: "error" | "pending" | "running" | "success";
                            timedOut: boolean;
                            totalSteps: number | null;
                            type: "email" | "job_apply" | "scrape";
                            updatedAt: string;
                            userId: string | null;
                        } & {};
                        400: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        409: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        422: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        500: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
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
                            jobUrl: string;
                            resumeId: string;
                            runAt: string;
                        } & {
                            coverLetterId?: string | undefined;
                            customAnswers?: Record<string, string> | undefined;
                            jobId?: string | undefined;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                aborted: boolean;
                                completedAt: string | null;
                                createdAt: string;
                                currentStep: number | null;
                                error: string | ({
                                    code: string;
                                    message: string;
                                    source: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                }) | null;
                                executionMs: number | null;
                                exitCode: number | null;
                                id: string;
                                input: Record<string, unknown> | null;
                                jobId: string | null;
                                output: Record<string, unknown> | null;
                                progress: number | null;
                                screenshots: string[] | null;
                                startedAt: string | null;
                                status: "error" | "pending" | "running" | "success";
                                timedOut: boolean;
                                totalSteps: number | null;
                                type: "email" | "job_apply" | "scrape";
                                updatedAt: string;
                                userId: string | null;
                            } & {};
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            409: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            422: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            500: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
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
                        deliverAfterGeneration?: boolean | undefined;
                        recipientEmail?: string | undefined;
                        sender?: string | undefined;
                        tone?: "concise" | "friendly" | "professional" | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            delivered: boolean;
                            model: string;
                            provider: string;
                            reply: string;
                            runId: string;
                            status: "success";
                        } & {
                            deliveredAt?: string | undefined;
                            messageId?: string | undefined;
                            recipientEmail?: string | undefined;
                        };
                        400: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        409: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        422: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        500: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
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
                            runAt: string;
                            subject: string;
                        } & {
                            deliverAfterGeneration?: boolean | undefined;
                            recipientEmail?: string | undefined;
                            sender?: string | undefined;
                            tone?: "concise" | "friendly" | "professional" | undefined;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                aborted: boolean;
                                completedAt: string | null;
                                createdAt: string;
                                currentStep: number | null;
                                error: string | ({
                                    code: string;
                                    message: string;
                                    source: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                }) | null;
                                executionMs: number | null;
                                exitCode: number | null;
                                id: string;
                                input: Record<string, unknown> | null;
                                jobId: string | null;
                                output: Record<string, unknown> | null;
                                progress: number | null;
                                screenshots: string[] | null;
                                startedAt: string | null;
                                status: "error" | "pending" | "running" | "success";
                                timedOut: boolean;
                                totalSteps: number | null;
                                type: "email" | "job_apply" | "scrape";
                                updatedAt: string;
                                userId: string | null;
                            } & {};
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            409: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            422: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            500: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
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
                        target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                    } & {};
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            aborted: boolean;
                            completedAt: string | null;
                            createdAt: string;
                            currentStep: number | null;
                            error: string | ({
                                code: string;
                                message: string;
                                source: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            executionMs: number | null;
                            exitCode: number | null;
                            id: string;
                            input: Record<string, unknown> | null;
                            jobId: string | null;
                            output: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            startedAt: string | null;
                            status: "error" | "pending" | "running" | "success";
                            timedOut: boolean;
                            totalSteps: number | null;
                            type: "email" | "job_apply" | "scrape";
                            updatedAt: string;
                            userId: string | null;
                        } & {};
                        400: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        404: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        409: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        422: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
                        500: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
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
                            runAt: string;
                            target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                        } & {};
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                aborted: boolean;
                                completedAt: string | null;
                                createdAt: string;
                                currentStep: number | null;
                                error: string | ({
                                    code: string;
                                    message: string;
                                    source: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                }) | null;
                                executionMs: number | null;
                                exitCode: number | null;
                                id: string;
                                input: Record<string, unknown> | null;
                                jobId: string | null;
                                output: Record<string, unknown> | null;
                                progress: number | null;
                                screenshots: string[] | null;
                                startedAt: string | null;
                                status: "error" | "pending" | "running" | "success";
                                timedOut: boolean;
                                totalSteps: number | null;
                                type: "email" | "job_apply" | "scrape";
                                updatedAt: string;
                                userId: string | null;
                            } & {};
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            409: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            422: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            500: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
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
                        200: {
                            capabilities: ({
                                category: "job_apply" | "scrape";
                                configured: boolean;
                                enabled: boolean;
                                id: string;
                                implemented: boolean;
                                issues: ({
                                    code: "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable";
                                } & {
                                    portalId?: string | undefined;
                                    portalName?: string | undefined;
                                })[];
                                liveUpdatesAvailable: boolean;
                                manualRunAvailable: boolean;
                                name: string;
                                runHistoryAvailable: boolean;
                                scheduledRunAvailable: boolean;
                                target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios" | null;
                            } & {})[];
                            generatedAt: string;
                            summary: {
                                configured: number;
                                liveUpdatesAvailable: number;
                                manualRunAvailable: number;
                                runHistoryAvailable: number;
                                scheduledRunAvailable: number;
                                total: number;
                            } & {};
                        } & {};
                        422: {
                            type: 'validation';
                            on: string;
                            summary?: string;
                            message?: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            };
                        } & {};
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
                        status?: "error" | "pending" | "running" | "success" | undefined;
                        type?: "email" | "job_apply" | "scrape" | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: ({
                            aborted: boolean;
                            completedAt: string | null;
                            createdAt: string;
                            currentStep: number | null;
                            error: string | ({
                                code: string;
                                message: string;
                                source: string;
                            } & {
                                details?: Record<string, unknown> | undefined;
                            }) | null;
                            executionMs: number | null;
                            exitCode: number | null;
                            id: string;
                            input: Record<string, unknown> | null;
                            jobId: string | null;
                            output: Record<string, unknown> | null;
                            progress: number | null;
                            screenshots: string[] | null;
                            startedAt: string | null;
                            status: "error" | "pending" | "running" | "success";
                            timedOut: boolean;
                            totalSteps: number | null;
                            type: "email" | "job_apply" | "scrape";
                            updatedAt: string;
                            userId: string | null;
                        } & {})[];
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
                            200: {
                                aborted: boolean;
                                completedAt: string | null;
                                createdAt: string;
                                currentStep: number | null;
                                error: string | ({
                                    code: string;
                                    message: string;
                                    source: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                }) | null;
                                executionMs: number | null;
                                exitCode: number | null;
                                id: string;
                                input: Record<string, unknown> | null;
                                jobId: string | null;
                                output: Record<string, unknown> | null;
                                progress: number | null;
                                screenshots: string[] | null;
                                startedAt: string | null;
                                status: "error" | "pending" | "running" | "success";
                                timedOut: boolean;
                                totalSteps: number | null;
                                type: "email" | "job_apply" | "scrape";
                                updatedAt: string;
                                userId: string | null;
                            } & {};
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                } & {
                                    details?: Record<string, unknown> | undefined;
                                };
                            } & {};
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
                            400: {
                                error: string;
                            } & {};
                            404: {
                                error: string;
                            } & {};
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
        };
    };
} & {
    api: {
        [x: string]: {
            subscribe: {
                body: {
                    runId?: string | undefined;
                    type: "subscribe" | "unsubscribe";
                };
                params: {};
                query: {};
                headers: {};
                response: {
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
} & {
    api: {
        [x: string]: {
            subscribe: {
                body: {
                    content: string;
                    sessionId?: string | undefined;
                };
                params: {};
                query: {};
                headers: {};
                response: {
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
} & {
    api: {
        [x: string]: {
            subscribe: {
                body: {
                    config?: ({} & {
                        candidateContext?: ({} & {
                            coverLetterId?: string | undefined;
                            portfolioId?: string | undefined;
                            resumeId?: string | undefined;
                        }) | undefined;
                        conversationStyle?: "natural" | "structured" | undefined;
                        duration?: number | undefined;
                        enableVoiceMode?: boolean | undefined;
                        experienceLevel?: string | undefined;
                        focusAreas?: string[] | undefined;
                        includeBehavioral?: boolean | undefined;
                        includeStudioSpecific?: boolean | undefined;
                        includeTechnical?: boolean | undefined;
                        interviewMode?: "job" | "studio" | undefined;
                        questionCount?: number | undefined;
                        roleCategory?: string | undefined;
                        roleType?: string | undefined;
                        targetJob?: ({
                            company: string;
                            id: string;
                            location: string;
                            title: string;
                        } & {
                            description?: string | undefined;
                            postedDate?: string | undefined;
                            requirements?: string[] | undefined;
                            source?: string | undefined;
                            technologies?: string[] | undefined;
                            url?: string | undefined;
                        }) | undefined;
                        technologies?: string[] | undefined;
                        voiceSettings?: ({} & {
                            language?: string | undefined;
                            microphoneId?: string | undefined;
                            pitch?: number | undefined;
                            rate?: number | undefined;
                            speakerId?: string | undefined;
                            voiceId?: string | undefined;
                            volume?: number | undefined;
                        }) | undefined;
                    }) | undefined;
                    content?: string | undefined;
                    sessionId?: string | undefined;
                    studioId?: string | undefined;
                    type: string;
                };
                params: {};
                query: {};
                headers: {};
                response: {
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
}>;
export type App = typeof app;
