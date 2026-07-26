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
}, import("elysia/types").DefaultMetadata & {
    schema: {};
    schemas: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {
        401: {
            readonly error: string;
        };
    };
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
                            configured: boolean;
                            apiKey?: string | undefined;
                            message?: string | undefined;
                        };
                        400: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        403: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            configured: boolean;
                            apiKey?: string | undefined;
                            message?: string | undefined;
                        };
                        401: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                    };
                    error: never;
                };
            };
        } & {
            [x: string]: {
                post: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            revoked: boolean;
                            message?: string | undefined;
                        };
                        401: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        };
                        400: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        422: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        };
                        400: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        422: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        id: string;
                        geminiApiKey: string | null;
                        openaiApiKey: string | null;
                        claudeApiKey: string | null;
                        huggingfaceToken: string | null;
                        localModelEndpoint: string | null;
                        localModelName: string | null;
                        aiRouting: {
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
                        };
                        preferredProvider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                        preferredModel: string | null;
                        theme: "business" | "corporate";
                        language: "en-US" | "es-ES" | "fr-FR" | "ja-JP" | null;
                        brandSettings: {
                            name: string;
                            assistantName: string;
                            apiName: string;
                            logoPath: string;
                            faviconPath: string;
                            typography: {
                                fontStylesheetUrl: string;
                                displayFontFamily: string;
                                bodyFontFamily: string;
                                monoFontFamily: string;
                            };
                            lightTheme: {
                                base100: string;
                                base200: string;
                                base300: string;
                                baseContent: string;
                                primary: string;
                                primaryContent: string;
                                secondary: string;
                                secondaryContent: string;
                                accent: string;
                                accentContent: string;
                                neutral: string;
                                neutralContent: string;
                                info: string;
                                infoContent: string;
                                success: string;
                                successContent: string;
                                warning: string;
                                warningContent: string;
                                error: string;
                                errorContent: string;
                                radiusSelector: string;
                                radiusField: string;
                                radiusBox: string;
                                sizeSelector: string;
                                sizeField: string;
                                border: string;
                                depth: string;
                                noise: string;
                            };
                            darkTheme: {
                                base100: string;
                                base200: string;
                                base300: string;
                                baseContent: string;
                                primary: string;
                                primaryContent: string;
                                secondary: string;
                                secondaryContent: string;
                                accent: string;
                                accentContent: string;
                                neutral: string;
                                neutralContent: string;
                                info: string;
                                infoContent: string;
                                success: string;
                                successContent: string;
                                warning: string;
                                warningContent: string;
                                error: string;
                                errorContent: string;
                                radiusSelector: string;
                                radiusField: string;
                                radiusBox: string;
                                sizeSelector: string;
                                sizeField: string;
                                border: string;
                                depth: string;
                                noise: string;
                            };
                            content: {
                                tagline: string;
                                defaultTitle: string;
                                defaultDescription: string;
                                contentOverrides: Record<string, string>;
                            };
                        };
                        notifications: {
                            achievements: boolean;
                            dailyChallenges: boolean;
                            jobAlerts: boolean;
                            levelUp: boolean;
                        } | null;
                        automationSettings: {
                            headless: boolean;
                            defaultTimeout: number;
                            screenshotRetention: number;
                            maxConcurrentRuns: number;
                            defaultBrowser: "chrome" | "chromium" | "edge";
                            enableSmartSelectors: boolean;
                            autoSaveScreenshots: boolean;
                            speech: {
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
                            };
                            jobProviders: {
                                providerTimeoutMs: number;
                                companyBoardResultLimit: number;
                                gamingBoardResultLimit: number;
                                unknownLocationLabel: string;
                                unknownCompanyLabel: string;
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
                            };
                        } | null;
                        emailTransportSettings: {
                            host: string;
                            port: number;
                            security: "plain" | "starttls" | "tls";
                            username: string;
                            fromEmail: string;
                            fromName: string;
                            authMethod: "login" | "plain";
                            connectionTimeoutSeconds: number;
                        } | null;
                        createdAt: string;
                        updatedAt: string;
                        providerDiagnostics?: Record<string, {
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            code: string;
                            checkedAt: string;
                            endpoint?: string | undefined;
                            selectedModel?: string | undefined;
                            availableModels?: string[] | undefined;
                            message?: string | undefined;
                        }> | undefined;
                        hasGeminiKey: boolean;
                        hasOpenaiKey: boolean;
                        hasClaudeKey: boolean;
                        hasHuggingfaceToken: boolean;
                        hasEmailTransportPassword: boolean;
                        hasLocalKey: boolean;
                        jobTaxonomy: {
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
                    };
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
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
                    };
                    422: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    429: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
                    };
                    500: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
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
                            jobTaxonomy: {
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            valid: boolean;
                            provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                            diagnosticCode?: string | undefined;
                            message?: string | undefined;
                            availableModels?: string[] | undefined;
                            selectedModel?: string | undefined;
                            error?: string | undefined;
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: {
                            version: "1.0";
                            exportedAt: string;
                            profile: unknown;
                            settings: unknown;
                            resumes: unknown[];
                            coverLetters: unknown[];
                            portfolio: unknown;
                            portfolioProjects: unknown[];
                            interviewSessions: unknown[];
                            gamification: unknown;
                            applications: unknown[];
                            chatHistory: unknown[];
                            savedJobs: unknown[];
                            skillMappings: unknown[];
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
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
                        200: {
                            imported: Record<string, number>;
                            skipped: Record<string, number>;
                            errors: string[];
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            id: string;
                            title: string;
                            company: string;
                            location: string;
                            remote?: boolean | null | undefined;
                            hybrid?: boolean | null | undefined;
                            salary?: unknown;
                            description?: string | null | undefined;
                            requirements?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            experienceLevel?: string | null | undefined;
                            type?: string | null | undefined;
                            postedDate?: string | null | undefined;
                            url?: string | null | undefined;
                            source?: string | null | undefined;
                            studioType?: string | null | undefined;
                            gameGenres?: string[] | null | undefined;
                            platforms?: string[] | null | undefined;
                            contentHash?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            companyLogo?: string | null | undefined;
                            applicationUrl?: string | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                            matchScore?: number | undefined;
                            matchReason?: string | undefined;
                            rank?: number | undefined;
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
                            remote?: boolean | null | undefined;
                            hybrid?: boolean | null | undefined;
                            salary?: unknown;
                            description?: string | null | undefined;
                            requirements?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            experienceLevel?: string | null | undefined;
                            type?: string | null | undefined;
                            postedDate?: string | null | undefined;
                            url?: string | null | undefined;
                            source?: string | null | undefined;
                            studioType?: string | null | undefined;
                            gameGenres?: string[] | null | undefined;
                            platforms?: string[] | null | undefined;
                            contentHash?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            companyLogo?: string | null | undefined;
                            applicationUrl?: string | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                            matchScore?: number | undefined;
                            matchReason?: string | undefined;
                            rank?: number | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            message?: string | undefined;
                            saved?: {
                                id: string;
                                jobId: string;
                                savedAt: string;
                            } | undefined;
                            id?: string | undefined;
                            jobId?: string | undefined;
                            savedAt?: string | undefined;
                        };
                        201: {
                            id: string;
                            jobId: string;
                            savedAt: string;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                                deletedCount: number;
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
                                remote?: boolean | null | undefined;
                                hybrid?: boolean | null | undefined;
                                salary?: unknown;
                                description?: string | null | undefined;
                                requirements?: string[] | null | undefined;
                                technologies?: string[] | null | undefined;
                                experienceLevel?: string | null | undefined;
                                type?: string | null | undefined;
                                postedDate?: string | null | undefined;
                                url?: string | null | undefined;
                                source?: string | null | undefined;
                                studioType?: string | null | undefined;
                                gameGenres?: string[] | null | undefined;
                                platforms?: string[] | null | undefined;
                                contentHash?: string | null | undefined;
                                tags?: string[] | null | undefined;
                                companyLogo?: string | null | undefined;
                                applicationUrl?: string | null | undefined;
                                enrichment?: unknown;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                                matchScore?: number | undefined;
                                matchReason?: string | undefined;
                                rank?: number | undefined;
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
                            message?: string | undefined;
                            application?: {
                                id: string;
                                jobId: string;
                                status: string | null;
                                appliedDate?: string | null | undefined;
                                notes?: string | null | undefined;
                                timeline?: unknown[] | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            } | undefined;
                            id?: string | undefined;
                            jobId?: string | undefined;
                            status?: string | undefined;
                            appliedDate?: string | undefined;
                            notes?: string | undefined;
                            timeline?: unknown[] | undefined;
                        };
                        201: {
                            id: string;
                            jobId: string;
                            status: string | null;
                            appliedDate?: string | null | undefined;
                            notes?: string | null | undefined;
                            timeline?: unknown[] | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                                appliedDate?: string | null | undefined;
                                notes?: string | null | undefined;
                                timeline?: unknown[] | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            appliedDate?: string | null | undefined;
                            notes?: string | null | undefined;
                            timeline?: unknown[] | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
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
                        200: {
                            recommendations: {
                                id: string;
                                title: string;
                                company: string;
                                location: string;
                                remote?: boolean | null | undefined;
                                hybrid?: boolean | null | undefined;
                                salary?: unknown;
                                description?: string | null | undefined;
                                requirements?: string[] | null | undefined;
                                technologies?: string[] | null | undefined;
                                experienceLevel?: string | null | undefined;
                                type?: string | null | undefined;
                                postedDate?: string | null | undefined;
                                url?: string | null | undefined;
                                source?: string | null | undefined;
                                studioType?: string | null | undefined;
                                gameGenres?: string[] | null | undefined;
                                platforms?: string[] | null | undefined;
                                contentHash?: string | null | undefined;
                                tags?: string[] | null | undefined;
                                companyLogo?: string | null | undefined;
                                applicationUrl?: string | null | undefined;
                                enrichment?: unknown;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                                matchScore?: number | undefined;
                                matchReason?: string | undefined;
                                rank?: number | undefined;
                            }[];
                            reason: string;
                            aiPowered: boolean;
                            provider?: string | undefined;
                        };
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            questions: {
                                id: string;
                                question: string;
                                category: string;
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        201: {
                            id: string;
                            name: string;
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
                            summary: string;
                            experience: {
                                title: string;
                                company: string;
                                startDate: string;
                                endDate?: string | undefined;
                                location?: string | undefined;
                                description?: string | undefined;
                                achievements?: string[] | undefined;
                                technologies?: string[] | undefined;
                            }[];
                            education: {
                                degree: string;
                                field: string;
                                school: string;
                                year: string;
                                gpa?: string | undefined;
                            }[];
                            skills?: {
                                technical?: string[] | undefined;
                                soft?: string[] | undefined;
                                gaming?: string[] | undefined;
                            } | undefined;
                            projects: {
                                title: string;
                                description: string;
                                technologies?: string[] | undefined;
                                link?: string | undefined;
                            }[];
                            gamingExperience?: {
                                gameEngines?: string | undefined;
                                platforms?: string | undefined;
                                genres?: string | undefined;
                                shippedTitles?: string | undefined;
                            } | undefined;
                            template: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical";
                            theme: "dark" | "light";
                            isDefault: boolean;
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                    200: {
                        id: string;
                        name: string;
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
                        summary: string;
                        experience: {
                            title: string;
                            company: string;
                            startDate: string;
                            endDate?: string | undefined;
                            location?: string | undefined;
                            description?: string | undefined;
                            achievements?: string[] | undefined;
                            technologies?: string[] | undefined;
                        }[];
                        education: {
                            degree: string;
                            field: string;
                            school: string;
                            year: string;
                            gpa?: string | undefined;
                        }[];
                        skills?: {
                            technical?: string[] | undefined;
                            soft?: string[] | undefined;
                            gaming?: string[] | undefined;
                        } | undefined;
                        projects: {
                            title: string;
                            description: string;
                            technologies?: string[] | undefined;
                            link?: string | undefined;
                        }[];
                        gamingExperience?: {
                            gameEngines?: string | undefined;
                            platforms?: string | undefined;
                            genres?: string | undefined;
                            shippedTitles?: string | undefined;
                        } | undefined;
                        template: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical";
                        theme: "dark" | "light";
                        isDefault: boolean;
                    }[];
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
                    201: {
                        id: string;
                        name: string;
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
                        summary: string;
                        experience: {
                            title: string;
                            company: string;
                            startDate: string;
                            endDate?: string | undefined;
                            location?: string | undefined;
                            description?: string | undefined;
                            achievements?: string[] | undefined;
                            technologies?: string[] | undefined;
                        }[];
                        education: {
                            degree: string;
                            field: string;
                            school: string;
                            year: string;
                            gpa?: string | undefined;
                        }[];
                        skills?: {
                            technical?: string[] | undefined;
                            soft?: string[] | undefined;
                            gaming?: string[] | undefined;
                        } | undefined;
                        projects: {
                            title: string;
                            description: string;
                            technologies?: string[] | undefined;
                            link?: string | undefined;
                        }[];
                        gamingExperience?: {
                            gameEngines?: string | undefined;
                            platforms?: string | undefined;
                            genres?: string | undefined;
                            shippedTitles?: string | undefined;
                        } | undefined;
                        template: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical";
                        theme: "dark" | "light";
                        isDefault: boolean;
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
                            name: string;
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
                            summary: string;
                            experience: {
                                title: string;
                                company: string;
                                startDate: string;
                                endDate?: string | undefined;
                                location?: string | undefined;
                                description?: string | undefined;
                                achievements?: string[] | undefined;
                                technologies?: string[] | undefined;
                            }[];
                            education: {
                                degree: string;
                                field: string;
                                school: string;
                                year: string;
                                gpa?: string | undefined;
                            }[];
                            skills?: {
                                technical?: string[] | undefined;
                                soft?: string[] | undefined;
                                gaming?: string[] | undefined;
                            } | undefined;
                            projects: {
                                title: string;
                                description: string;
                                technologies?: string[] | undefined;
                                link?: string | undefined;
                            }[];
                            gamingExperience?: {
                                gameEngines?: string | undefined;
                                platforms?: string | undefined;
                                genres?: string | undefined;
                                shippedTitles?: string | undefined;
                            } | undefined;
                            template: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical";
                            theme: "dark" | "light";
                            isDefault: boolean;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: {
                            id: string;
                            name: string;
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
                            summary: string;
                            experience: {
                                title: string;
                                company: string;
                                startDate: string;
                                endDate?: string | undefined;
                                location?: string | undefined;
                                description?: string | undefined;
                                achievements?: string[] | undefined;
                                technologies?: string[] | undefined;
                            }[];
                            education: {
                                degree: string;
                                field: string;
                                school: string;
                                year: string;
                                gpa?: string | undefined;
                            }[];
                            skills?: {
                                technical?: string[] | undefined;
                                soft?: string[] | undefined;
                                gaming?: string[] | undefined;
                            } | undefined;
                            projects: {
                                title: string;
                                description: string;
                                technologies?: string[] | undefined;
                                link?: string | undefined;
                            }[];
                            gamingExperience?: {
                                gameEngines?: string | undefined;
                                platforms?: string | undefined;
                                genres?: string | undefined;
                                shippedTitles?: string | undefined;
                            } | undefined;
                            template: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical";
                            theme: "dark" | "light";
                            isDefault: boolean;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            success: boolean;
                            id: string;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            200: unknown;
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            500: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            jobId?: string | undefined;
                            studioId?: string | undefined;
                        };
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                resume: {
                                    id: string;
                                    name: string;
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
                                    summary: string;
                                    experience: {
                                        title: string;
                                        company: string;
                                        startDate: string;
                                        endDate?: string | undefined;
                                        location?: string | undefined;
                                        description?: string | undefined;
                                        achievements?: string[] | undefined;
                                        technologies?: string[] | undefined;
                                    }[];
                                    education: {
                                        degree: string;
                                        field: string;
                                        school: string;
                                        year: string;
                                        gpa?: string | undefined;
                                    }[];
                                    skills?: {
                                        technical?: string[] | undefined;
                                        soft?: string[] | undefined;
                                        gaming?: string[] | undefined;
                                    } | undefined;
                                    projects: {
                                        title: string;
                                        description: string;
                                        technologies?: string[] | undefined;
                                        link?: string | undefined;
                                    }[];
                                    gamingExperience?: {
                                        gameEngines?: string | undefined;
                                        platforms?: string | undefined;
                                        genres?: string | undefined;
                                        shippedTitles?: string | undefined;
                                    } | undefined;
                                    template: "classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical";
                                    theme: "dark" | "light";
                                    isDefault: boolean;
                                };
                                suggestions: {
                                    text: string;
                                    section: string;
                                }[];
                                section: string;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            500: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                                resumeId: string;
                                jobId: string;
                                score: number;
                                strengths: string[];
                                improvements: string[];
                                keywords: string[];
                                analysis: Record<string, unknown>;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            500: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                        jobInfo?: Record<string, unknown> | null | undefined;
                        content?: Record<string, unknown> | null | undefined;
                        template?: string | null | undefined;
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
                        jobInfo?: Record<string, unknown> | null | undefined;
                        content?: Record<string, unknown> | null | undefined;
                        template?: string | null | undefined;
                        createdAt: string;
                        updatedAt: string;
                    };
                    201: {
                        id: string;
                        company: string;
                        position: string;
                        jobInfo?: Record<string, unknown> | null | undefined;
                        content?: Record<string, unknown> | null | undefined;
                        template?: string | null | undefined;
                        createdAt: string;
                        updatedAt: string;
                    };
                    404: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
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
                            jobInfo?: Record<string, unknown> | null | undefined;
                            content?: Record<string, unknown> | null | undefined;
                            template?: string | null | undefined;
                            createdAt: string;
                            updatedAt: string;
                        };
                        201: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo?: Record<string, unknown> | null | undefined;
                            content?: Record<string, unknown> | null | undefined;
                            template?: string | null | undefined;
                            createdAt: string;
                            updatedAt: string;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            jobInfo?: Record<string, unknown> | null | undefined;
                            content?: Record<string, unknown> | null | undefined;
                            template?: string | null | undefined;
                            createdAt: string;
                            updatedAt: string;
                        };
                        201: {
                            id: string;
                            company: string;
                            position: string;
                            jobInfo?: Record<string, unknown> | null | undefined;
                            content?: Record<string, unknown> | null | undefined;
                            template?: string | null | undefined;
                            createdAt: string;
                            updatedAt: string;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            success: boolean;
                            id: string;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        jobId?: string | undefined;
                        studioId?: string | undefined;
                        template?: undefined;
                        save?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            content: {
                                introduction: string;
                                body: string;
                                conclusion: string;
                            };
                        };
                        201: {
                            message: string;
                            coverLetter: {
                                id: string;
                                company: string;
                                position: string;
                                jobInfo?: Record<string, unknown> | null | undefined;
                                content?: Record<string, unknown> | null | undefined;
                                template?: string | null | undefined;
                                createdAt: string;
                                updatedAt: string;
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        503: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            200: unknown;
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            500: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                        id?: string | undefined;
                        metadata?: Record<string, unknown> | undefined;
                        projects: {
                            id?: string | undefined;
                            portfolioId?: string | undefined;
                            title: string;
                            description: string;
                            technologies?: string[] | null | undefined;
                            image?: string | null | undefined;
                            liveUrl?: string | null | undefined;
                            githubUrl?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            featured?: boolean | null | undefined;
                            role?: string | null | undefined;
                            platforms?: string[] | null | undefined;
                            engines?: string[] | null | undefined;
                            sortOrder?: number | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        }[];
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
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
                    200: {
                        id?: string | undefined;
                        metadata?: Record<string, unknown> | undefined;
                        projects: {
                            id?: string | undefined;
                            portfolioId?: string | undefined;
                            title: string;
                            description: string;
                            technologies?: string[] | null | undefined;
                            image?: string | null | undefined;
                            liveUrl?: string | null | undefined;
                            githubUrl?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            featured?: boolean | null | undefined;
                            role?: string | null | undefined;
                            platforms?: string[] | null | undefined;
                            engines?: string[] | null | undefined;
                            sortOrder?: number | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        }[];
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
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
                        200: {
                            id?: string | undefined;
                            portfolioId?: string | undefined;
                            title: string;
                            description: string;
                            technologies?: string[] | null | undefined;
                            image?: string | null | undefined;
                            liveUrl?: string | null | undefined;
                            githubUrl?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            featured?: boolean | null | undefined;
                            role?: string | null | undefined;
                            platforms?: string[] | null | undefined;
                            engines?: string[] | null | undefined;
                            sortOrder?: number | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        201: {
                            id?: string | undefined;
                            portfolioId?: string | undefined;
                            title: string;
                            description: string;
                            technologies?: string[] | null | undefined;
                            image?: string | null | undefined;
                            liveUrl?: string | null | undefined;
                            githubUrl?: string | null | undefined;
                            tags?: string[] | null | undefined;
                            featured?: boolean | null | undefined;
                            role?: string | null | undefined;
                            platforms?: string[] | null | undefined;
                            engines?: string[] | null | undefined;
                            sortOrder?: number | null | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            200: {
                                id?: string | undefined;
                                metadata?: Record<string, unknown> | undefined;
                                projects: {
                                    id?: string | undefined;
                                    portfolioId?: string | undefined;
                                    title: string;
                                    description: string;
                                    technologies?: string[] | null | undefined;
                                    image?: string | null | undefined;
                                    liveUrl?: string | null | undefined;
                                    githubUrl?: string | null | undefined;
                                    tags?: string[] | null | undefined;
                                    featured?: boolean | null | undefined;
                                    role?: string | null | undefined;
                                    platforms?: string[] | null | undefined;
                                    engines?: string[] | null | undefined;
                                    sortOrder?: number | null | undefined;
                                    createdAt?: string | undefined;
                                    updatedAt?: string | undefined;
                                }[];
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
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
                            500: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            200: {
                                id?: string | undefined;
                                portfolioId?: string | undefined;
                                title: string;
                                description: string;
                                technologies?: string[] | null | undefined;
                                image?: string | null | undefined;
                                liveUrl?: string | null | undefined;
                                githubUrl?: string | null | undefined;
                                tags?: string[] | null | undefined;
                                featured?: boolean | null | undefined;
                                role?: string | null | undefined;
                                platforms?: string[] | null | undefined;
                                engines?: string[] | null | undefined;
                                sortOrder?: number | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            };
                            201: {
                                id?: string | undefined;
                                portfolioId?: string | undefined;
                                title: string;
                                description: string;
                                technologies?: string[] | null | undefined;
                                image?: string | null | undefined;
                                liveUrl?: string | null | undefined;
                                githubUrl?: string | null | undefined;
                                tags?: string[] | null | undefined;
                                featured?: boolean | null | undefined;
                                role?: string | null | undefined;
                                platforms?: string[] | null | undefined;
                                engines?: string[] | null | undefined;
                                sortOrder?: number | null | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            500: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                                success: boolean;
                                id: string;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                        template?: "gaming" | "minimal" | "modern" | "showcase" | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: unknown;
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        201: {
                            id: string;
                            studioId: string;
                            config: {
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
                            };
                            questions: {
                                id: string;
                                type: "behavioral" | "closing" | "intro" | "studio-specific" | "technical";
                                question: string;
                                followUps: string[];
                                expectedDuration: number;
                                difficulty: "easy" | "hard" | "medium";
                                tags: string[];
                                score?: number | undefined;
                                feedback?: string | undefined;
                                response?: string | undefined;
                            }[];
                            currentQuestionIndex: number;
                            totalQuestions: number;
                            startTime: number;
                            endTime?: number | undefined;
                            status: "active" | "cancelled" | "completed" | "paused" | "preparing";
                            responses: {
                                questionId: string;
                                transcript: string;
                                duration: number;
                                timestamp: number;
                                confidence: number;
                                aiAnalysis?: {
                                    score: number;
                                    feedback: string;
                                    strengths: string[];
                                    improvements: string[];
                                    source: "ai" | "heuristic" | "unknown";
                                    provider?: string | undefined;
                                    model?: string | undefined;
                                } | undefined;
                            }[];
                            finalAnalysis?: {
                                overallScore: number;
                                strengths: string[];
                                improvements: string[];
                                recommendations: string[];
                                feedback?: string | undefined;
                                analysisSource?: "ai" | "heuristic" | "mixed" | "unknown" | undefined;
                                aiAverageScore?: number | null | undefined;
                                provenanceCounts?: {
                                    ai: number;
                                    heuristic: number;
                                    unknown: number;
                                } | undefined;
                            } | undefined;
                            interviewerPersona?: {
                                name: string;
                                role: string;
                                studioName: string;
                                background: string;
                                style: string;
                                experience: string;
                            } | undefined;
                            role?: string | undefined;
                            studioName?: string | undefined;
                            score?: number | undefined;
                            duration?: string | undefined;
                            overallFeedback?: string | undefined;
                            totalResponses?: number | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                            message?: string | undefined;
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
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            studioId: string;
                            config: {
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
                            };
                            questions: {
                                id: string;
                                type: "behavioral" | "closing" | "intro" | "studio-specific" | "technical";
                                question: string;
                                followUps: string[];
                                expectedDuration: number;
                                difficulty: "easy" | "hard" | "medium";
                                tags: string[];
                                score?: number | undefined;
                                feedback?: string | undefined;
                                response?: string | undefined;
                            }[];
                            currentQuestionIndex: number;
                            totalQuestions: number;
                            startTime: number;
                            endTime?: number | undefined;
                            status: "active" | "cancelled" | "completed" | "paused" | "preparing";
                            responses: {
                                questionId: string;
                                transcript: string;
                                duration: number;
                                timestamp: number;
                                confidence: number;
                                aiAnalysis?: {
                                    score: number;
                                    feedback: string;
                                    strengths: string[];
                                    improvements: string[];
                                    source: "ai" | "heuristic" | "unknown";
                                    provider?: string | undefined;
                                    model?: string | undefined;
                                } | undefined;
                            }[];
                            finalAnalysis?: {
                                overallScore: number;
                                strengths: string[];
                                improvements: string[];
                                recommendations: string[];
                                feedback?: string | undefined;
                                analysisSource?: "ai" | "heuristic" | "mixed" | "unknown" | undefined;
                                aiAverageScore?: number | null | undefined;
                                provenanceCounts?: {
                                    ai: number;
                                    heuristic: number;
                                    unknown: number;
                                } | undefined;
                            } | undefined;
                            interviewerPersona?: {
                                name: string;
                                role: string;
                                studioName: string;
                                background: string;
                                style: string;
                                experience: string;
                            } | undefined;
                            role?: string | undefined;
                            studioName?: string | undefined;
                            score?: number | undefined;
                            duration?: string | undefined;
                            overallFeedback?: string | undefined;
                            totalResponses?: number | undefined;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                            message?: string | undefined;
                        }[];
                    };
                    error: never;
                };
            };
        };
    } & {
        [x: string]: {
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
                                studioId: string;
                                config: {
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
                                };
                                questions: {
                                    id: string;
                                    type: "behavioral" | "closing" | "intro" | "studio-specific" | "technical";
                                    question: string;
                                    followUps: string[];
                                    expectedDuration: number;
                                    difficulty: "easy" | "hard" | "medium";
                                    tags: string[];
                                    score?: number | undefined;
                                    feedback?: string | undefined;
                                    response?: string | undefined;
                                }[];
                                currentQuestionIndex: number;
                                totalQuestions: number;
                                startTime: number;
                                endTime?: number | undefined;
                                status: "active" | "cancelled" | "completed" | "paused" | "preparing";
                                responses: {
                                    questionId: string;
                                    transcript: string;
                                    duration: number;
                                    timestamp: number;
                                    confidence: number;
                                    aiAnalysis?: {
                                        score: number;
                                        feedback: string;
                                        strengths: string[];
                                        improvements: string[];
                                        source: "ai" | "heuristic" | "unknown";
                                        provider?: string | undefined;
                                        model?: string | undefined;
                                    } | undefined;
                                }[];
                                finalAnalysis?: {
                                    overallScore: number;
                                    strengths: string[];
                                    improvements: string[];
                                    recommendations: string[];
                                    feedback?: string | undefined;
                                    analysisSource?: "ai" | "heuristic" | "mixed" | "unknown" | undefined;
                                    aiAverageScore?: number | null | undefined;
                                    provenanceCounts?: {
                                        ai: number;
                                        heuristic: number;
                                        unknown: number;
                                    } | undefined;
                                } | undefined;
                                interviewerPersona?: {
                                    name: string;
                                    role: string;
                                    studioName: string;
                                    background: string;
                                    style: string;
                                    experience: string;
                                } | undefined;
                                role?: string | undefined;
                                studioName?: string | undefined;
                                score?: number | undefined;
                                duration?: string | undefined;
                                overallFeedback?: string | undefined;
                                totalResponses?: number | undefined;
                                createdAt?: string | undefined;
                                updatedAt?: string | undefined;
                                message?: string | undefined;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
                            };
                        };
                        error: never;
                    };
                };
            };
        };
    } & {
        [x: string]: {
            [x: string]: {
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
                                    id: string;
                                    studioId: string;
                                    config: {
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
                                    };
                                    questions: {
                                        id: string;
                                        type: "behavioral" | "closing" | "intro" | "studio-specific" | "technical";
                                        question: string;
                                        followUps: string[];
                                        expectedDuration: number;
                                        difficulty: "easy" | "hard" | "medium";
                                        tags: string[];
                                        score?: number | undefined;
                                        feedback?: string | undefined;
                                        response?: string | undefined;
                                    }[];
                                    currentQuestionIndex: number;
                                    totalQuestions: number;
                                    startTime: number;
                                    endTime?: number | undefined;
                                    status: "active" | "cancelled" | "completed" | "paused" | "preparing";
                                    responses: {
                                        questionId: string;
                                        transcript: string;
                                        duration: number;
                                        timestamp: number;
                                        confidence: number;
                                        aiAnalysis?: {
                                            score: number;
                                            feedback: string;
                                            strengths: string[];
                                            improvements: string[];
                                            source: "ai" | "heuristic" | "unknown";
                                            provider?: string | undefined;
                                            model?: string | undefined;
                                        } | undefined;
                                    }[];
                                    finalAnalysis?: {
                                        overallScore: number;
                                        strengths: string[];
                                        improvements: string[];
                                        recommendations: string[];
                                        feedback?: string | undefined;
                                        analysisSource?: "ai" | "heuristic" | "mixed" | "unknown" | undefined;
                                        aiAverageScore?: number | null | undefined;
                                        provenanceCounts?: {
                                            ai: number;
                                            heuristic: number;
                                            unknown: number;
                                        } | undefined;
                                    } | undefined;
                                    interviewerPersona?: {
                                        name: string;
                                        role: string;
                                        studioName: string;
                                        background: string;
                                        style: string;
                                        experience: string;
                                    } | undefined;
                                    role?: string | undefined;
                                    studioName?: string | undefined;
                                    score?: number | undefined;
                                    duration?: string | undefined;
                                    overallFeedback?: string | undefined;
                                    totalResponses?: number | undefined;
                                    createdAt?: string | undefined;
                                    updatedAt?: string | undefined;
                                    message?: string | undefined;
                                } & {
                                    message: string;
                                };
                                400: {
                                    error: string;
                                    code?: string | undefined;
                                    details?: string | undefined;
                                    fields?: string[] | undefined;
                                    id?: string | undefined;
                                };
                                404: {
                                    error: string;
                                    code?: string | undefined;
                                    details?: string | undefined;
                                    fields?: string[] | undefined;
                                    id?: string | undefined;
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
            [x: string]: {
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
                                    id: string;
                                    studioId: string;
                                    config: {
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
                                    };
                                    questions: {
                                        id: string;
                                        type: "behavioral" | "closing" | "intro" | "studio-specific" | "technical";
                                        question: string;
                                        followUps: string[];
                                        expectedDuration: number;
                                        difficulty: "easy" | "hard" | "medium";
                                        tags: string[];
                                        score?: number | undefined;
                                        feedback?: string | undefined;
                                        response?: string | undefined;
                                    }[];
                                    currentQuestionIndex: number;
                                    totalQuestions: number;
                                    startTime: number;
                                    endTime?: number | undefined;
                                    status: "active" | "cancelled" | "completed" | "paused" | "preparing";
                                    responses: {
                                        questionId: string;
                                        transcript: string;
                                        duration: number;
                                        timestamp: number;
                                        confidence: number;
                                        aiAnalysis?: {
                                            score: number;
                                            feedback: string;
                                            strengths: string[];
                                            improvements: string[];
                                            source: "ai" | "heuristic" | "unknown";
                                            provider?: string | undefined;
                                            model?: string | undefined;
                                        } | undefined;
                                    }[];
                                    finalAnalysis?: {
                                        overallScore: number;
                                        strengths: string[];
                                        improvements: string[];
                                        recommendations: string[];
                                        feedback?: string | undefined;
                                        analysisSource?: "ai" | "heuristic" | "mixed" | "unknown" | undefined;
                                        aiAverageScore?: number | null | undefined;
                                        provenanceCounts?: {
                                            ai: number;
                                            heuristic: number;
                                            unknown: number;
                                        } | undefined;
                                    } | undefined;
                                    interviewerPersona?: {
                                        name: string;
                                        role: string;
                                        studioName: string;
                                        background: string;
                                        style: string;
                                        experience: string;
                                    } | undefined;
                                    role?: string | undefined;
                                    studioName?: string | undefined;
                                    score?: number | undefined;
                                    duration?: string | undefined;
                                    overallFeedback?: string | undefined;
                                    totalResponses?: number | undefined;
                                    createdAt?: string | undefined;
                                    updatedAt?: string | undefined;
                                    message?: string | undefined;
                                } & {
                                    message: string;
                                };
                                404: {
                                    error: string;
                                    code?: string | undefined;
                                    details?: string | undefined;
                                    fields?: string[] | undefined;
                                    id?: string | undefined;
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
                        games?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        culture?: unknown;
                        interviewStyle?: string | null | undefined;
                        remoteWork?: boolean | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
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
                        200: {
                            totalStudios: number;
                            byType: Record<string, number>;
                            bySize: Record<string, number>;
                            remoteWorkStudios: number;
                            topTechnologies: {
                                name: string;
                                count: number;
                            }[];
                        };
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
                            games?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            culture?: unknown;
                            interviewStyle?: string | null | undefined;
                            remoteWork?: boolean | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        201: {
                            id: string;
                            name: string;
                            logo: string | null;
                            website: string | null;
                            location: string | null;
                            size: string | null;
                            type: string | null;
                            description: string | null;
                            games?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            culture?: unknown;
                            interviewStyle?: string | null | undefined;
                            remoteWork?: boolean | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        id: string;
                        name: string;
                        logo: string | null;
                        website: string | null;
                        location: string | null;
                        size: string | null;
                        type: string | null;
                        description: string | null;
                        games?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        culture?: unknown;
                        interviewStyle?: string | null | undefined;
                        remoteWork?: boolean | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    201: {
                        id: string;
                        name: string;
                        logo: string | null;
                        website: string | null;
                        location: string | null;
                        size: string | null;
                        type: string | null;
                        description: string | null;
                        games?: string[] | null | undefined;
                        technologies?: string[] | null | undefined;
                        culture?: unknown;
                        interviewStyle?: string | null | undefined;
                        remoteWork?: boolean | null | undefined;
                        enrichment?: unknown;
                        createdAt?: string | undefined;
                        updatedAt?: string | undefined;
                    };
                    404: {
                        error: string;
                        code?: string | undefined;
                        details?: string | undefined;
                        fields?: string[] | undefined;
                        id?: string | undefined;
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
                            games?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            culture?: unknown;
                            interviewStyle?: string | null | undefined;
                            remoteWork?: boolean | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        201: {
                            id: string;
                            name: string;
                            logo: string | null;
                            website: string | null;
                            location: string | null;
                            size: string | null;
                            type: string | null;
                            description: string | null;
                            games?: string[] | null | undefined;
                            technologies?: string[] | null | undefined;
                            culture?: unknown;
                            interviewStyle?: string | null | undefined;
                            remoteWork?: boolean | null | undefined;
                            enrichment?: unknown;
                            createdAt?: string | undefined;
                            updatedAt?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            message: string;
                            id: string;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: {
                            scraped: number;
                            upserted: number;
                            errors: string[];
                            enrichment: {
                                enabled: boolean;
                                enrichedRecords: number;
                                warnings: string[];
                                provider?: string | undefined;
                                model?: string | undefined;
                            };
                        };
                        400: {
                            error: string;
                            details?: string | undefined;
                        };
                        500: {
                            error: string;
                            details?: string | undefined;
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
                        200: {
                            scraped: number;
                            upserted: number;
                            errors: string[];
                            enrichment: {
                                enabled: boolean;
                                enrichedRecords: number;
                                warnings: string[];
                                provider?: string | undefined;
                                model?: string | undefined;
                            };
                        };
                        400: {
                            error: string;
                            details?: string | undefined;
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
                        500: {
                            error: string;
                            details?: string | undefined;
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
                        200: unknown;
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: unknown;
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: unknown;
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: {
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
                            configuredProviders?: ("claude" | "gemini" | "huggingface" | "local" | "openai")[] | undefined;
                            error?: string | undefined;
                            preferredModel?: string | null | undefined;
                            preferredProvider?: "claude" | "gemini" | "huggingface" | "local" | "openai" | undefined;
                            providerDiagnostics?: Record<string, {
                                provider: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                code: string;
                                checkedAt: string;
                                endpoint?: string | undefined;
                                selectedModel?: string | undefined;
                                availableModels?: string[] | undefined;
                                message?: string | undefined;
                            }> | undefined;
                            providers: {
                                id: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                nameKey: string;
                                descriptionKey: string;
                                iconId: "claude" | "gemini" | "huggingface" | "local" | "openai";
                                models: string[];
                                available: boolean;
                                health: "degraded" | "down" | "healthy" | "unconfigured";
                                selectedModel?: string | undefined;
                                diagnosticCode?: string | undefined;
                                availableModels?: string[] | undefined;
                                error?: string | undefined;
                            }[];
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                            runId: string;
                            status: string;
                            message: string;
                        };
                        400: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        404: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        409: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        422: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
            [x: string]: {
                post: {
                    body: {
                        audioBase64: string;
                        mimeType: string;
                        filename?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            text: string;
                            provider: string;
                            model: string;
                            message: string;
                        };
                        400: {
                            error: string;
                        };
                        422: {
                            error: string;
                        };
                        502: {
                            error: string;
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
                        text: string;
                        voice?: string | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            audioBase64: string;
                            mimeType: "audio/wav";
                            provider: string;
                            model: string;
                            voice: string;
                            bytes: number;
                            message: string;
                        };
                        400: {
                            error: string;
                        };
                        422: {
                            error: string;
                        };
                        502: {
                            error: string;
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
                        200: {
                            xp: number;
                            level: number;
                            achievements: string[];
                            dailyChallenges: Record<string, string[]>;
                            longestStreak: number;
                            currentStreak: number;
                            lastActiveDate?: string | undefined;
                            stats: Record<string, unknown>;
                            xpForNextLevel?: number | undefined;
                            streak?: number | undefined;
                        };
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
                            xp: number;
                            level: number;
                            leveledUp: boolean;
                            levelUp: {
                                xpGained: number;
                                oldLevel: number;
                                newLevel: number;
                                oldTitle: string;
                                newTitle: string;
                                unlockedFeatures: string[];
                                bonusXP?: number | undefined;
                            } | null;
                            reason: string;
                            message: string;
                        };
                        400: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                        200: {
                            id: string;
                            name: string;
                            description: string;
                            icon: string;
                            iconType: "custom" | "emoji";
                            category: "milestone" | "progress" | "skill" | "social" | "special";
                            xpReward: number;
                            requirements: Record<string, number>;
                            unlocked: boolean;
                            unlockedAt?: string | undefined;
                            rarity: "common" | "epic" | "legendary" | "rare";
                            hidden?: boolean | undefined;
                        }[];
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
                            challenges: {
                                id: string;
                                name: string;
                                description: string;
                                icon: string;
                                iconType: "custom" | "emoji";
                                xpReward: number;
                                category: "engagement" | "job_search" | "profile" | "skill_building" | "social";
                                completed: boolean;
                                requirements?: Record<string, number> | undefined;
                                validUntil?: string | undefined;
                                progress?: number | undefined;
                                goal?: number | undefined;
                            }[];
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
                                    message: string;
                                    challengeId?: string | undefined;
                                    completed: boolean;
                                    totalXP?: number | undefined;
                                    level?: number | undefined;
                                };
                                201: {
                                    message: string;
                                    challengeId?: string | undefined;
                                    completed: boolean;
                                    totalXP?: number | undefined;
                                    level?: number | undefined;
                                };
                                400: {
                                    error: string;
                                    code?: string | undefined;
                                    details?: string | undefined;
                                    fields?: string[] | undefined;
                                    id?: string | undefined;
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
                        200: {
                            challengesCompleted: number;
                            xpEarned: number;
                            actionsCount: number;
                            days: {
                                date: string;
                                actions: number;
                                xpEarned: number;
                            }[];
                            topCategory: string;
                        };
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
                            evidence: {
                                id: string;
                                type: string;
                                title: string;
                                description: string;
                                url?: string | undefined;
                                verificationStatus: string;
                            }[] | null;
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
                        evidence?: {
                            id?: string | undefined;
                            type?: string | undefined;
                            title: string;
                            description: string;
                            url?: string | undefined;
                            verificationStatus?: string | undefined;
                        }[] | undefined;
                        confidence?: number | undefined;
                        category?: string | undefined;
                        demandLevel?: string | undefined;
                        aiGenerated?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        201: {
                            id: string;
                            gameExpression: string;
                            transferableSkill: string;
                            industryApplications: string[];
                            evidenceSuggestions?: string[] | undefined;
                            evidence: {
                                id: string;
                                type: string;
                                title: string;
                                description: string;
                                url?: string | undefined;
                                verificationStatus: string;
                            }[];
                            confidence: number;
                            category: string;
                            demandLevel: string;
                            verified: boolean;
                            aiGenerated?: boolean | undefined;
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
            mappings: {
                ":id": {
                    put: {
                        body: {
                            gameExpression?: string | undefined;
                            transferableSkill?: string | undefined;
                            industryApplications?: string[] | undefined;
                            evidence?: {
                                id?: string | undefined;
                                type?: string | undefined;
                                title: string;
                                description: string;
                                url?: string | undefined;
                                verificationStatus?: string | undefined;
                            }[] | undefined;
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
                            200: {
                                id: string;
                                gameExpression: string;
                                transferableSkill: string;
                                industryApplications: string[];
                                evidenceSuggestions?: string[] | undefined;
                                evidence: {
                                    id: string;
                                    type: string;
                                    title: string;
                                    description: string;
                                    url?: string | undefined;
                                    verificationStatus: string;
                                }[];
                                confidence: number;
                                category: string;
                                demandLevel: string;
                                verified: boolean;
                                aiGenerated?: boolean | undefined;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            200: {
                                message: string;
                                id: string;
                            };
                            404: {
                                error: string;
                                id?: string | undefined;
                            };
                            410: {
                                error: string;
                                id?: string | undefined;
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
                        200: {
                            id: string;
                            title: string;
                            description: string;
                            detailedDescription?: string | undefined;
                            matchScore: number;
                            stages: {
                                title: string;
                                duration: string;
                                description: string;
                                completed?: boolean | undefined;
                                current?: boolean | undefined;
                                requirements?: string[] | undefined;
                                outcomes?: string[] | undefined;
                            }[];
                            requiredSkills: string[];
                            estimatedTimeToEntry: string;
                            icon?: string | undefined;
                            averageSalary?: {
                                min: number;
                                max: number;
                                currency?: string | undefined;
                            } | undefined;
                            jobMarketTrend: string;
                        }[];
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
                        200: {
                            overallScore: number;
                            categories: {
                                technical: {
                                    score: number;
                                    feedbackId: string;
                                    strengths?: string[] | undefined;
                                    improvements?: string[] | undefined;
                                };
                                softSkills: {
                                    score: number;
                                    feedbackId: string;
                                    strengths?: string[] | undefined;
                                    improvements?: string[] | undefined;
                                };
                                industryKnowledge: {
                                    score: number;
                                    feedbackId: string;
                                    strengths?: string[] | undefined;
                                    improvements?: string[] | undefined;
                                };
                                portfolio: {
                                    score: number;
                                    feedbackId: string;
                                    strengths?: string[] | undefined;
                                    improvements?: string[] | undefined;
                                };
                            };
                            improvementSuggestions: string[];
                            nextSteps: string[];
                            targetRoleReadiness?: {
                                roleId: string;
                                roleTitle: string;
                                readinessScore: number;
                                missingSkills: string[];
                                matchingSkills: string[];
                                timeToReady?: string | undefined;
                                recommendedActions: string[];
                            }[] | undefined;
                            jobId?: string | undefined;
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
                        gameExperience?: Record<string, string | number | boolean | null> | undefined;
                        resume?: Record<string, string | number | boolean | null> | undefined;
                        autoCreateMappings?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            detectedSkills: string[];
                            suggestedMappings: Record<string, string | number | boolean | null>[];
                            recommendations: string[];
                            provider?: string | undefined;
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
                        500: {
                            message: string;
                            detectedSkills: string[];
                            suggestedMappings: Record<string, string | number | boolean | null>[];
                            recommendations: string[];
                            provider?: string | undefined;
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
                        200: {
                            query: string;
                            results: {
                                type: "automation-runs" | "cover-letters" | "interview-sessions" | "jobs" | "portfolio-projects" | "resumes" | "skills" | "studios";
                                id: string;
                                title: string;
                                subtitle: string;
                                snippet: string;
                                relevance: number;
                            }[];
                            counts: {
                                jobs: number;
                                studios: number;
                                skills: number;
                                resumes: number;
                                "cover-letters": number;
                                "portfolio-projects": number;
                                "interview-sessions": number;
                                "automation-runs": number;
                            };
                            totalTime: number;
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
                        200: {
                            profile: {
                                completeness: number;
                            };
                            jobs: {
                                saved: number;
                                applied: number;
                                interviewing: number;
                                offered: number;
                            };
                            resumes: {
                                count: number;
                                lastUpdated: string | null;
                            };
                            coverLetters: {
                                count: number;
                            };
                            portfolio: {
                                projectCount: number;
                            };
                            interviews: {
                                totalSessions: number;
                                averageScore: number | null;
                            };
                            skills: {
                                mappedCount: number;
                            };
                            ai: {
                                chatMessages: number;
                                chatSessions: number;
                            };
                            gamification: {
                                level: number;
                                xp: number;
                                achievements: number;
                                streak: number;
                            };
                            automation: {
                                totalRuns: number;
                                successfulRuns: number;
                                successRate: number;
                                todayRuns: number;
                                recentRuns: {
                                    id: string;
                                    type: string;
                                    status: string;
                                    createdAt: string;
                                }[];
                            };
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
                            days: {
                                date: string;
                                actions: number;
                                xpEarned: number;
                            }[];
                            topCategory: string;
                            totalXP: number;
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
                            skillCoverage: number;
                            applicationSuccessRate: number;
                            interviewTrend: number[];
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
                            };
                            204: void;
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            422: {
                                error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                            };
                            429: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
                            status: "cancelled" | "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, unknown> | null;
                            output: Record<string, unknown> | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: string;
                                message: string;
                                source: string;
                                details?: Record<string, unknown> | undefined;
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
                        };
                        400: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        404: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        409: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        422: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
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
                                status: "cancelled" | "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, unknown> | null;
                                output: Record<string, unknown> | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: string;
                                    message: string;
                                    source: string;
                                    details?: Record<string, unknown> | undefined;
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
                            };
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            409: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            422: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            429: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
                            };
                            500: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
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
                        };
                        400: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        404: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        409: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        422: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
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
                                status: "cancelled" | "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, unknown> | null;
                                output: Record<string, unknown> | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: string;
                                    message: string;
                                    source: string;
                                    details?: Record<string, unknown> | undefined;
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
                            };
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            409: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            422: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            429: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
                            };
                            500: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
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
                            status: "cancelled" | "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, unknown> | null;
                            output: Record<string, unknown> | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: string;
                                message: string;
                                source: string;
                                details?: Record<string, unknown> | undefined;
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
                        };
                        400: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        404: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        409: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        422: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
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
                                status: "cancelled" | "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, unknown> | null;
                                output: Record<string, unknown> | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: string;
                                    message: string;
                                    source: string;
                                    details?: Record<string, unknown> | undefined;
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
                            };
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            409: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            422: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            429: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
                            };
                            500: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
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
                        200: {
                            generatedAt: string;
                            summary: {
                                total: number;
                                configured: number;
                                manualRunAvailable: number;
                                scheduledRunAvailable: number;
                                runHistoryAvailable: number;
                                liveUpdatesAvailable: number;
                            };
                            capabilities: {
                                id: string;
                                category: "job_apply" | "scrape";
                                name: string;
                                target: "jobs_gamesjobsdirect" | "jobs_grackle" | "jobs_hitmarker" | "jobs_pocketgamer" | "jobs_remotegamejobs" | "jobs_workwithindies" | "studios" | null;
                                implemented: boolean;
                                configured: boolean;
                                enabled: boolean;
                                manualRunAvailable: boolean;
                                scheduledRunAvailable: boolean;
                                runHistoryAvailable: boolean;
                                liveUpdatesAvailable: boolean;
                                issues: {
                                    code: "chromium_executable_missing" | "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable";
                                    portalId?: string | undefined;
                                    portalName?: string | undefined;
                                    remediation?: string | undefined;
                                }[];
                            }[];
                        };
                        422: {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
                        };
                        500: {
                            error: {
                                code: string;
                                message: string;
                                details?: Record<string, unknown> | undefined;
                            };
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
                        status?: "cancelled" | "error" | "pending" | "running" | "success" | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            type: "email" | "job_apply" | "scrape";
                            status: "cancelled" | "error" | "pending" | "running" | "success";
                            jobId: string | null;
                            userId: string | null;
                            input: Record<string, unknown> | null;
                            output: Record<string, unknown> | null;
                            screenshots: string[] | null;
                            error: string | {
                                code: string;
                                message: string;
                                source: string;
                                details?: Record<string, unknown> | undefined;
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
                        }[];
                        422: {
                            error: import("@bao/shared/schemas/error-envelope.schema").ErrorEnvelope;
                        } & {
                            type: 'validation';
                            title: 'Validation Error';
                            status: 422;
                            detail?: string;
                            on: string;
                            found?: unknown;
                            property?: string;
                            expected?: string;
                        };
                        429: {
                            error: string;
                            code?: string | undefined;
                            details?: string | undefined;
                            fields?: string[] | undefined;
                            id?: string | undefined;
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
                                status: "cancelled" | "error" | "pending" | "running" | "success";
                                jobId: string | null;
                                userId: string | null;
                                input: Record<string, unknown> | null;
                                output: Record<string, unknown> | null;
                                screenshots: string[] | null;
                                error: string | {
                                    code: string;
                                    message: string;
                                    source: string;
                                    details?: Record<string, unknown> | undefined;
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
                            };
                            400: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            404: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            409: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            422: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
                            };
                            429: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
                            };
                            500: {
                                error: {
                                    code: string;
                                    message: string;
                                    details?: Record<string, unknown> | undefined;
                                };
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
                            200: unknown;
                            400: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
                            };
                            404: {
                                error: string;
                                code?: string | undefined;
                                details?: string | undefined;
                                fields?: string[] | undefined;
                                id?: string | undefined;
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
