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
        user: {
            profile: {
                put: {
                    body: {
                        email?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        name?: string | undefined;
                        phone?: string | undefined;
                        github?: string | undefined;
                        summary?: string | undefined;
                        gamingExperience?: {} | undefined;
                        softSkills?: string[] | undefined;
                        linkedin?: string | undefined;
                        currentRole?: string | undefined;
                        currentCompany?: string | undefined;
                        yearsExperience?: number | undefined;
                        technicalSkills?: string[] | undefined;
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
                    theme?: "bao-light" | "bao-dark" | undefined;
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
                                format: "mp3" | "wav";
                                provider: "openai" | "huggingface" | "local" | "browser" | "custom";
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
                                company: string;
                                enabled: boolean;
                                board: string;
                            }[];
                            leverApiBaseUrl: string;
                            leverMaxPages: number;
                            leverCompanies: {
                                company: string;
                                enabled: boolean;
                                slug: string;
                            }[];
                            companyBoards: {
                                type: "greenhouse" | "lever" | "recruitee" | "workable" | "ashby" | "smartrecruiters" | "teamtailor" | "workday";
                                name: string;
                                token: string;
                                enabled: boolean;
                                priority: number;
                            }[];
                            gamingPortals: {
                                id: "gamedev-net" | "grackle" | "workwithindies" | "remotegamejobs" | "gamesjobsdirect" | "pocketgamer";
                                source: string;
                                name: string;
                                enabled: boolean;
                                fallbackUrl: string;
                            }[];
                        } | undefined;
                    } | undefined;
                    preferredProvider?: "gemini" | "claude" | "openai" | "huggingface" | "local" | undefined;
                    preferredModel?: string | undefined;
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
                        key: string;
                        provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
                        gamification: string | number | boolean | never[] | {
                            [x: string]: never;
                        } | null;
                        applications: (string | number | boolean | never[] | {
                            [x: string]: never;
                        } | null)[];
                        resumes: (string | number | boolean | never[] | {
                            [x: string]: never;
                        } | null)[];
                        settings: string | number | boolean | never[] | {
                            [x: string]: never;
                        } | null;
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
                    location?: string | undefined;
                    experienceLevel?: string | undefined;
                    remote?: string | undefined;
                    limit?: string | undefined;
                    page?: string | undefined;
                    studioType?: string | undefined;
                    platform?: string | undefined;
                    q?: string | undefined;
                    genre?: string | undefined;
                };
                headers: unknown;
                response: {
                    200: {
                        jobs: {
                            id: string;
                            source: string | null;
                            type: string | null;
                            title: string;
                            description: string | null;
                            company: string;
                            location: string;
                            requirements: string[] | null;
                            technologies: string[] | null;
                            postedDate: string | null;
                            url: string | null;
                            experienceLevel: string | null;
                            remote: boolean | null;
                            hybrid: boolean | null;
                            gameGenres: string[] | null;
                            platforms: string[] | null;
                            tags: string[] | null;
                            createdAt: string;
                            updatedAt: string;
                            salary: Record<string, unknown> | null;
                            studioType: string | null;
                            contentHash: string | null;
                            companyLogo: string | null;
                            applicationUrl: string | null;
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
                            recommendations: ({
                                id: string;
                                source: string | null;
                                type: string | null;
                                title: string;
                                description: string | null;
                                company: string;
                                location: string;
                                requirements: string[] | null;
                                technologies: string[] | null;
                                postedDate: string | null;
                                url: string | null;
                                experienceLevel: string | null;
                                remote: boolean | null;
                                hybrid: boolean | null;
                                gameGenres: string[] | null;
                                platforms: string[] | null;
                                tags: string[] | null;
                                createdAt: string;
                                updatedAt: string;
                                salary: Record<string, unknown> | null;
                                studioType: string | null;
                                contentHash: string | null;
                                companyLogo: string | null;
                                applicationUrl: string | null;
                            } & {
                                matchScore: number;
                                matchReason: string;
                                rank: number;
                            })[];
                            reason: string;
                            aiPowered: boolean;
                            provider?: string;
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
        };
    } & {
        resumes: {
            "from-questions": {
                synthesize: {
                    post: {
                        body: {
                            questionsAndAnswers: {
                                id: string;
                                category: string;
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
                    projects?: {
                        link?: string | undefined;
                        technologies?: string[] | undefined;
                        title: string;
                        description: string;
                    }[] | undefined;
                    name?: string | undefined;
                    personalInfo?: {
                        portfolio?: string | undefined;
                        email?: string | undefined;
                        location?: string | undefined;
                        website?: string | undefined;
                        name?: string | undefined;
                        phone?: string | undefined;
                        linkedIn?: string | undefined;
                        github?: string | undefined;
                    } | undefined;
                    summary?: string | undefined;
                    experience?: {
                        description?: string | undefined;
                        location?: string | undefined;
                        technologies?: string[] | undefined;
                        endDate?: string | undefined;
                        achievements?: string[] | undefined;
                        title: string;
                        company: string;
                        startDate: string;
                    }[] | undefined;
                    education?: {
                        gpa?: string | undefined;
                        degree: string;
                        field: string;
                        school: string;
                        year: string;
                    }[] | undefined;
                    gamingExperience?: {
                        platforms?: string | undefined;
                        gameEngines?: string | undefined;
                        genres?: string | undefined;
                        shippedTitles?: string | undefined;
                    } | undefined;
                    template?: string | undefined;
                    theme?: "light" | "dark" | undefined;
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
                        projects?: {
                            link?: string | undefined;
                            technologies?: string[] | undefined;
                            title: string;
                            description: string;
                        }[] | undefined;
                        name?: string | undefined;
                        personalInfo?: {
                            portfolio?: string | undefined;
                            email?: string | undefined;
                            location?: string | undefined;
                            website?: string | undefined;
                            name?: string | undefined;
                            phone?: string | undefined;
                            linkedIn?: string | undefined;
                            github?: string | undefined;
                        } | undefined;
                        summary?: string | undefined;
                        experience?: {
                            description?: string | undefined;
                            location?: string | undefined;
                            technologies?: string[] | undefined;
                            endDate?: string | undefined;
                            achievements?: string[] | undefined;
                            title: string;
                            company: string;
                            startDate: string;
                        }[] | undefined;
                        education?: {
                            gpa?: string | undefined;
                            degree: string;
                            field: string;
                            school: string;
                            year: string;
                        }[] | undefined;
                        gamingExperience?: {
                            platforms?: string | undefined;
                            gameEngines?: string | undefined;
                            genres?: string | undefined;
                            shippedTitles?: string | undefined;
                        } | undefined;
                        template?: string | undefined;
                        theme?: "light" | "dark" | undefined;
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
                                resume: import("@bao/shared").ResumeData;
                                suggestions: import("@bao/shared").JsonArray;
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
                    content?: {} | undefined;
                    jobInfo?: {} | undefined;
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
                        content?: {} | undefined;
                        position?: string | undefined;
                        jobInfo?: {} | undefined;
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
                        technologies?: string[] | undefined;
                        platforms?: string[] | undefined;
                        featured?: boolean | undefined;
                        image?: string | undefined;
                        liveUrl?: string | undefined;
                        githubUrl?: string | undefined;
                        tags?: string[] | undefined;
                        role?: string | undefined;
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
                            title?: string | undefined;
                            description?: string | undefined;
                            technologies?: string[] | undefined;
                            platforms?: string[] | undefined;
                            featured?: boolean | undefined;
                            image?: string | undefined;
                            liveUrl?: string | undefined;
                            githubUrl?: string | undefined;
                            tags?: string[] | undefined;
                            role?: string | undefined;
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
        interview: {
            sessions: {
                post: {
                    body: {
                        studioId?: string | undefined;
                        config?: {
                            technologies?: string[] | undefined;
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
                            interviewMode?: "job" | "studio" | undefined;
                            targetJob?: {
                                source?: string | undefined;
                                description?: string | undefined;
                                requirements?: string[] | undefined;
                                technologies?: string[] | undefined;
                                postedDate?: string | undefined;
                                url?: string | undefined;
                                id: string;
                                title: string;
                                company: string;
                                location: string;
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
                    type?: string | undefined;
                    description?: string | undefined;
                    location?: string | undefined;
                    technologies?: string[] | undefined;
                    platforms?: string[] | undefined;
                    website?: string | undefined;
                    genres?: string[] | undefined;
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
                        remoteWork: boolean | undefined;
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
                        type?: string | undefined;
                        description?: string | undefined;
                        location?: string | undefined;
                        technologies?: string[] | undefined;
                        platforms?: string[] | undefined;
                        website?: string | undefined;
                        name?: string | undefined;
                        genres?: string[] | undefined;
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
                                id: string;
                                type: string;
                            } | undefined;
                            source: string;
                            route: {
                                name?: string | undefined;
                                path: string;
                                params: {
                                    [x: string]: string;
                                };
                                query: {
                                    [x: string]: string;
                                };
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
                            sessionId: string | null | undefined;
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
                                keywords: string[];
                            };
                            provider: "gemini" | "claude" | "openai" | "huggingface" | "local";
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
                            matches: Array<{
                                jobId: string;
                                title: string;
                                company: string;
                                location: string | null;
                                remote: boolean;
                                score: number;
                                strengths: string[];
                                concerns: string[];
                                highlightSkills: string[];
                            }>;
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
                                health: "unconfigured";
                            }[];
                            error: string;
                            preferredProvider?: undefined;
                            configuredProviders?: undefined;
                        } | {
                            providers: {
                                id: "gemini" | "claude" | "openai" | "huggingface" | "local";
                                name: string;
                                models: string[];
                                available: boolean;
                                health: "healthy" | "degraded" | "down" | "unconfigured";
                            }[];
                            preferredProvider: "gemini" | "claude" | "openai" | "huggingface" | "local";
                            configuredProviders: ("gemini" | "claude" | "openai" | "huggingface" | "local")[];
                            error?: undefined;
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
                        action: string;
                        jobUrl: string;
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
                            days: {
                                date: string;
                                actions: number;
                                xpEarned: number;
                            }[];
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
        skills: {
            mappings: {
                post: {
                    body: {
                        confidence?: number | undefined;
                        category?: string | undefined;
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
                            confidence?: number | undefined;
                            category?: string | undefined;
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
        search: {
            get: {
                body: unknown;
                params: {};
                query: {
                    types?: string | undefined;
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
                            id: string;
                            aborted: boolean;
                            error: string | {
                                details?: {} | undefined;
                                source: string;
                                message: string;
                                code: string;
                            } | null;
                            progress: number | null;
                            input: {
                                [x: string]: unknown;
                            } | null;
                            output: {
                                [x: string]: unknown;
                            } | null;
                            type: "scrape" | "job_apply" | "email";
                            createdAt: string;
                            updatedAt: string;
                            status: "success" | "pending" | "running" | "error";
                            screenshots: string[] | null;
                            totalSteps: number | null;
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
                        };
                        500: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        400: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        404: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        409: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        422: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
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
                                id: string;
                                aborted: boolean;
                                error: string | {
                                    details?: {} | undefined;
                                    source: string;
                                    message: string;
                                    code: string;
                                } | null;
                                progress: number | null;
                                input: {
                                    [x: string]: unknown;
                                } | null;
                                output: {
                                    [x: string]: unknown;
                                } | null;
                                type: "scrape" | "job_apply" | "email";
                                createdAt: string;
                                updatedAt: string;
                                status: "success" | "pending" | "running" | "error";
                                screenshots: string[] | null;
                                totalSteps: number | null;
                                jobId: string | null;
                                userId: string | null;
                                currentStep: number | null;
                                startedAt: string | null;
                                completedAt: string | null;
                                exitCode: number | null;
                                timedOut: boolean;
                                executionMs: number | null;
                            };
                            500: {
                                error: {
                                    details?: {} | undefined;
                                    message: string;
                                    code: string;
                                };
                            };
                            400: {
                                error: {
                                    details?: {} | undefined;
                                    message: string;
                                    code: string;
                                };
                            };
                            404: {
                                error: {
                                    details?: {} | undefined;
                                    message: string;
                                    code: string;
                                };
                            };
                            409: {
                                error: {
                                    details?: {} | undefined;
                                    message: string;
                                    code: string;
                                };
                            };
                            422: {
                                error: {
                                    details?: {} | undefined;
                                    message: string;
                                    code: string;
                                };
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
                            status: "success";
                            runId: string;
                            provider: string;
                            model: string;
                            reply: string;
                        };
                        500: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        400: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        404: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        409: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
                        };
                        422: {
                            error: {
                                details?: {} | undefined;
                                message: string;
                                code: string;
                            };
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
                        type?: "scrape" | "job_apply" | "email" | undefined;
                        status?: "success" | "pending" | "running" | "error" | undefined;
                    };
                    headers: unknown;
                    response: {
                        200: {
                            id: string;
                            aborted: boolean;
                            error: string | {
                                details?: {} | undefined;
                                source: string;
                                message: string;
                                code: string;
                            } | null;
                            progress: number | null;
                            input: {
                                [x: string]: unknown;
                            } | null;
                            output: {
                                [x: string]: unknown;
                            } | null;
                            type: "scrape" | "job_apply" | "email";
                            createdAt: string;
                            updatedAt: string;
                            status: "success" | "pending" | "running" | "error";
                            screenshots: string[] | null;
                            totalSteps: number | null;
                            jobId: string | null;
                            userId: string | null;
                            currentStep: number | null;
                            startedAt: string | null;
                            completedAt: string | null;
                            exitCode: number | null;
                            timedOut: boolean;
                            executionMs: number | null;
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
                                id: string;
                                aborted: boolean;
                                error: string | {
                                    details?: {} | undefined;
                                    source: string;
                                    message: string;
                                    code: string;
                                } | null;
                                progress: number | null;
                                input: {
                                    [x: string]: unknown;
                                } | null;
                                output: {
                                    [x: string]: unknown;
                                } | null;
                                type: "scrape" | "job_apply" | "email";
                                createdAt: string;
                                updatedAt: string;
                                status: "success" | "pending" | "running" | "error";
                                screenshots: string[] | null;
                                totalSteps: number | null;
                                jobId: string | null;
                                userId: string | null;
                                currentStep: number | null;
                                startedAt: string | null;
                                completedAt: string | null;
                                exitCode: number | null;
                                timedOut: boolean;
                                executionMs: number | null;
                            };
                            400: {
                                error: {
                                    details?: {} | undefined;
                                    message: string;
                                    code: string;
                                };
                            };
                            404: {
                                error: {
                                    details?: {} | undefined;
                                    message: string;
                                    code: string;
                                };
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
                    type: "subscribe" | "unsubscribe";
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
                    sessionId?: string | undefined;
                    studioId?: string | undefined;
                    config?: {} | undefined;
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
