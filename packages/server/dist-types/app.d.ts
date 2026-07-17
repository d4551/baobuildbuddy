import { Elysia } from "elysia";
export declare const app: Elysia<"/api", "local", {
    decorator: {};
    store: {};
    derive: {};
}, {
    typebox: {
        readonly HealthResponse: import("typebox").TObject<{
            status: import("typebox").TString;
            timestamp: import("typebox").TString;
            database: import("typebox").TString;
            uptime: import("typebox").TNumber;
        }>;
        readonly ErrorResponse: import("typebox").TObject<{
            error: import("typebox").TString;
            code: import("typebox").TOptional<import("typebox").TString>;
            fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>;
    };
    error: [];
}, import("elysia/types").DefaultMetadata, {
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
                    };
                };
                error: never;
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
                    error: never;
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
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                post: {
                    body: {
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
                            technicalSkills: string[];
                            softSkills: string[];
                            gamingExperience: Record<string, unknown>;
                            careerGoals: Record<string, unknown>;
                            createdAt: string;
                            updatedAt: string;
                        } & {
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
                            technicalSkills: string[];
                            softSkills: string[];
                            gamingExperience: Record<string, unknown>;
                            careerGoals: Record<string, unknown>;
                            createdAt: string;
                            updatedAt: string;
                        };
                        404: {
                            readonly error: "User profile not found";
                        };
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
                put: {
                    body: {
                        name?: string | undefined;
                        email?: string | undefined;
                        phone?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        linkedin?: string | undefined;
                        github?: string | undefined;
                        summary?: string | undefined;
                        currentRole?: string | undefined;
                        currentCompany?: string | undefined;
                        yearsExperience?: number | undefined;
                        technicalSkills?: string[] | undefined;
                        softSkills?: string[] | undefined;
                        gamingExperience?: Record<string, unknown> | undefined;
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
                            technicalSkills: string[];
                            softSkills: string[];
                            gamingExperience: Record<string, unknown>;
                            careerGoals: Record<string, unknown>;
                            createdAt: string;
                            updatedAt: string;
                        } & {
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
                            technicalSkills: string[];
                            softSkills: string[];
                            gamingExperience: Record<string, unknown>;
                            careerGoals: Record<string, unknown>;
                            createdAt: string;
                            updatedAt: string;
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
                        200: import("./services/data-service-contracts").BaoExportData;
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
                        200: import("./services/data-service-contracts").ImportResult;
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
    };
} & {
    api: {
        [x: string]: {
            get: {
                body: unknown;
                params: {};
                query: {
                    q?: string | undefined;
                    location?: string | undefined;
                    remote?: string | undefined;
                    experienceLevel?: string | undefined;
                    studioType?: string | undefined;
                    platform?: string | undefined;
                    genre?: string | undefined;
                    page?: string | undefined;
                    limit?: string | undefined;
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
        [x: string]: {
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    };
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
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            save: {
                post: {
                    body: {
                        jobId: string;
                    };
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
            save: {
                ":jobId": {
                    delete: {
                        body: unknown;
                        params: {
                            jobId: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                success: boolean;
                                deleted: void;
                            };
                        };
                        error: never;
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
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            apply: {
                post: {
                    body: {
                        jobId: string;
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
            apply: {
                ":id": {
                    put: {
                        body: {
                            status?: string | undefined;
                            notes?: string | undefined;
                        };
                        params: {
                            id: string;
                        };
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
                    error: never;
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
                    error: never;
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
                    error: never;
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
                        studioName?: string | undefined;
                        experienceLevel?: string | undefined;
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
            [x: string]: {
                post: {
                    body: {
                        questionsAndAnswers: {
                            id: string;
                            question: string;
                            answer: string;
                            category: string;
                        }[];
                    };
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
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData[];
                };
                error: never;
            };
        };
    } & {
        [x: string]: {
            post: {
                body: {
                    name?: string | undefined;
                    personalInfo?: {
                        name?: string | undefined;
                        email?: string | undefined;
                        phone?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        linkedIn?: string | undefined;
                        github?: string | undefined;
                        portfolio?: string | undefined;
                    } | undefined;
                    summary?: string | undefined;
                    experience?: {
                        title: string;
                        company: string;
                        startDate: string;
                        endDate?: string | undefined;
                        location?: string | undefined;
                        description?: string | undefined;
                        achievements?: string[] | undefined;
                        technologies?: string[] | undefined;
                    }[] | undefined;
                    education?: {
                        degree: string;
                        field: string;
                        school: string;
                        year: string;
                        gpa?: string | undefined;
                    }[] | undefined;
                    skills?: {
                        technical?: string[] | undefined;
                        soft?: string[] | undefined;
                        gaming?: string[] | undefined;
                    } | undefined;
                    projects?: {
                        title: string;
                        description: string;
                        technologies?: string[] | undefined;
                        link?: string | undefined;
                    }[] | undefined;
                    gamingExperience?: {
                        gameEngines?: string | undefined;
                        platforms?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    } | undefined;
                    template?: undefined;
                    theme?: "dark" | "light" | undefined;
                    isDefault?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/resume").ResumeData;
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
        [x: string]: {
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/resume").ResumeData | {
                            error: string;
                        };
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            ":id": {
                put: {
                    body: {
                        name?: string | undefined;
                        personalInfo?: {
                            name?: string | undefined;
                            email?: string | undefined;
                            phone?: string | undefined;
                            location?: string | undefined;
                            website?: string | undefined;
                            linkedIn?: string | undefined;
                            github?: string | undefined;
                            portfolio?: string | undefined;
                        } | undefined;
                        summary?: string | undefined;
                        experience?: {
                            title: string;
                            company: string;
                            startDate: string;
                            endDate?: string | undefined;
                            location?: string | undefined;
                            description?: string | undefined;
                            achievements?: string[] | undefined;
                            technologies?: string[] | undefined;
                        }[] | undefined;
                        education?: {
                            degree: string;
                            field: string;
                            school: string;
                            year: string;
                            gpa?: string | undefined;
                        }[] | undefined;
                        skills?: {
                            technical?: string[] | undefined;
                            soft?: string[] | undefined;
                            gaming?: string[] | undefined;
                        } | undefined;
                        projects?: {
                            title: string;
                            description: string;
                            technologies?: string[] | undefined;
                            link?: string | undefined;
                        }[] | undefined;
                        gamingExperience?: {
                            gameEngines?: string | undefined;
                            platforms?: string | undefined;
                            genres?: string | undefined;
                            shippedTitles?: string | undefined;
                        } | undefined;
                        template?: undefined;
                        theme?: "dark" | "light" | undefined;
                        isDefault?: boolean | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/resume").ResumeData | {
                            error: string;
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
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    };
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
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            ":id": {
                export: {
                    post: {
                        body: {
                            format?: string | undefined;
                            template?: undefined;
                        };
                        params: {
                            id: string;
                        };
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
        };
    } & {
        [x: string]: {
            ":id": {
                "ai-enhance": {
                    post: {
                        body: {
                            section?: string | undefined;
                        };
                        params: {
                            id: string;
                        };
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
        };
    } & {
        [x: string]: {
            ":id": {
                "ai-score": {
                    post: {
                        body: {
                            jobId: string;
                        };
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                details?: undefined;
                                error: string;
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
                error: never;
            };
        };
    } & {
        [x: string]: {
            post: {
                body: {
                    company: string;
                    position: string;
                    jobInfo?: Record<string, unknown> | undefined;
                    content?: Record<string, unknown> | undefined;
                    template?: undefined;
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
        [x: string]: {
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    };
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
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            ":id": {
                put: {
                    body: {
                        company?: string | undefined;
                        position?: string | undefined;
                        jobInfo?: Record<string, unknown> | undefined;
                        content?: Record<string, unknown> | undefined;
                        template?: undefined;
                    };
                    params: {
                        id: string;
                    };
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
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    };
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
                    };
                    error: never;
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
                        jobInfo?: Record<string, unknown> | undefined;
                        resumeId?: string | undefined;
                        template?: undefined;
                        save?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message?: undefined;
                            error: string;
                            details?: undefined;
                            content?: undefined;
                            coverLetter?: undefined;
                        } | {
                            message?: undefined;
                            error: string;
                            details: string;
                            content?: undefined;
                            coverLetter?: undefined;
                        } | {
                            error?: undefined;
                            details?: undefined;
                            message: string;
                            content: import("./routes/cover-letter-route-generation-support").GeneratedCoverLetterContent;
                            coverLetter?: undefined;
                        } | {
                            error?: undefined;
                            details?: undefined;
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
            ":id": {
                export: {
                    post: {
                        body: {
                            format?: string | undefined;
                        };
                        params: {
                            id: string;
                        };
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
                error: never;
            };
        };
    } & {
        [x: string]: {
            put: {
                body: {
                    metadata: Record<string, unknown>;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared/types/portfolio").PortfolioData;
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
        [x: string]: {
            projects: {
                post: {
                    body: {
                        title: string;
                        description: string;
                        technologies?: string[] | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        tags?: string[] | undefined;
                        featured?: boolean | undefined;
                        role?: string | undefined;
                        platforms?: string[] | undefined;
                        engines?: string[] | undefined;
                        sortOrder?: number | undefined;
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
            projects: {
                reorder: {
                    post: {
                        body: {
                            orderedIds: string[];
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared/types/portfolio").PortfolioData | {
                                error: string;
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
        };
    } & {
        [x: string]: {
            projects: {
                ":id": {
                    put: {
                        body: {
                            title?: string | undefined;
                            description?: string | undefined;
                            technologies?: string[] | undefined;
                            image?: string | undefined;
                            liveUrl?: string | undefined;
                            githubUrl?: string | undefined;
                            tags?: string[] | undefined;
                            featured?: boolean | undefined;
                            role?: string | undefined;
                            platforms?: string[] | undefined;
                            engines?: string[] | undefined;
                            sortOrder?: number | undefined;
                        };
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared/types/portfolio").PortfolioProject | {
                                error: string;
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
        };
    } & {
        [x: string]: {
            projects: {
                ":id": {
                    delete: {
                        body: unknown;
                        params: {
                            id: string;
                        };
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
                        };
                        error: never;
                    };
                };
            };
        };
    } & {
        [x: string]: {
            export: {
                post: {
                    body: {
                        format?: string | undefined;
                    };
                    params: {};
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
    };
} & {
    api: {
        [x: string]: {
            sessions: {
                post: {
                    body: {
                        studioId?: string | undefined;
                        config?: {
                            roleType?: string | undefined;
                            roleCategory?: string | undefined;
                            experienceLevel?: string | undefined;
                            focusAreas?: string[] | undefined;
                            duration?: number | undefined;
                            questionCount?: number | undefined;
                            includeTechnical?: boolean | undefined;
                            includeBehavioral?: boolean | undefined;
                            includeStudioSpecific?: boolean | undefined;
                            enableVoiceMode?: boolean | undefined;
                            technologies?: string[] | undefined;
                            voiceSettings?: {
                                microphoneId?: string | undefined;
                                speakerId?: string | undefined;
                                voiceId?: string | undefined;
                                rate?: number | undefined;
                                pitch?: number | undefined;
                                volume?: number | undefined;
                                language?: string | undefined;
                            } | undefined;
                            interviewMode?: "job" | "studio" | undefined;
                            conversationStyle?: "natural" | "structured" | undefined;
                            targetJob?: {
                                id: string;
                                title: string;
                                company: string;
                                location: string;
                                description?: string | undefined;
                                requirements?: string[] | undefined;
                                technologies?: string[] | undefined;
                                source?: string | undefined;
                                postedDate?: string | undefined;
                                url?: string | undefined;
                            } | undefined;
                            candidateContext?: {
                                resumeId?: string | undefined;
                                coverLetterId?: string | undefined;
                                portfolioId?: string | undefined;
                            } | undefined;
                        } | undefined;
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
            sessions: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("./routes/interview-route-contracts").SessionPayload[];
                    };
                    error: never;
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
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("./routes/interview-route-contracts").SessionPayload | {
                                error: string;
                            };
                        };
                        error: never;
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
                                questionId?: string | undefined;
                                questionIndex?: number | undefined;
                                response: string;
                            };
                            params: {
                                id: string;
                            };
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
                            };
                            query: unknown;
                            headers: unknown;
                            response: {
                                200: {
                                    error: string;
                                } | {
                                    error?: undefined;
                                    message: string;
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
                    error: never;
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
                query: {
                    q?: string | undefined;
                    type?: string | undefined;
                    size?: string | undefined;
                    remoteWork?: string | undefined;
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
                    error: never;
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
                    };
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
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            post: {
                body: {
                    name: string;
                    description?: string | undefined;
                    website?: string | undefined;
                    location?: string | undefined;
                    type?: string | undefined;
                    size?: string | undefined;
                    remoteWork?: boolean | undefined;
                    technologies?: string[] | undefined;
                    games?: string[] | undefined;
                    culture?: Record<string, unknown> | undefined;
                    interviewStyle?: string | undefined;
                    logo?: string | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        createdAt?: string | undefined;
                        culture?: Record<string, unknown> | null | undefined;
                        description?: string | null | undefined;
                        enrichment?: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null | undefined;
                        games?: string[] | null | undefined;
                        id: string;
                        interviewStyle?: string | null | undefined;
                        location?: string | null | undefined;
                        logo?: string | null | undefined;
                        name: string;
                        remoteWork?: boolean | null | undefined;
                        size?: string | null | undefined;
                        technologies?: string[] | null | undefined;
                        type?: string | null | undefined;
                        updatedAt?: string | undefined;
                        website?: string | null | undefined;
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
        [x: string]: {
            ":id": {
                put: {
                    body: {
                        name?: string | undefined;
                        description?: string | undefined;
                        website?: string | undefined;
                        location?: string | undefined;
                        type?: string | undefined;
                        size?: string | undefined;
                        remoteWork?: boolean | undefined;
                        technologies?: string[] | undefined;
                        games?: string[] | undefined;
                        culture?: Record<string, unknown> | undefined;
                        interviewStyle?: string | undefined;
                        logo?: string | undefined;
                    };
                    params: {
                        id: string;
                    };
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
            ":id": {
                delete: {
                    body: unknown;
                    params: {
                        id: string;
                    };
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
                    };
                    error: never;
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
                    error: never;
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
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/jobs").ScraperOperationResult | {
                            error: string;
                            details: string;
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
                        sessionId?: string | undefined;
                        context?: {
                            source: string;
                            domain?: string | undefined;
                            route: {
                                path: string;
                                name?: string | undefined;
                                params: Record<string, string>;
                                query: Record<string, string>;
                            };
                            entity?: {
                                type: string;
                                id: string;
                                label?: string | undefined;
                            } | undefined;
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
                            };
                        } | undefined;
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
            "analyze-resume": {
                post: {
                    body: {
                        resumeId: string;
                        jobId?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            model?: undefined;
                            error: string;
                            provider?: undefined;
                            message?: undefined;
                            resumeId?: undefined;
                            jobId?: undefined;
                            analysis?: undefined;
                        } | {
                            message: string;
                            resumeId: string;
                            jobId: string | null;
                            analysis: {
                                score: number;
                                strengths: string[];
                                improvements: string[];
                                keywords: string[];
                            };
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            model: string;
                            error?: undefined;
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
            "generate-cover-letter": {
                post: {
                    body: {
                        resumeId: string;
                        jobId?: string | undefined;
                        company: string;
                        position: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            model?: undefined;
                            provider?: undefined;
                            error: string;
                            message?: undefined;
                            content?: undefined;
                        } | {
                            message: string;
                            content: {
                                introduction: string;
                                body: string;
                                conclusion: string;
                            };
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            model: string;
                            error?: undefined;
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
            "match-jobs": {
                post: {
                    body: {
                        resumeId?: string | undefined;
                        skills?: string[] | undefined;
                        preferences?: Record<string, string | number | boolean> | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            matches: {
                                jobId: string;
                                title: string;
                                company: string;
                                location: string | null;
                                remote: boolean;
                                score: number;
                                strengths: string[];
                                concerns: string[];
                                highlightSkills: string[];
                            }[];
                            recommendations: string[];
                        } | {
                            error: string;
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
                    error: never;
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
                    error: never;
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
                        coverLetterId?: string | undefined;
                        jobId?: string | undefined;
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
                            error?: undefined;
                            runId: string;
                            status: string;
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
                        200: import("./services/gamification-definitions").WeeklyProgressResult;
                    };
                    error: never;
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
                    error: never;
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
                    query: {
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
            mappings: {
                post: {
                    body: {
                        gameExpression: string;
                        transferableSkill: string;
                        industryApplications?: string[] | undefined;
                        evidence?: Record<string, unknown>[] | undefined;
                        confidence?: number | undefined;
                        category?: string | undefined;
                        demandLevel?: string | undefined;
                        aiGenerated?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared/types/skill-mapping").SkillMapping;
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
            mappings: {
                ":id": {
                    put: {
                        body: {
                            gameExpression?: string | undefined;
                            transferableSkill?: string | undefined;
                            industryApplications?: string[] | undefined;
                            evidence?: Record<string, unknown>[] | undefined;
                            confidence?: number | undefined;
                            category?: string | undefined;
                            demandLevel?: string | undefined;
                            aiGenerated?: boolean | undefined;
                        };
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared/types/skill-mapping").SkillMapping | {
                                error: string;
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
        };
    } & {
        [x: string]: {
            mappings: {
                ":id": {
                    delete: {
                        body: unknown;
                        params: {
                            id: string;
                        };
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
                        error: never;
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
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            readiness: {
                get: {
                    body: unknown;
                    params: {};
                    query: {
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
            "ai-analyze": {
                post: {
                    body: {
                        gameExperience?: Record<string, unknown> | undefined;
                        resume?: Record<string, unknown> | undefined;
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
    };
} & {
    api: {
        [x: string]: {
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: {
                        q?: string | undefined;
                        types?: string | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: import("./services/search-service").UnifiedSearchResult;
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
            [x: string]: {
                get: {
                    body: unknown;
                    params: {};
                    query: {
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
                    error: never;
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
                    error: never;
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
                    error: never;
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
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                            } | {
                                resumeId: string;
                            };
                        };
                        error: never;
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
                        coverLetterId?: string | undefined;
                        jobId?: string | undefined;
                        customAnswers?: Record<string, string> | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            type: "email" | "job_apply" | "scrape";
                            status: "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                            output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
                                success: boolean;
                                error: string | null;
                                screenshots: string[];
                                artifacts: {
                                    id: string;
                                    kind: "document" | "log" | "screenshot" | "trace";
                                    path: string;
                                    label?: string | undefined;
                                    mimeType?: string | undefined;
                                }[];
                                steps: {
                                    action: string;
                                    status: "error" | "ok";
                                    message?: string | undefined;
                                }[];
                            } | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
                                message: string;
                                details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
                                source: string;
                            } | null;
                            progress: number | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                            exitCode: number | null;
                            timedOut: boolean;
                            aborted: boolean;
                            executionMs: number | null;
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
            "job-apply": {
                schedule: {
                    post: {
                        body: {
                            jobUrl: string;
                            resumeId: string;
                            coverLetterId?: string | undefined;
                            jobId?: string | undefined;
                            customAnswers?: Record<string, string> | undefined;
                            runAt: string;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                id: string;
                                type: "email" | "job_apply" | "scrape";
                                status: "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                                output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
                                    success: boolean;
                                    error: string | null;
                                    screenshots: string[];
                                    artifacts: {
                                        id: string;
                                        kind: "document" | "log" | "screenshot" | "trace";
                                        path: string;
                                        label?: string | undefined;
                                        mimeType?: string | undefined;
                                    }[];
                                    steps: {
                                        action: string;
                                        status: "error" | "ok";
                                        message?: string | undefined;
                                    }[];
                                } | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
                                    message: string;
                                    details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
                                    source: string;
                                } | null;
                                progress: number | null;
                                currentStep: number | null;
                                totalSteps: number | null;
                                startedAt: string | null;
                                completedAt: string | null;
                                createdAt: string;
                                updatedAt: string;
                                exitCode: number | null;
                                timedOut: boolean;
                                aborted: boolean;
                                executionMs: number | null;
                            } | {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                            } | {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
        };
    } & {
        [x: string]: {
            "email-response": {
                post: {
                    body: {
                        subject: string;
                        message: string;
                        sender?: string | undefined;
                        tone?: "concise" | "friendly" | "professional" | undefined;
                        recipientEmail?: string | undefined;
                        deliverAfterGeneration?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            runId: string;
                            status: "success";
                            reply: string;
                            provider: string;
                            model: string;
                            delivered: boolean;
                            recipientEmail?: string | undefined;
                            deliveredAt?: string | undefined;
                            messageId?: string | undefined;
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
            "email-response": {
                schedule: {
                    post: {
                        body: {
                            subject: string;
                            message: string;
                            sender?: string | undefined;
                            tone?: "concise" | "friendly" | "professional" | undefined;
                            recipientEmail?: string | undefined;
                            deliverAfterGeneration?: boolean | undefined;
                            runAt: string;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                id: string;
                                type: "email" | "job_apply" | "scrape";
                                status: "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                                output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
                                    success: boolean;
                                    error: string | null;
                                    screenshots: string[];
                                    artifacts: {
                                        id: string;
                                        kind: "document" | "log" | "screenshot" | "trace";
                                        path: string;
                                        label?: string | undefined;
                                        mimeType?: string | undefined;
                                    }[];
                                    steps: {
                                        action: string;
                                        status: "error" | "ok";
                                        message?: string | undefined;
                                    }[];
                                } | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
                                    message: string;
                                    details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
                                    source: string;
                                } | null;
                                progress: number | null;
                                currentStep: number | null;
                                totalSteps: number | null;
                                startedAt: string | null;
                                completedAt: string | null;
                                createdAt: string;
                                updatedAt: string;
                                exitCode: number | null;
                                timedOut: boolean;
                                aborted: boolean;
                                executionMs: number | null;
                            } | {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                            } | {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
        };
    } & {
        [x: string]: {
            scrape: {
                post: {
                    body: {
                        target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            type: "email" | "job_apply" | "scrape";
                            status: "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                            output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
                                success: boolean;
                                error: string | null;
                                screenshots: string[];
                                artifacts: {
                                    id: string;
                                    kind: "document" | "log" | "screenshot" | "trace";
                                    path: string;
                                    label?: string | undefined;
                                    mimeType?: string | undefined;
                                }[];
                                steps: {
                                    action: string;
                                    status: "error" | "ok";
                                    message?: string | undefined;
                                }[];
                            } | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
                                message: string;
                                details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
                                source: string;
                            } | null;
                            progress: number | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                            exitCode: number | null;
                            timedOut: boolean;
                            aborted: boolean;
                            executionMs: number | null;
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                        } | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
            scrape: {
                schedule: {
                    post: {
                        body: {
                            target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios";
                            runAt: string;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                id: string;
                                type: "email" | "job_apply" | "scrape";
                                status: "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                                output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
                                    success: boolean;
                                    error: string | null;
                                    screenshots: string[];
                                    artifacts: {
                                        id: string;
                                        kind: "document" | "log" | "screenshot" | "trace";
                                        path: string;
                                        label?: string | undefined;
                                        mimeType?: string | undefined;
                                    }[];
                                    steps: {
                                        action: string;
                                        status: "error" | "ok";
                                        message?: string | undefined;
                                    }[];
                                } | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
                                    message: string;
                                    details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
                                    source: string;
                                } | null;
                                progress: number | null;
                                currentStep: number | null;
                                totalSteps: number | null;
                                startedAt: string | null;
                                completedAt: string | null;
                                createdAt: string;
                                updatedAt: string;
                                exitCode: number | null;
                                timedOut: boolean;
                                aborted: boolean;
                                executionMs: number | null;
                            } | {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                            } | {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
                        200: import("@bao/shared/constants/automation").RpaCapabilityAuditReport | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                        };
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
            runs: {
                get: {
                    body: unknown;
                    params: {};
                    query: {
                        type?: "email" | "job_apply" | "scrape" | undefined;
                        status?: "error" | "pending" | "running" | "success" | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            type: "email" | "job_apply" | "scrape";
                            status: "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                            output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
                                success: boolean;
                                error: string | null;
                                screenshots: string[];
                                artifacts: {
                                    id: string;
                                    kind: "document" | "log" | "screenshot" | "trace";
                                    path: string;
                                    label?: string | undefined;
                                    mimeType?: string | undefined;
                                }[];
                                steps: {
                                    action: string;
                                    status: "error" | "ok";
                                    message?: string | undefined;
                                }[];
                            } | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
                                message: string;
                                details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
                                source: string;
                            } | null;
                            progress: number | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            createdAt: string;
                            updatedAt: string;
                            exitCode: number | null;
                            timedOut: boolean;
                            aborted: boolean;
                            executionMs: number | null;
                        }[] | {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
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
            runs: {
                ":id": {
                    get: {
                        body: unknown;
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                id: string;
                                type: "email" | "job_apply" | "scrape";
                                status: "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | null;
                                output: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | {
                                    success: boolean;
                                    error: string | null;
                                    screenshots: string[];
                                    artifacts: {
                                        id: string;
                                        kind: "document" | "log" | "screenshot" | "trace";
                                        path: string;
                                        label?: string | undefined;
                                        mimeType?: string | undefined;
                                    }[];
                                    steps: {
                                        action: string;
                                        status: "error" | "ok";
                                        message?: string | undefined;
                                    }[];
                                } | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: "AUTOMATION_CANCELLED" | "AUTOMATION_RUNTIME_ERROR" | "AUTOMATION_TIMEOUT" | "NETWORK_ERROR" | "OUTPUT_PERSISTENCE_ERROR" | "OUTPUT_VALIDATION_ERROR" | "SCRIPT_OUTPUT_INVALID" | "SCRIPT_PROTOCOL_ERROR" | "UNKNOWN_ERROR";
                                    message: string;
                                    details?: Record<string, string | number | boolean | unknown[] | Record<string, unknown> | null> | undefined;
                                    source: string;
                                } | null;
                                progress: number | null;
                                currentStep: number | null;
                                totalSteps: number | null;
                                startedAt: string | null;
                                completedAt: string | null;
                                createdAt: string;
                                updatedAt: string;
                                exitCode: number | null;
                                timedOut: boolean;
                                aborted: boolean;
                                executionMs: number | null;
                            } | {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                            };
                        };
                        error: never;
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
                            runId: string;
                            index: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: Response | {
                                error: string;
                            };
                        };
                        error: never;
                    };
                };
            };
        };
    };
} & {
    api: {
        [x: string]: {
            subscribe: import("elysia/types").CreateWSEdenResponse<string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
                readonly body: import("typebox").TObject<{
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"subscribe">, import("typebox").TLiteral<"unsubscribe">]>;
                    runId: import("typebox").TOptional<import("typebox").TString>;
                }>;
                readonly beforeHandle: unknown;
                readonly message: unknown;
                readonly close: unknown;
            }, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, import("elysia/types").ComposeElysiaResponse<import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
                readonly body: import("typebox").TObject<{
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"subscribe">, import("typebox").TLiteral<"unsubscribe">]>;
                    runId: import("typebox").TOptional<import("typebox").TString>;
                }>;
                readonly beforeHandle: unknown;
                readonly message: unknown;
                readonly close: unknown;
            }, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, void, {}, [], string>>;
        };
    };
} & {
    api: {
        [x: string]: {
            subscribe: import("elysia/types").CreateWSEdenResponse<string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
                readonly body: import("typebox").TObject<{
                    content: import("typebox").TString;
                    sessionId: import("typebox").TOptional<import("typebox").TString>;
                }>;
                readonly beforeHandle: unknown;
                readonly open: unknown;
                readonly message: unknown;
                readonly close: () => void;
            }, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, import("elysia/types").ComposeElysiaResponse<import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
                readonly body: import("typebox").TObject<{
                    content: import("typebox").TString;
                    sessionId: import("typebox").TOptional<import("typebox").TString>;
                }>;
                readonly beforeHandle: unknown;
                readonly open: unknown;
                readonly message: unknown;
                readonly close: () => void;
            }, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, void, {}, [], string>>;
        };
    };
} & {
    api: {
        [x: string]: {
            subscribe: import("elysia/types").CreateWSEdenResponse<string, import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
                readonly body: import("typebox").TObject<{
                    type: import("typebox").TString;
                    sessionId: import("typebox").TOptional<import("typebox").TString>;
                    content: import("typebox").TOptional<import("typebox").TString>;
                    studioId: import("typebox").TOptional<import("typebox").TString>;
                    config: import("typebox").TOptional<import("typebox").TObject<{
                        roleType: import("typebox").TOptional<import("typebox").TString>;
                        roleCategory: import("typebox").TOptional<import("typebox").TString>;
                        experienceLevel: import("typebox").TOptional<import("typebox").TString>;
                        focusAreas: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        duration: import("typebox").TOptional<import("typebox").TInteger>;
                        questionCount: import("typebox").TOptional<import("typebox").TInteger>;
                        includeTechnical: import("typebox").TOptional<import("typebox").TBoolean>;
                        includeBehavioral: import("typebox").TOptional<import("typebox").TBoolean>;
                        includeStudioSpecific: import("typebox").TOptional<import("typebox").TBoolean>;
                        enableVoiceMode: import("typebox").TOptional<import("typebox").TBoolean>;
                        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        voiceSettings: import("typebox").TOptional<import("typebox").TObject<{
                            microphoneId: import("typebox").TOptional<import("typebox").TString>;
                            speakerId: import("typebox").TOptional<import("typebox").TString>;
                            voiceId: import("typebox").TOptional<import("typebox").TString>;
                            rate: import("typebox").TOptional<import("typebox").TNumber>;
                            pitch: import("typebox").TOptional<import("typebox").TNumber>;
                            volume: import("typebox").TOptional<import("typebox").TNumber>;
                            language: import("typebox").TOptional<import("typebox").TString>;
                        }>>;
                        interviewMode: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"studio">, import("typebox").TLiteral<"job">]>>;
                        conversationStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"natural">, import("typebox").TLiteral<"structured">]>>;
                        targetJob: import("typebox").TOptional<import("typebox").TObject<{
                            id: import("typebox").TString;
                            title: import("typebox").TString;
                            company: import("typebox").TString;
                            location: import("typebox").TString;
                            description: import("typebox").TOptional<import("typebox").TString>;
                            requirements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                            source: import("typebox").TOptional<import("typebox").TString>;
                            postedDate: import("typebox").TOptional<import("typebox").TString>;
                            url: import("typebox").TOptional<import("typebox").TString>;
                        }>>;
                        candidateContext: import("typebox").TOptional<import("typebox").TObject<{
                            resumeId: import("typebox").TOptional<import("typebox").TString>;
                            coverLetterId: import("typebox").TOptional<import("typebox").TString>;
                            portfolioId: import("typebox").TOptional<import("typebox").TString>;
                        }>>;
                    }>>;
                }>;
                readonly beforeHandle: unknown;
                readonly open: unknown;
                readonly message: unknown;
                readonly close: () => void;
            }, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, {}, import("elysia/types").ComposeElysiaResponse<import("elysia/types").IntersectIfObjectSchema<import("elysia").UnwrapRoute<{
                readonly body: import("typebox").TObject<{
                    type: import("typebox").TString;
                    sessionId: import("typebox").TOptional<import("typebox").TString>;
                    content: import("typebox").TOptional<import("typebox").TString>;
                    studioId: import("typebox").TOptional<import("typebox").TString>;
                    config: import("typebox").TOptional<import("typebox").TObject<{
                        roleType: import("typebox").TOptional<import("typebox").TString>;
                        roleCategory: import("typebox").TOptional<import("typebox").TString>;
                        experienceLevel: import("typebox").TOptional<import("typebox").TString>;
                        focusAreas: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        duration: import("typebox").TOptional<import("typebox").TInteger>;
                        questionCount: import("typebox").TOptional<import("typebox").TInteger>;
                        includeTechnical: import("typebox").TOptional<import("typebox").TBoolean>;
                        includeBehavioral: import("typebox").TOptional<import("typebox").TBoolean>;
                        includeStudioSpecific: import("typebox").TOptional<import("typebox").TBoolean>;
                        enableVoiceMode: import("typebox").TOptional<import("typebox").TBoolean>;
                        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        voiceSettings: import("typebox").TOptional<import("typebox").TObject<{
                            microphoneId: import("typebox").TOptional<import("typebox").TString>;
                            speakerId: import("typebox").TOptional<import("typebox").TString>;
                            voiceId: import("typebox").TOptional<import("typebox").TString>;
                            rate: import("typebox").TOptional<import("typebox").TNumber>;
                            pitch: import("typebox").TOptional<import("typebox").TNumber>;
                            volume: import("typebox").TOptional<import("typebox").TNumber>;
                            language: import("typebox").TOptional<import("typebox").TString>;
                        }>>;
                        interviewMode: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"studio">, import("typebox").TLiteral<"job">]>>;
                        conversationStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"natural">, import("typebox").TLiteral<"structured">]>>;
                        targetJob: import("typebox").TOptional<import("typebox").TObject<{
                            id: import("typebox").TString;
                            title: import("typebox").TString;
                            company: import("typebox").TString;
                            location: import("typebox").TString;
                            description: import("typebox").TOptional<import("typebox").TString>;
                            requirements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                            source: import("typebox").TOptional<import("typebox").TString>;
                            postedDate: import("typebox").TOptional<import("typebox").TString>;
                            url: import("typebox").TOptional<import("typebox").TString>;
                        }>>;
                        candidateContext: import("typebox").TOptional<import("typebox").TObject<{
                            resumeId: import("typebox").TOptional<import("typebox").TString>;
                            coverLetterId: import("typebox").TOptional<import("typebox").TString>;
                            portfolioId: import("typebox").TOptional<import("typebox").TString>;
                        }>>;
                    }>>;
                }>;
                readonly beforeHandle: unknown;
                readonly open: unknown;
                readonly message: unknown;
                readonly close: () => void;
            }, {}, `/${string}`>, import("elysia/types").MergeScopedSchemas<{}, {}, {}>>, void, {}, [], string>>;
        };
    };
}, import("elysia/types").DefaultEphemeral, {
    derive: {};
    schema: {};
    schemas: {};
    response: {};
    error: [];
}>;
export type App = typeof app;
