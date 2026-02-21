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
        readonly HealthResponse: import("@sinclair/typebox").TObject<{
            status: import("@sinclair/typebox").TString;
            timestamp: import("@sinclair/typebox").TString;
            database: import("@sinclair/typebox").TString;
            uptime: import("@sinclair/typebox").TNumber;
        }>;
        readonly ErrorResponse: import("@sinclair/typebox").TObject<{
            error: import("@sinclair/typebox").TString;
            code: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            fields: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TUnknown>>;
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
                        timestamp: string;
                        status: string;
                        database: string;
                        uptime: number;
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
    api: {
        auth: {
            status: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            configured: boolean;
                            authRequired: boolean;
                        } | {
                            authRequired: boolean;
                            configured?: undefined;
                        };
                    };
                };
            };
        };
    } & {
        auth: {
            configured: {
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
        auth: {
            init: {
                post: {
                    body: unknown;
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
                    };
                };
            };
        };
    };
} & {
    api: {
        user: {
            profile: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            name: string;
                            technicalSkills: never[];
                            softSkills: never[];
                            gamingExperience: {};
                            careerGoals: {};
                        } | {
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
                    };
                };
            };
        };
    } & {
        user: {
            profile: {
                put: {
                    body: {
                        website?: string | undefined;
                        name?: string | undefined;
                        email?: string | undefined;
                        phone?: string | undefined;
                        location?: string | undefined;
                        github?: string | undefined;
                        linkedin?: string | undefined;
                        summary?: string | undefined;
                        currentRole?: string | undefined;
                        currentCompany?: string | undefined;
                        yearsExperience?: number | undefined;
                        technicalSkills?: string[] | undefined;
                        softSkills?: string[] | undefined;
                        gamingExperience?: {} | undefined;
                        careerGoals?: {} | undefined;
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
                        automationSettings: import("@bao/shared").AutomationSettings | null;
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
                        defaultBrowser?: "chrome" | "chromium" | "edge" | undefined;
                        enableSmartSelectors?: boolean | undefined;
                        autoSaveScreenshots?: boolean | undefined;
                        speech?: {
                            locale: string;
                            stt: {
                                provider: "openai" | "huggingface" | "local" | "custom" | "browser";
                                model: string;
                                endpoint: string;
                            };
                            tts: {
                                format: "mp3" | "wav";
                                provider: "openai" | "huggingface" | "local" | "custom" | "browser";
                                model: string;
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
                                source: string;
                                name: string;
                                id: "gamedev-net" | "grackle" | "workwithindies" | "remotegamejobs" | "gamesjobsdirect" | "pocketgamer";
                                enabled: boolean;
                                fallbackUrl: string;
                            }[];
                        } | undefined;
                    } | undefined;
                    preferredProvider?: "gemini" | "claude" | "openai" | "huggingface" | "local" | undefined;
                    preferredModel?: string | undefined;
                    theme?: "bao-light" | "bao-dark" | undefined;
                    language?: "en-US" | "es-ES" | "fr-FR" | "ja-JP" | undefined;
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
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                        key: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            valid: boolean;
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            error: string;
                        } | {
                            valid: boolean;
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
                        200: import("./services/data-service").BaoExportData;
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
                        200: import("./services/data-service").ImportResult;
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
        jobs: {
            get: {
                body: unknown;
                params: {};
                query: {
                    remote?: string | undefined;
                    location?: string | undefined;
                    experienceLevel?: string | undefined;
                    limit?: string | undefined;
                    page?: string | undefined;
                    studioType?: string | undefined;
                    q?: string | undefined;
                    platform?: string | undefined;
                    genre?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        jobs: {
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
                            createdAt: string;
                            updatedAt: string;
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
        jobs: {
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
        jobs: {
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
        jobs: {
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
        jobs: {
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
                                createdAt: string;
                                updatedAt: string;
                            } | null;
                        }[];
                    };
                };
            };
        };
    } & {
        jobs: {
            apply: {
                post: {
                    body: {
                        notes?: string | undefined;
                        jobId: string;
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
        jobs: {
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
        jobs: {
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
                                createdAt: string;
                                updatedAt: string;
                            } | null;
                        }[];
                    };
                };
            };
        };
    } & {
        jobs: {
            recommendations: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            recommendations: {
                                rank: number;
                                matchScore: number;
                                matchReason: string;
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
                                createdAt: string;
                                updatedAt: string;
                            }[];
                            reason: string;
                            aiPowered: boolean;
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                        } | {
                            recommendations: {
                                matchScore: number;
                                matchReason: string;
                                rank: number;
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
                                createdAt: string;
                                updatedAt: string;
                            }[];
                            reason: string;
                            aiPowered: boolean;
                        };
                    };
                };
            };
        };
    } & {
        jobs: {
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
                        } | {
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
        resumes: {
            "from-questions": {
                generate: {
                    post: {
                        body: {
                            experienceLevel?: string | undefined;
                            studioName?: string | undefined;
                            targetRole: string;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                questions: import("./services/cv-questionnaire-service").CvQuestion[];
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
        resumes: {
            "from-questions": {
                synthesize: {
                    post: {
                        body: {
                            questionsAndAnswers: {
                                category: string;
                                id: string;
                                question: string;
                                answer: string;
                            }[];
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared").ResumeData | {
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
        resumes: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").ResumeData[];
                };
            };
        };
    } & {
        resumes: {
            post: {
                body: {
                    skills?: {
                        gaming?: string[] | undefined;
                        technical?: string[] | undefined;
                        soft?: string[] | undefined;
                    } | undefined;
                    education?: {
                        gpa?: string | undefined;
                        degree: string;
                        field: string;
                        school: string;
                        year: string;
                    }[] | undefined;
                    name?: string | undefined;
                    summary?: string | undefined;
                    gamingExperience?: {
                        gameEngines?: string | undefined;
                        platforms?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    } | undefined;
                    theme?: "light" | "dark" | undefined;
                    projects?: {
                        technologies?: string[] | undefined;
                        link?: string | undefined;
                        title: string;
                        description: string;
                    }[] | undefined;
                    personalInfo?: {
                        portfolio?: string | undefined;
                        website?: string | undefined;
                        name?: string | undefined;
                        email?: string | undefined;
                        phone?: string | undefined;
                        location?: string | undefined;
                        linkedIn?: string | undefined;
                        github?: string | undefined;
                    } | undefined;
                    experience?: {
                        location?: string | undefined;
                        achievements?: string[] | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        endDate?: string | undefined;
                        company: string;
                        title: string;
                        startDate: string;
                    }[] | undefined;
                    template?: string | undefined;
                    isDefault?: boolean | undefined;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").ResumeData;
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
        resumes: {
            ":id": {
                get: {
                    body: unknown;
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").ResumeData | {
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
        resumes: {
            ":id": {
                put: {
                    body: {
                        skills?: {
                            gaming?: string[] | undefined;
                            technical?: string[] | undefined;
                            soft?: string[] | undefined;
                        } | undefined;
                        education?: {
                            gpa?: string | undefined;
                            degree: string;
                            field: string;
                            school: string;
                            year: string;
                        }[] | undefined;
                        name?: string | undefined;
                        summary?: string | undefined;
                        gamingExperience?: {
                            gameEngines?: string | undefined;
                            platforms?: string | undefined;
                            genres?: string | undefined;
                            shippedTitles?: string | undefined;
                        } | undefined;
                        theme?: "light" | "dark" | undefined;
                        projects?: {
                            technologies?: string[] | undefined;
                            link?: string | undefined;
                            title: string;
                            description: string;
                        }[] | undefined;
                        personalInfo?: {
                            portfolio?: string | undefined;
                            website?: string | undefined;
                            name?: string | undefined;
                            email?: string | undefined;
                            phone?: string | undefined;
                            location?: string | undefined;
                            linkedIn?: string | undefined;
                            github?: string | undefined;
                        } | undefined;
                        experience?: {
                            location?: string | undefined;
                            achievements?: string[] | undefined;
                            description?: string | undefined;
                            technologies?: string[] | undefined;
                            endDate?: string | undefined;
                            company: string;
                            title: string;
                            startDate: string;
                        }[] | undefined;
                        template?: string | undefined;
                        isDefault?: boolean | undefined;
                    };
                    params: {
                        id: string;
                    };
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").ResumeData | {
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
        resumes: {
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
        resumes: {
            ":id": {
                export: {
                    post: {
                        body: {
                            format?: string | undefined;
                            template?: string | undefined;
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
        resumes: {
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
                                resume: import("@bao/shared").ResumeData;
                                suggestions: import("@bao/shared").JsonArray;
                                section: string;
                                error?: undefined;
                                details?: undefined;
                            } | {
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
    } & {
        resumes: {
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
                                error?: undefined;
                                details?: undefined;
                            } | {
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
        "cover-letters": {
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
        "cover-letters": {
            post: {
                body: {
                    template?: string | undefined;
                    jobInfo?: {} | undefined;
                    content?: {} | undefined;
                    company: string;
                    position: string;
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: {
                        id: string;
                        company: string;
                        position: string;
                        jobInfo: {};
                        content: {};
                        template: "creative" | "gaming" | "executive" | "technical" | "professional";
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
        "cover-letters": {
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
        "cover-letters": {
            ":id": {
                put: {
                    body: {
                        company?: string | undefined;
                        template?: string | undefined;
                        position?: string | undefined;
                        jobInfo?: {} | undefined;
                        content?: {} | undefined;
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
        "cover-letters": {
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
        "cover-letters": {
            generate: {
                post: {
                    body: {
                        resumeId?: string | undefined;
                        template?: string | undefined;
                        jobInfo?: {} | undefined;
                        save?: boolean | undefined;
                        company: string;
                        position: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            coverLetter: {
                                id: string;
                                company: string;
                                position: string;
                                jobInfo: {};
                                content: {
                                    introduction: string;
                                    body: string;
                                    conclusion: string;
                                };
                                template: "creative" | "gaming" | "executive" | "technical" | "professional";
                            };
                            error?: undefined;
                            details?: undefined;
                            content?: undefined;
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
    } & {
        "cover-letters": {
            ":id": {
                export: {
                    post: {
                        body: unknown;
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
        portfolio: {
            get: {
                body: unknown;
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").PortfolioData;
                };
            };
        };
    } & {
        portfolio: {
            put: {
                body: {
                    metadata: {
                        [x: string]: unknown;
                    };
                };
                params: {};
                query: unknown;
                headers: unknown;
                response: {
                    200: import("@bao/shared").PortfolioData;
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
        portfolio: {
            projects: {
                post: {
                    body: {
                        image?: string | undefined;
                        platforms?: string[] | undefined;
                        role?: string | undefined;
                        technologies?: string[] | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        tags?: string[] | undefined;
                        featured?: boolean | undefined;
                        engines?: string[] | undefined;
                        sortOrder?: number | undefined;
                        title: string;
                        description: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").PortfolioProject | {
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
        portfolio: {
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
                            200: import("@bao/shared").PortfolioData | {
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
        portfolio: {
            projects: {
                ":id": {
                    put: {
                        body: {
                            image?: string | undefined;
                            platforms?: string[] | undefined;
                            role?: string | undefined;
                            title?: string | undefined;
                            description?: string | undefined;
                            technologies?: string[] | undefined;
                            liveUrl?: string | undefined;
                            githubUrl?: string | undefined;
                            tags?: string[] | undefined;
                            featured?: boolean | undefined;
                            engines?: string[] | undefined;
                            sortOrder?: number | undefined;
                        };
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared").PortfolioProject | {
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
        portfolio: {
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
        portfolio: {
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
} & {
    api: {
        interview: {
            sessions: {
                post: {
                    body: {
                        studioId?: string | undefined;
                        config?: {
                            experienceLevel?: string | undefined;
                            technologies?: string[] | undefined;
                            duration?: number | undefined;
                            roleType?: string | undefined;
                            roleCategory?: string | undefined;
                            focusAreas?: string[] | undefined;
                            questionCount?: number | undefined;
                            includeTechnical?: boolean | undefined;
                            includeBehavioral?: boolean | undefined;
                            includeStudioSpecific?: boolean | undefined;
                            enableVoiceMode?: boolean | undefined;
                            interviewMode?: "job" | "studio" | undefined;
                            targetJob?: {
                                source?: string | undefined;
                                url?: string | undefined;
                                description?: string | undefined;
                                technologies?: string[] | undefined;
                                requirements?: string[] | undefined;
                                postedDate?: string | undefined;
                                location: string;
                                id: string;
                                company: string;
                                title: string;
                            } | undefined;
                            voiceSettings?: {
                                language?: string | undefined;
                                microphoneId?: string | undefined;
                                speakerId?: string | undefined;
                                voiceId?: string | undefined;
                                rate?: number | undefined;
                                pitch?: number | undefined;
                                volume?: number | undefined;
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
        interview: {
            sessions: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            [x: string]: unknown;
                        }[];
                    };
                };
            };
        };
    } & {
        interview: {
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
                            200: {
                                [x: string]: unknown;
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
        interview: {
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
        interview: {
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
        interview: {
            stats: {
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
        studios: {
            get: {
                body: unknown;
                params: {};
                query: {
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
        studios: {
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
        studios: {
            post: {
                body: {
                    website?: string | undefined;
                    location?: string | undefined;
                    type?: string | undefined;
                    platforms?: string[] | undefined;
                    genres?: string[] | undefined;
                    description?: string | undefined;
                    technologies?: string[] | undefined;
                    size?: string | undefined;
                    culture?: {} | undefined;
                    remoteWork?: boolean | undefined;
                    founded?: string | undefined;
                    benefits?: string[] | undefined;
                    socialMedia?: {} | undefined;
                    notableGames?: string[] | undefined;
                    name: string;
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
                        remoteWork: boolean;
                        technologies: string[];
                        genres: string[];
                        platforms: string[];
                        culture: {} | null;
                        benefits: string[];
                        socialMedia: {} | null;
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
        studios: {
            ":id": {
                put: {
                    body: {
                        website?: string | undefined;
                        name?: string | undefined;
                        location?: string | undefined;
                        type?: string | undefined;
                        platforms?: string[] | undefined;
                        genres?: string[] | undefined;
                        description?: string | undefined;
                        technologies?: string[] | undefined;
                        size?: string | undefined;
                        culture?: {} | undefined;
                        remoteWork?: boolean | undefined;
                        founded?: string | undefined;
                        benefits?: string[] | undefined;
                        socialMedia?: {} | undefined;
                        notableGames?: string[] | undefined;
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
        studios: {
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
        studios: {
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
                            topTechnologies: Array<{
                                name: string;
                                count: number;
                            }>;
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        scraper: {
            studios: {
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
                        } | {
                            error: string;
                            details: string;
                        };
                    };
                };
            };
        };
    } & {
        scraper: {
            jobs: {
                gamedev: {
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
                            } | {
                                error: string;
                                details: string;
                            };
                        };
                    };
                };
            };
        };
    };
} & {
    api: {
        ai: {};
    } & {
        ai: {
            chat: {
                post: {
                    body: {
                        sessionId?: string | undefined;
                        context?: {
                            domain?: string | undefined;
                            entity?: {
                                label?: string | undefined;
                                type: string;
                                id: string;
                            } | undefined;
                            source: string;
                            route: {
                                name?: string | undefined;
                                query: {
                                    [x: string]: string;
                                };
                                params: {
                                    [x: string]: string;
                                };
                                path: string;
                            };
                            state: {
                                hasResumes: boolean;
                                hasJobs: boolean;
                                hasStudios: boolean;
                                hasInterviewSessions: boolean;
                                hasPortfolioProjects: boolean;
                            };
                        } | undefined;
                        message: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            sessionId: string;
                            timestamp: string;
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
        ai: {
            "analyze-resume": {
                post: {
                    body: {
                        jobId?: string | undefined;
                        resumeId: string;
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
                            analysis: {
                                score: number;
                                strengths: string[];
                                improvements: string[];
                                keywords: never[];
                            };
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            model: string;
                            error?: undefined;
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
        ai: {
            "generate-cover-letter": {
                post: {
                    body: {
                        jobId?: string | undefined;
                        resumeId: string;
                        company: string;
                        position: string;
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
                            content: {
                                introduction: string;
                                body: string;
                                conclusion: string;
                            };
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            model: string;
                            error?: undefined;
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
        ai: {
            "match-jobs": {
                post: {
                    body: {
                        skills?: string[] | undefined;
                        resumeId?: string | undefined;
                        preferences?: {} | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            matches: ({
                                jobId: string;
                                title: string;
                                company: string;
                                score: number;
                                strengths: never[];
                                concerns: never[];
                                highlightSkills: never[];
                                location?: undefined;
                                remote?: undefined;
                            } | {
                                jobId: string;
                                title: string;
                                company: string;
                                location: string;
                                remote: boolean | null;
                                score: number;
                                strengths: never[];
                                concerns: never[];
                                highlightSkills: never[];
                            } | {
                                jobId: string;
                                title: string;
                                company: string;
                                score: number;
                                strengths: never[];
                                concerns: never[];
                                highlightSkills: never[];
                            })[];
                            recommendations: string[];
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
        ai: {
            models: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            providers: {
                                id: "gemini" | "claude" | "openai" | "huggingface" | "local";
                                name: string;
                                models: string[];
                                available: boolean;
                                health: "healthy" | "degraded" | "down" | "unconfigured";
                            }[];
                            preferredProvider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            configuredProviders: ("gemini" | "claude" | "openai" | "huggingface" | "local")[];
                        } | {
                            providers: {
                                id: "gemini" | "claude" | "openai" | "huggingface" | "local";
                                name: string;
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
        ai: {
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
        ai: {
            "automation-action": {
                post: {
                    body: {
                        jobId?: string | undefined;
                        coverLetterId?: string | undefined;
                        resumeId: string;
                        jobUrl: string;
                        action: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            runId: string;
                            status: string;
                            message: string;
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
    api: {
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
    };
} & {
    api: {
        skills: {};
    } & {
        skills: {
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
        skills: {
            mappings: {
                post: {
                    body: {
                        category?: string | undefined;
                        confidence?: number | undefined;
                        industryApplications?: string[] | undefined;
                        evidence?: {
                            [x: string]: unknown;
                        }[] | undefined;
                        demandLevel?: string | undefined;
                        aiGenerated?: boolean | undefined;
                        gameExpression: string;
                        transferableSkill: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").SkillMapping;
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
        skills: {
            mappings: {
                ":id": {
                    put: {
                        body: {
                            category?: string | undefined;
                            confidence?: number | undefined;
                            gameExpression?: string | undefined;
                            transferableSkill?: string | undefined;
                            industryApplications?: string[] | undefined;
                            evidence?: {
                                [x: string]: unknown;
                            }[] | undefined;
                            demandLevel?: string | undefined;
                            aiGenerated?: boolean | undefined;
                        };
                        params: {
                            id: string;
                        };
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: import("@bao/shared").SkillMapping | {
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
        skills: {
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
                                readonly message: "Skill mapping deleted";
                                readonly id: string;
                            } & ({
                                readonly message: "Skill mapping deleted";
                                readonly id: string;
                            } | {
                                error: string;
                            });
                            410: {
                                readonly error: "Skill mapping already deleted";
                                readonly id: string;
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
        skills: {
            pathways: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").CareerPathway[];
                    };
                };
            };
        };
    } & {
        skills: {
            readiness: {
                get: {
                    body: unknown;
                    params: {};
                    query: {
                        jobId?: string | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").ReadinessAssessment | {
                            jobId: string;
                            overallScore: number;
                            categories: {
                                technical: import("@bao/shared").CategoryAssessment;
                                softSkills: import("@bao/shared").CategoryAssessment;
                                industryKnowledge: import("@bao/shared").CategoryAssessment;
                                portfolio: import("@bao/shared").CategoryAssessment;
                            };
                            improvementSuggestions: string[];
                            nextSteps: string[];
                            targetRoleReadiness?: import("@bao/shared").RoleReadiness[];
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
        skills: {
            "ai-analyze": {
                post: {
                    body: {
                        resume?: {} | undefined;
                        gameExperience?: {} | undefined;
                        autoCreateMappings?: boolean | undefined;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            message: string;
                            detectedSkills: never[];
                            suggestedMappings: never[];
                            recommendations: never[];
                            provider?: undefined;
                        } | {
                            message: string;
                            detectedSkills: string[];
                            suggestedMappings: Record<string, unknown>[];
                            recommendations: string[];
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                        } | {
                            message: string;
                            detectedSkills: never[];
                            suggestedMappings: never[];
                            recommendations: never[];
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
        search: {
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
        search: {
            autocomplete: {
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
        stats: {
            dashboard: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").DashboardStats;
                    };
                };
            };
        };
    } & {
        stats: {
            weekly: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").WeeklyActivity;
                    };
                };
            };
        };
    } & {
        stats: {
            career: {
                get: {
                    body: unknown;
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: import("@bao/shared").CareerProgress;
                    };
                };
            };
        };
    };
} & {
    api: {
        automation: {};
    } & {
        automation: {
            "job-apply": {
                post: {
                    body: {
                        jobId?: string | undefined;
                        customAnswers?: {} | undefined;
                        coverLetterId?: string | undefined;
                        resumeId: string;
                        jobUrl: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            status: "running";
                            runId: string;
                        };
                        500: {
                            error: string;
                        };
                        400: {
                            error: string;
                        };
                        404: {
                            error: string;
                        };
                        409: {
                            error: string;
                        };
                        422: {
                            error: string;
                        };
                    };
                };
            };
        };
    } & {
        automation: {
            "job-apply": {
                schedule: {
                    post: {
                        body: {
                            jobId?: string | undefined;
                            customAnswers?: {} | undefined;
                            coverLetterId?: string | undefined;
                            resumeId: string;
                            jobUrl: string;
                            runAt: string;
                        };
                        params: {};
                        query: unknown;
                        headers: unknown;
                        response: {
                            200: {
                                status: "pending";
                                runId: string;
                                scheduledFor: string;
                            };
                            500: {
                                error: string;
                            };
                            400: {
                                error: string;
                            };
                            404: {
                                error: string;
                            };
                            409: {
                                error: string;
                            };
                            422: {
                                error: string;
                            };
                        };
                    };
                };
            };
        };
    } & {
        automation: {
            "email-response": {
                post: {
                    body: {
                        sender?: string | undefined;
                        tone?: "professional" | "friendly" | "concise" | undefined;
                        message: string;
                        subject: string;
                    };
                    params: {};
                    query: unknown;
                    headers: unknown;
                    response: {
                        200: {
                            provider: string;
                            model: string;
                            status: "success";
                            runId: string;
                            reply: string;
                        };
                        500: {
                            error: string;
                        };
                        400: {
                            error: string;
                        };
                        404: {
                            error: string;
                        };
                        409: {
                            error: string;
                        };
                        422: {
                            error: string;
                        };
                    };
                };
            };
        };
    } & {
        automation: {
            runs: {
                get: {
                    body: unknown;
                    params: {};
                    query: {
                        type?: "email" | "scrape" | "job_apply" | undefined;
                        status?: "success" | "error" | "pending" | "running" | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: {
                            progress: number | null;
                            error: string | null;
                            type: "email" | "scrape" | "job_apply";
                            output: {
                                [x: string]: unknown;
                            } | null;
                            input: {
                                [x: string]: unknown;
                            } | null;
                            id: string;
                            createdAt: string;
                            updatedAt: string;
                            screenshots: string[] | null;
                            jobId: string | null;
                            status: "success" | "error" | "pending" | "running";
                            userId: string | null;
                            currentStep: number | null;
                            totalSteps: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
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
        automation: {
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
                                progress: number | null;
                                error: string | null;
                                type: "email" | "scrape" | "job_apply";
                                output: {
                                    [x: string]: unknown;
                                } | null;
                                input: {
                                    [x: string]: unknown;
                                } | null;
                                id: string;
                                createdAt: string;
                                updatedAt: string;
                                screenshots: string[] | null;
                                jobId: string | null;
                                status: "success" | "error" | "pending" | "running";
                                userId: string | null;
                                currentStep: number | null;
                                totalSteps: number | null;
                                startedAt: string | null;
                                completedAt: string | null;
                            };
                            400: {
                                error: string;
                            };
                            404: {
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
        automation: {
            screenshots: {
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
                                };
                                404: {
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
    };
} & {
    api: {
        [x: string]: {
            subscribe: {
                body: {
                    runId?: string | undefined;
                    type: string;
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
                    sessionId?: string | undefined;
                    content: string;
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
                    studioId?: string | undefined;
                    config?: {} | undefined;
                    sessionId?: string | undefined;
                    type: string;
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
