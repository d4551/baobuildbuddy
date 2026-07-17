export declare const ROUTE_RESPONSE_REGISTRY: {
    readonly ai: {
        readonly chat: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                sessionId: import("typebox").TString;
                timestamp: import("typebox").TString;
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TString;
                followUps: import("typebox").TArray<import("typebox").TString>;
                contextDomain: import("typebox").TString;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly analyzeResume: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                resumeId: import("typebox").TString;
                jobId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                analysis: import("typebox").TObject<{
                    score: import("typebox").TNumber;
                    strengths: import("typebox").TArray<import("typebox").TString>;
                    improvements: import("typebox").TArray<import("typebox").TString>;
                    keywords: import("typebox").TArray<import("typebox").TString>;
                }>;
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TString;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly generateCoverLetter: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                content: import("typebox").TObject<{
                    introduction: import("typebox").TString;
                    body: import("typebox").TString;
                    conclusion: import("typebox").TString;
                }>;
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                model: import("typebox").TString;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly matchJobs: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                matches: import("typebox").TArray<import("typebox").TObject<{
                    jobId: import("typebox").TString;
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                    remote: import("typebox").TBoolean;
                    score: import("typebox").TNumber;
                    strengths: import("typebox").TArray<import("typebox").TString>;
                    concerns: import("typebox").TArray<import("typebox").TString>;
                    highlightSkills: import("typebox").TArray<import("typebox").TString>;
                }>>;
                recommendations: import("typebox").TArray<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly models: {
            readonly 200: import("typebox").TObject<{
                aiRouting: import("typebox").TOptional<import("typebox").TObject<{
                    chat: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    interviewQuestions: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    interviewFeedback: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    resume: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    coverLetter: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    emailResponse: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    jobMatch: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    scrapeEnrichment: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    automationFieldMapping: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                }>>;
                configuredProviders: import("typebox").TOptional<import("typebox").TArray<import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>>>;
                error: import("typebox").TOptional<import("typebox").TString>;
                preferredModel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                preferredProvider: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>>;
                providerDiagnostics: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TObject<{
                    provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                    code: import("typebox").TString;
                    checkedAt: import("typebox").TString;
                    endpoint: import("typebox").TOptional<import("typebox").TString>;
                    selectedModel: import("typebox").TOptional<import("typebox").TString>;
                    availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    message: import("typebox").TOptional<import("typebox").TString>;
                }>>>;
                providers: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                    nameKey: import("typebox").TString;
                    descriptionKey: import("typebox").TString;
                    iconId: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                    models: import("typebox").TArray<import("typebox").TString>;
                    available: import("typebox").TBoolean;
                    health: import("typebox").TUnion<[import("typebox").TLiteral<"healthy">, import("typebox").TLiteral<"degraded">, import("typebox").TLiteral<"down">, import("typebox").TLiteral<"unconfigured">]>;
                    selectedModel: import("typebox").TOptional<import("typebox").TString>;
                    diagnosticCode: import("typebox").TOptional<import("typebox").TString>;
                    availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    error: import("typebox").TOptional<import("typebox").TString>;
                }>>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly usage: {
            readonly 200: import("typebox").TObject<{
                totalMessages: import("typebox").TNumber;
                userMessages: import("typebox").TNumber;
                assistantMessages: import("typebox").TNumber;
                sessions: import("typebox").TNumber;
                recentActivity: import("typebox").TArray<import("typebox").TObject<{
                    timestamp: import("typebox").TString;
                    role: import("typebox").TString;
                    sessionId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                }>>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly automationAction: {
            readonly 200: import("typebox").TObject<{
                runId: import("typebox").TString;
                status: import("typebox").TString;
                message: import("typebox").TString;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
    };
    readonly automation: {
        readonly run: import("typebox").TObject<{
            id: import("typebox").TString;
            type: import("typebox").TUnion<[import("typebox").TLiteral<"scrape">, import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"email">]>;
            status: import("typebox").TUnion<[import("typebox").TLiteral<"pending">, import("typebox").TLiteral<"running">, import("typebox").TLiteral<"success">, import("typebox").TLiteral<"error">]>;
            jobId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            userId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            input: import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>;
            output: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>, import("typebox").TNull]>;
            screenshots: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
            error: import("typebox").TUnion<[import("typebox").TString, import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                source: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>, import("typebox").TNull]>;
            progress: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            currentStep: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            totalSteps: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            startedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            completedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            createdAt: import("typebox").TString;
            updatedAt: import("typebox").TString;
            exitCode: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
            timedOut: import("typebox").TBoolean;
            aborted: import("typebox").TBoolean;
            executionMs: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
        }>;
        readonly capabilities: import("typebox").TObject<{
            generatedAt: import("typebox").TString;
            summary: import("typebox").TObject<{
                total: import("typebox").TNumber;
                configured: import("typebox").TNumber;
                manualRunAvailable: import("typebox").TNumber;
                scheduledRunAvailable: import("typebox").TNumber;
                runHistoryAvailable: import("typebox").TNumber;
                liveUpdatesAvailable: import("typebox").TNumber;
            }>;
            capabilities: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                category: import("typebox").TUnion<[import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"scrape">]>;
                name: import("typebox").TString;
                target: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"jobs_hitmarker">, import("typebox").TLiteral<"jobs_grackle">, import("typebox").TLiteral<"jobs_workwithindies">, import("typebox").TLiteral<"jobs_remotegamejobs">, import("typebox").TLiteral<"jobs_gamesjobsdirect">, import("typebox").TLiteral<"jobs_pocketgamer">]>, import("typebox").TNull]>;
                implemented: import("typebox").TBoolean;
                configured: import("typebox").TBoolean;
                enabled: import("typebox").TBoolean;
                manualRunAvailable: import("typebox").TBoolean;
                scheduledRunAvailable: import("typebox").TBoolean;
                runHistoryAvailable: import("typebox").TBoolean;
                liveUpdatesAvailable: import("typebox").TBoolean;
                issues: import("typebox").TArray<import("typebox").TObject<{
                    code: import("typebox").TUnion<import("typebox").TLiteral<"portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable">[]>;
                    portalId: import("typebox").TOptional<import("typebox").TString>;
                    portalName: import("typebox").TOptional<import("typebox").TString>;
                }>>;
            }>>;
        }>;
        readonly error: import("typebox").TObject<{
            error: import("typebox").TObject<{
                code: import("typebox").TString;
                message: import("typebox").TString;
                details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
            }>;
        }>;
        readonly errors: {};
    };
    readonly auth: {
        readonly status: {
            readonly 200: import("typebox").TObject<{
                configured: import("typebox").TBoolean;
                authRequired: import("typebox").TBoolean;
                bootstrapRequired: import("typebox").TBoolean;
                setupTokenConfigured: import("typebox").TBoolean;
            }>;
        };
        readonly configured: {
            readonly 200: import("typebox").TObject<{
                configured: import("typebox").TBoolean;
            }>;
        };
        readonly init: {
            readonly 200: import("typebox").TObject<{
                configured: import("typebox").TBoolean;
                apiKey: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
    };
    readonly coverLetters: {
        readonly list: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                company: import("typebox").TString;
                position: import("typebox").TString;
                jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>>;
        };
        readonly entity: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                company: import("typebox").TString;
                position: import("typebox").TString;
                jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            201: import("typebox").TObject<{
                id: import("typebox").TString;
                company: import("typebox").TString;
                position: import("typebox").TString;
                jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly delete: {
            200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
                id: import("typebox").TString;
            }>;
        };
        readonly generate: {
            200: import("typebox").TObject<{
                message: import("typebox").TString;
                content: import("typebox").TObject<{
                    introduction: import("typebox").TString;
                    body: import("typebox").TString;
                    conclusion: import("typebox").TString;
                }>;
            }>;
            201: import("typebox").TObject<{
                message: import("typebox").TString;
                coverLetter: import("typebox").TObject<{
                    id: import("typebox").TString;
                    company: import("typebox").TString;
                    position: import("typebox").TString;
                    jobInfo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    content: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    template: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                }>;
            }>;
            503: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly export: {
            200: import("typebox").TUnknown;
        };
    };
    readonly gamification: {
        readonly progress: {
            readonly 200: import("typebox").TObject<{
                xp: import("typebox").TNumber;
                level: import("typebox").TNumber;
                achievements: import("typebox").TArray<import("typebox").TString>;
                dailyChallenges: import("typebox").TRecord<"^.*$", import("typebox").TArray<import("typebox").TString>>;
                longestStreak: import("typebox").TNumber;
                currentStreak: import("typebox").TNumber;
                lastActiveDate: import("typebox").TOptional<import("typebox").TString>;
                stats: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
                xpForNextLevel: import("typebox").TOptional<import("typebox").TNumber>;
                streak: import("typebox").TOptional<import("typebox").TNumber>;
            }>;
        };
        readonly awardXp: {
            readonly 200: import("typebox").TObject<{
                xp: import("typebox").TNumber;
                level: import("typebox").TNumber;
                leveledUp: import("typebox").TBoolean;
                levelUp: import("typebox").TUnion<[import("typebox").TObject<{
                    xpGained: import("typebox").TNumber;
                    oldLevel: import("typebox").TNumber;
                    newLevel: import("typebox").TNumber;
                    oldTitle: import("typebox").TString;
                    newTitle: import("typebox").TString;
                    unlockedFeatures: import("typebox").TArray<import("typebox").TString>;
                    bonusXP: import("typebox").TOptional<import("typebox").TNumber>;
                }>, import("typebox").TNull]>;
                reason: import("typebox").TString;
                message: import("typebox").TString;
            }>;
        };
        readonly achievements: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                description: import("typebox").TString;
                icon: import("typebox").TString;
                iconType: import("typebox").TUnion<[import("typebox").TLiteral<"emoji">, import("typebox").TLiteral<"custom">]>;
                category: import("typebox").TUnion<[import("typebox").TLiteral<"progress">, import("typebox").TLiteral<"social">, import("typebox").TLiteral<"skill">, import("typebox").TLiteral<"special">, import("typebox").TLiteral<"milestone">]>;
                xpReward: import("typebox").TNumber;
                requirements: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
                unlocked: import("typebox").TBoolean;
                unlockedAt: import("typebox").TOptional<import("typebox").TString>;
                rarity: import("typebox").TUnion<[import("typebox").TLiteral<"common">, import("typebox").TLiteral<"rare">, import("typebox").TLiteral<"epic">, import("typebox").TLiteral<"legendary">]>;
                hidden: import("typebox").TOptional<import("typebox").TBoolean>;
            }>>;
        };
        readonly challenges: {
            readonly 200: import("typebox").TObject<{
                date: import("typebox").TString;
                challenges: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    name: import("typebox").TString;
                    description: import("typebox").TString;
                    icon: import("typebox").TString;
                    iconType: import("typebox").TUnion<[import("typebox").TLiteral<"emoji">, import("typebox").TLiteral<"custom">]>;
                    xpReward: import("typebox").TNumber;
                    category: import("typebox").TUnion<[import("typebox").TLiteral<"profile">, import("typebox").TLiteral<"job_search">, import("typebox").TLiteral<"skill_building">, import("typebox").TLiteral<"social">, import("typebox").TLiteral<"engagement">]>;
                    completed: import("typebox").TBoolean;
                    requirements: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TNumber>>;
                    validUntil: import("typebox").TOptional<import("typebox").TString>;
                    progress: import("typebox").TOptional<import("typebox").TNumber>;
                    goal: import("typebox").TOptional<import("typebox").TNumber>;
                }>>;
                completedCount: import("typebox").TNumber;
                totalCount: import("typebox").TNumber;
            }>;
        };
        readonly completeChallenge: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                challengeId: import("typebox").TOptional<import("typebox").TString>;
                completed: import("typebox").TBoolean;
                totalXP: import("typebox").TOptional<import("typebox").TNumber>;
                level: import("typebox").TOptional<import("typebox").TNumber>;
            }>;
            readonly 201: import("typebox").TObject<{
                message: import("typebox").TString;
                challengeId: import("typebox").TOptional<import("typebox").TString>;
                completed: import("typebox").TBoolean;
                totalXP: import("typebox").TOptional<import("typebox").TNumber>;
                level: import("typebox").TOptional<import("typebox").TNumber>;
            }>;
        };
        readonly weeklyProgress: {
            readonly 200: import("typebox").TObject<{
                challengesCompleted: import("typebox").TNumber;
                xpEarned: import("typebox").TNumber;
                actionsCount: import("typebox").TNumber;
                days: import("typebox").TArray<import("typebox").TObject<{
                    date: import("typebox").TString;
                    actions: import("typebox").TNumber;
                    xpEarned: import("typebox").TNumber;
                }>>;
                topCategory: import("typebox").TString;
            }>;
        };
        readonly monthlyStats: {
            readonly 200: import("typebox").TObject<{
                totalXP: import("typebox").TNumber;
                levelsGained: import("typebox").TNumber;
                achievementsUnlocked: import("typebox").TNumber;
                challengesCompleted: import("typebox").TNumber;
                actionsCount: import("typebox").TNumber;
                streakDays: import("typebox").TNumber;
            }>;
        };
    };
    readonly interview: {
        readonly createSession: {
            201: import("typebox").TObject<{
                id: import("typebox").TString;
                studioId: import("typebox").TString;
                config: import("typebox").TObject<{
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
                }>;
                questions: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"behavioral">, import("typebox").TLiteral<"technical">, import("typebox").TLiteral<"studio-specific">, import("typebox").TLiteral<"intro">, import("typebox").TLiteral<"closing">]>;
                    question: import("typebox").TString;
                    followUps: import("typebox").TArray<import("typebox").TString>;
                    expectedDuration: import("typebox").TNumber;
                    difficulty: import("typebox").TUnion<[import("typebox").TLiteral<"easy">, import("typebox").TLiteral<"medium">, import("typebox").TLiteral<"hard">]>;
                    tags: import("typebox").TArray<import("typebox").TString>;
                    score: import("typebox").TOptional<import("typebox").TNumber>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                    response: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                currentQuestionIndex: import("typebox").TNumber;
                totalQuestions: import("typebox").TNumber;
                startTime: import("typebox").TNumber;
                endTime: import("typebox").TOptional<import("typebox").TNumber>;
                status: import("typebox").TUnion<[import("typebox").TLiteral<"preparing">, import("typebox").TLiteral<"active">, import("typebox").TLiteral<"paused">, import("typebox").TLiteral<"completed">, import("typebox").TLiteral<"cancelled">]>;
                responses: import("typebox").TArray<import("typebox").TObject<{
                    questionId: import("typebox").TString;
                    transcript: import("typebox").TString;
                    duration: import("typebox").TNumber;
                    timestamp: import("typebox").TNumber;
                    confidence: import("typebox").TNumber;
                    aiAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedback: import("typebox").TString;
                        strengths: import("typebox").TArray<import("typebox").TString>;
                        improvements: import("typebox").TArray<import("typebox").TString>;
                    }>>;
                }>>;
                finalAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                    overallScore: import("typebox").TNumber;
                    strengths: import("typebox").TArray<import("typebox").TString>;
                    improvements: import("typebox").TArray<import("typebox").TString>;
                    recommendations: import("typebox").TArray<import("typebox").TString>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                interviewerPersona: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TString;
                    role: import("typebox").TString;
                    studioName: import("typebox").TString;
                    background: import("typebox").TString;
                    style: import("typebox").TString;
                    experience: import("typebox").TString;
                }>>;
                role: import("typebox").TOptional<import("typebox").TString>;
                studioName: import("typebox").TOptional<import("typebox").TString>;
                score: import("typebox").TOptional<import("typebox").TNumber>;
                duration: import("typebox").TOptional<import("typebox").TString>;
                overallFeedback: import("typebox").TOptional<import("typebox").TString>;
                totalResponses: import("typebox").TOptional<import("typebox").TNumber>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly listSessions: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                studioId: import("typebox").TString;
                config: import("typebox").TObject<{
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
                }>;
                questions: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"behavioral">, import("typebox").TLiteral<"technical">, import("typebox").TLiteral<"studio-specific">, import("typebox").TLiteral<"intro">, import("typebox").TLiteral<"closing">]>;
                    question: import("typebox").TString;
                    followUps: import("typebox").TArray<import("typebox").TString>;
                    expectedDuration: import("typebox").TNumber;
                    difficulty: import("typebox").TUnion<[import("typebox").TLiteral<"easy">, import("typebox").TLiteral<"medium">, import("typebox").TLiteral<"hard">]>;
                    tags: import("typebox").TArray<import("typebox").TString>;
                    score: import("typebox").TOptional<import("typebox").TNumber>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                    response: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                currentQuestionIndex: import("typebox").TNumber;
                totalQuestions: import("typebox").TNumber;
                startTime: import("typebox").TNumber;
                endTime: import("typebox").TOptional<import("typebox").TNumber>;
                status: import("typebox").TUnion<[import("typebox").TLiteral<"preparing">, import("typebox").TLiteral<"active">, import("typebox").TLiteral<"paused">, import("typebox").TLiteral<"completed">, import("typebox").TLiteral<"cancelled">]>;
                responses: import("typebox").TArray<import("typebox").TObject<{
                    questionId: import("typebox").TString;
                    transcript: import("typebox").TString;
                    duration: import("typebox").TNumber;
                    timestamp: import("typebox").TNumber;
                    confidence: import("typebox").TNumber;
                    aiAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedback: import("typebox").TString;
                        strengths: import("typebox").TArray<import("typebox").TString>;
                        improvements: import("typebox").TArray<import("typebox").TString>;
                    }>>;
                }>>;
                finalAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                    overallScore: import("typebox").TNumber;
                    strengths: import("typebox").TArray<import("typebox").TString>;
                    improvements: import("typebox").TArray<import("typebox").TString>;
                    recommendations: import("typebox").TArray<import("typebox").TString>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                interviewerPersona: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TString;
                    role: import("typebox").TString;
                    studioName: import("typebox").TString;
                    background: import("typebox").TString;
                    style: import("typebox").TString;
                    experience: import("typebox").TString;
                }>>;
                role: import("typebox").TOptional<import("typebox").TString>;
                studioName: import("typebox").TOptional<import("typebox").TString>;
                score: import("typebox").TOptional<import("typebox").TNumber>;
                duration: import("typebox").TOptional<import("typebox").TString>;
                overallFeedback: import("typebox").TOptional<import("typebox").TString>;
                totalResponses: import("typebox").TOptional<import("typebox").TNumber>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
            }>>;
        };
        readonly session: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                studioId: import("typebox").TString;
                config: import("typebox").TObject<{
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
                }>;
                questions: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"behavioral">, import("typebox").TLiteral<"technical">, import("typebox").TLiteral<"studio-specific">, import("typebox").TLiteral<"intro">, import("typebox").TLiteral<"closing">]>;
                    question: import("typebox").TString;
                    followUps: import("typebox").TArray<import("typebox").TString>;
                    expectedDuration: import("typebox").TNumber;
                    difficulty: import("typebox").TUnion<[import("typebox").TLiteral<"easy">, import("typebox").TLiteral<"medium">, import("typebox").TLiteral<"hard">]>;
                    tags: import("typebox").TArray<import("typebox").TString>;
                    score: import("typebox").TOptional<import("typebox").TNumber>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                    response: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                currentQuestionIndex: import("typebox").TNumber;
                totalQuestions: import("typebox").TNumber;
                startTime: import("typebox").TNumber;
                endTime: import("typebox").TOptional<import("typebox").TNumber>;
                status: import("typebox").TUnion<[import("typebox").TLiteral<"preparing">, import("typebox").TLiteral<"active">, import("typebox").TLiteral<"paused">, import("typebox").TLiteral<"completed">, import("typebox").TLiteral<"cancelled">]>;
                responses: import("typebox").TArray<import("typebox").TObject<{
                    questionId: import("typebox").TString;
                    transcript: import("typebox").TString;
                    duration: import("typebox").TNumber;
                    timestamp: import("typebox").TNumber;
                    confidence: import("typebox").TNumber;
                    aiAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedback: import("typebox").TString;
                        strengths: import("typebox").TArray<import("typebox").TString>;
                        improvements: import("typebox").TArray<import("typebox").TString>;
                    }>>;
                }>>;
                finalAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                    overallScore: import("typebox").TNumber;
                    strengths: import("typebox").TArray<import("typebox").TString>;
                    improvements: import("typebox").TArray<import("typebox").TString>;
                    recommendations: import("typebox").TArray<import("typebox").TString>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                interviewerPersona: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TString;
                    role: import("typebox").TString;
                    studioName: import("typebox").TString;
                    background: import("typebox").TString;
                    style: import("typebox").TString;
                    experience: import("typebox").TString;
                }>>;
                role: import("typebox").TOptional<import("typebox").TString>;
                studioName: import("typebox").TOptional<import("typebox").TString>;
                score: import("typebox").TOptional<import("typebox").TNumber>;
                duration: import("typebox").TOptional<import("typebox").TString>;
                overallFeedback: import("typebox").TOptional<import("typebox").TString>;
                totalResponses: import("typebox").TOptional<import("typebox").TNumber>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly submitResponse: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                studioId: import("typebox").TString;
                config: import("typebox").TObject<{
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
                }>;
                questions: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"behavioral">, import("typebox").TLiteral<"technical">, import("typebox").TLiteral<"studio-specific">, import("typebox").TLiteral<"intro">, import("typebox").TLiteral<"closing">]>;
                    question: import("typebox").TString;
                    followUps: import("typebox").TArray<import("typebox").TString>;
                    expectedDuration: import("typebox").TNumber;
                    difficulty: import("typebox").TUnion<[import("typebox").TLiteral<"easy">, import("typebox").TLiteral<"medium">, import("typebox").TLiteral<"hard">]>;
                    tags: import("typebox").TArray<import("typebox").TString>;
                    score: import("typebox").TOptional<import("typebox").TNumber>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                    response: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                currentQuestionIndex: import("typebox").TNumber;
                totalQuestions: import("typebox").TNumber;
                startTime: import("typebox").TNumber;
                endTime: import("typebox").TOptional<import("typebox").TNumber>;
                status: import("typebox").TUnion<[import("typebox").TLiteral<"preparing">, import("typebox").TLiteral<"active">, import("typebox").TLiteral<"paused">, import("typebox").TLiteral<"completed">, import("typebox").TLiteral<"cancelled">]>;
                responses: import("typebox").TArray<import("typebox").TObject<{
                    questionId: import("typebox").TString;
                    transcript: import("typebox").TString;
                    duration: import("typebox").TNumber;
                    timestamp: import("typebox").TNumber;
                    confidence: import("typebox").TNumber;
                    aiAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedback: import("typebox").TString;
                        strengths: import("typebox").TArray<import("typebox").TString>;
                        improvements: import("typebox").TArray<import("typebox").TString>;
                    }>>;
                }>>;
                finalAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                    overallScore: import("typebox").TNumber;
                    strengths: import("typebox").TArray<import("typebox").TString>;
                    improvements: import("typebox").TArray<import("typebox").TString>;
                    recommendations: import("typebox").TArray<import("typebox").TString>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                interviewerPersona: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TString;
                    role: import("typebox").TString;
                    studioName: import("typebox").TString;
                    background: import("typebox").TString;
                    style: import("typebox").TString;
                    experience: import("typebox").TString;
                }>>;
                role: import("typebox").TOptional<import("typebox").TString>;
                studioName: import("typebox").TOptional<import("typebox").TString>;
                score: import("typebox").TOptional<import("typebox").TNumber>;
                duration: import("typebox").TOptional<import("typebox").TString>;
                overallFeedback: import("typebox").TOptional<import("typebox").TString>;
                totalResponses: import("typebox").TOptional<import("typebox").TNumber>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly completeSession: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                studioId: import("typebox").TString;
                config: import("typebox").TObject<{
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
                }>;
                questions: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"behavioral">, import("typebox").TLiteral<"technical">, import("typebox").TLiteral<"studio-specific">, import("typebox").TLiteral<"intro">, import("typebox").TLiteral<"closing">]>;
                    question: import("typebox").TString;
                    followUps: import("typebox").TArray<import("typebox").TString>;
                    expectedDuration: import("typebox").TNumber;
                    difficulty: import("typebox").TUnion<[import("typebox").TLiteral<"easy">, import("typebox").TLiteral<"medium">, import("typebox").TLiteral<"hard">]>;
                    tags: import("typebox").TArray<import("typebox").TString>;
                    score: import("typebox").TOptional<import("typebox").TNumber>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                    response: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                currentQuestionIndex: import("typebox").TNumber;
                totalQuestions: import("typebox").TNumber;
                startTime: import("typebox").TNumber;
                endTime: import("typebox").TOptional<import("typebox").TNumber>;
                status: import("typebox").TUnion<[import("typebox").TLiteral<"preparing">, import("typebox").TLiteral<"active">, import("typebox").TLiteral<"paused">, import("typebox").TLiteral<"completed">, import("typebox").TLiteral<"cancelled">]>;
                responses: import("typebox").TArray<import("typebox").TObject<{
                    questionId: import("typebox").TString;
                    transcript: import("typebox").TString;
                    duration: import("typebox").TNumber;
                    timestamp: import("typebox").TNumber;
                    confidence: import("typebox").TNumber;
                    aiAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedback: import("typebox").TString;
                        strengths: import("typebox").TArray<import("typebox").TString>;
                        improvements: import("typebox").TArray<import("typebox").TString>;
                    }>>;
                }>>;
                finalAnalysis: import("typebox").TOptional<import("typebox").TObject<{
                    overallScore: import("typebox").TNumber;
                    strengths: import("typebox").TArray<import("typebox").TString>;
                    improvements: import("typebox").TArray<import("typebox").TString>;
                    recommendations: import("typebox").TArray<import("typebox").TString>;
                    feedback: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                interviewerPersona: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TString;
                    role: import("typebox").TString;
                    studioName: import("typebox").TString;
                    background: import("typebox").TString;
                    style: import("typebox").TString;
                    experience: import("typebox").TString;
                }>>;
                role: import("typebox").TOptional<import("typebox").TString>;
                studioName: import("typebox").TOptional<import("typebox").TString>;
                score: import("typebox").TOptional<import("typebox").TNumber>;
                duration: import("typebox").TOptional<import("typebox").TString>;
                overallFeedback: import("typebox").TOptional<import("typebox").TString>;
                totalResponses: import("typebox").TOptional<import("typebox").TNumber>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly stats: {
            200: import("typebox").TObject<{
                totalSessions: import("typebox").TNumber;
                completedSessions: import("typebox").TNumber;
                inProgressSessions: import("typebox").TNumber;
                averageQuestions: import("typebox").TNumber;
                averageResponses: import("typebox").TNumber;
                totalInterviews: import("typebox").TNumber;
                completedInterviews: import("typebox").TNumber;
                averageScore: import("typebox").TNumber;
                improvementTrend: import("typebox").TNumber;
            }>;
        };
    };
    readonly jobs: {
        readonly list: {
            readonly 200: import("typebox").TObject<{
                jobs: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    location: import("typebox").TString;
                    remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                    matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                    matchReason: import("typebox").TOptional<import("typebox").TString>;
                    rank: import("typebox").TOptional<import("typebox").TNumber>;
                }>>;
                page: import("typebox").TNumber;
                limit: import("typebox").TNumber;
                total: import("typebox").TNumber;
            }>;
        };
        readonly entity: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                title: import("typebox").TString;
                company: import("typebox").TString;
                location: import("typebox").TString;
                remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
                matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                matchReason: import("typebox").TOptional<import("typebox").TString>;
                rank: import("typebox").TOptional<import("typebox").TNumber>;
            }>;
        };
        readonly save: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TOptional<import("typebox").TString>;
                saved: import("typebox").TOptional<import("typebox").TObject<{
                    id: import("typebox").TString;
                    jobId: import("typebox").TString;
                    savedAt: import("typebox").TString;
                }>>;
                id: import("typebox").TOptional<import("typebox").TString>;
                jobId: import("typebox").TOptional<import("typebox").TString>;
                savedAt: import("typebox").TOptional<import("typebox").TString>;
                error: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 201: import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                savedAt: import("typebox").TString;
            }>;
        };
        readonly deleteSaved: {
            readonly 200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
                deleted: import("typebox").TUnknown;
            }>;
        };
        readonly savedList: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                savedAt: import("typebox").TString;
                job: import("typebox").TUnion<[import("typebox").TObject<{
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    location: import("typebox").TString;
                    remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                    matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                    matchReason: import("typebox").TOptional<import("typebox").TString>;
                    rank: import("typebox").TOptional<import("typebox").TNumber>;
                }>, import("typebox").TNull]>;
            }>>;
        };
        readonly apply: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TOptional<import("typebox").TString>;
                application: import("typebox").TOptional<import("typebox").TObject<{
                    id: import("typebox").TString;
                    jobId: import("typebox").TString;
                    status: import("typebox").TString;
                    appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>, import("typebox").TNull]>>;
                }>>;
                id: import("typebox").TOptional<import("typebox").TString>;
                jobId: import("typebox").TOptional<import("typebox").TString>;
                status: import("typebox").TOptional<import("typebox").TString>;
                appliedDate: import("typebox").TOptional<import("typebox").TString>;
                notes: import("typebox").TOptional<import("typebox").TString>;
                timeline: import("typebox").TOptional<import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>>;
                error: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 201: import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                status: import("typebox").TString;
                appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>, import("typebox").TNull]>>;
            }>;
        };
        readonly updateApplication: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                status: import("typebox").TString;
                appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>, import("typebox").TNull]>>;
            }>;
        };
        readonly applicationsList: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                jobId: import("typebox").TString;
                status: import("typebox").TString;
                appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>, import("typebox").TNull]>>;
            }>>;
        };
        readonly recommendations: {
            readonly 200: import("typebox").TObject<{
                recommendations: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    location: import("typebox").TString;
                    remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                    matchScore: import("typebox").TOptional<import("typebox").TNumber>;
                    matchReason: import("typebox").TOptional<import("typebox").TString>;
                    rank: import("typebox").TOptional<import("typebox").TNumber>;
                }>>;
                reason: import("typebox").TString;
                aiPowered: import("typebox").TBoolean;
                provider: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly refresh: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                status: import("typebox").TString;
                totalJobs: import("typebox").TNumber;
                newJobs: import("typebox").TNumber;
                updatedJobs: import("typebox").TNumber;
            }>;
        };
    };
    readonly portfolio: {
        readonly profile: {
            200: import("typebox").TObject<{
                id: import("typebox").TOptional<import("typebox").TString>;
                metadata: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TOptional<import("typebox").TString>;
                    portfolioId: import("typebox").TOptional<import("typebox").TString>;
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    image: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    liveUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    githubUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    featured: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    role: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    engines: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    sortOrder: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly mutation: {
            200: import("typebox").TObject<{
                id: import("typebox").TOptional<import("typebox").TString>;
                metadata: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TOptional<import("typebox").TString>;
                    portfolioId: import("typebox").TOptional<import("typebox").TString>;
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    image: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    liveUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    githubUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    featured: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    role: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    engines: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    sortOrder: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly projectMutation: {
            200: import("typebox").TObject<{
                id: import("typebox").TOptional<import("typebox").TString>;
                portfolioId: import("typebox").TOptional<import("typebox").TString>;
                title: import("typebox").TString;
                description: import("typebox").TString;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                image: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                liveUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                githubUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                featured: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                role: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                engines: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                sortOrder: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            201: import("typebox").TObject<{
                id: import("typebox").TOptional<import("typebox").TString>;
                portfolioId: import("typebox").TOptional<import("typebox").TString>;
                title: import("typebox").TString;
                description: import("typebox").TString;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                image: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                liveUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                githubUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                featured: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                role: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                engines: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                sortOrder: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly projectReorder: {
            200: import("typebox").TObject<{
                id: import("typebox").TOptional<import("typebox").TString>;
                metadata: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TOptional<import("typebox").TString>;
                    portfolioId: import("typebox").TOptional<import("typebox").TString>;
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    image: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    liveUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    githubUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    featured: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                    role: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    engines: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                    sortOrder: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>>;
                    createdAt: import("typebox").TOptional<import("typebox").TString>;
                    updatedAt: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly projectDelete: {
            200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
                id: import("typebox").TString;
            }>;
        };
        readonly export: {
            200: import("typebox").TUnknown;
        };
    };
    readonly resume: {
        readonly questionGenerate: {
            200: import("typebox").TObject<{
                questions: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    question: import("typebox").TString;
                    category: import("typebox").TString;
                }>>;
            }>;
        };
        readonly questionSynthesize: {
            201: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                personalInfo: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TOptional<import("typebox").TString>;
                    email: import("typebox").TOptional<import("typebox").TString>;
                    phone: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    website: import("typebox").TOptional<import("typebox").TString>;
                    linkedIn: import("typebox").TOptional<import("typebox").TString>;
                    github: import("typebox").TOptional<import("typebox").TString>;
                    portfolio: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                summary: import("typebox").TString;
                experience: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    startDate: import("typebox").TString;
                    endDate: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    description: import("typebox").TOptional<import("typebox").TString>;
                    achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                education: import("typebox").TArray<import("typebox").TObject<{
                    degree: import("typebox").TString;
                    field: import("typebox").TString;
                    school: import("typebox").TString;
                    year: import("typebox").TString;
                    gpa: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                skills: import("typebox").TOptional<import("typebox").TObject<{
                    technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    link: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
                    gameEngines: import("typebox").TOptional<import("typebox").TString>;
                    platforms: import("typebox").TOptional<import("typebox").TString>;
                    genres: import("typebox").TOptional<import("typebox").TString>;
                    shippedTitles: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
                theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
                isDefault: import("typebox").TBoolean;
            }>;
        };
        readonly list: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                personalInfo: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TOptional<import("typebox").TString>;
                    email: import("typebox").TOptional<import("typebox").TString>;
                    phone: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    website: import("typebox").TOptional<import("typebox").TString>;
                    linkedIn: import("typebox").TOptional<import("typebox").TString>;
                    github: import("typebox").TOptional<import("typebox").TString>;
                    portfolio: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                summary: import("typebox").TString;
                experience: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    startDate: import("typebox").TString;
                    endDate: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    description: import("typebox").TOptional<import("typebox").TString>;
                    achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                education: import("typebox").TArray<import("typebox").TObject<{
                    degree: import("typebox").TString;
                    field: import("typebox").TString;
                    school: import("typebox").TString;
                    year: import("typebox").TString;
                    gpa: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                skills: import("typebox").TOptional<import("typebox").TObject<{
                    technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    link: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
                    gameEngines: import("typebox").TOptional<import("typebox").TString>;
                    platforms: import("typebox").TOptional<import("typebox").TString>;
                    genres: import("typebox").TOptional<import("typebox").TString>;
                    shippedTitles: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
                theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
                isDefault: import("typebox").TBoolean;
            }>>;
        };
        readonly entity: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                personalInfo: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TOptional<import("typebox").TString>;
                    email: import("typebox").TOptional<import("typebox").TString>;
                    phone: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    website: import("typebox").TOptional<import("typebox").TString>;
                    linkedIn: import("typebox").TOptional<import("typebox").TString>;
                    github: import("typebox").TOptional<import("typebox").TString>;
                    portfolio: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                summary: import("typebox").TString;
                experience: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    startDate: import("typebox").TString;
                    endDate: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    description: import("typebox").TOptional<import("typebox").TString>;
                    achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                education: import("typebox").TArray<import("typebox").TObject<{
                    degree: import("typebox").TString;
                    field: import("typebox").TString;
                    school: import("typebox").TString;
                    year: import("typebox").TString;
                    gpa: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                skills: import("typebox").TOptional<import("typebox").TObject<{
                    technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    link: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
                    gameEngines: import("typebox").TOptional<import("typebox").TString>;
                    platforms: import("typebox").TOptional<import("typebox").TString>;
                    genres: import("typebox").TOptional<import("typebox").TString>;
                    shippedTitles: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
                theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
                isDefault: import("typebox").TBoolean;
            }>;
        };
        readonly create: {
            201: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                personalInfo: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TOptional<import("typebox").TString>;
                    email: import("typebox").TOptional<import("typebox").TString>;
                    phone: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    website: import("typebox").TOptional<import("typebox").TString>;
                    linkedIn: import("typebox").TOptional<import("typebox").TString>;
                    github: import("typebox").TOptional<import("typebox").TString>;
                    portfolio: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                summary: import("typebox").TString;
                experience: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    startDate: import("typebox").TString;
                    endDate: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    description: import("typebox").TOptional<import("typebox").TString>;
                    achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                education: import("typebox").TArray<import("typebox").TObject<{
                    degree: import("typebox").TString;
                    field: import("typebox").TString;
                    school: import("typebox").TString;
                    year: import("typebox").TString;
                    gpa: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                skills: import("typebox").TOptional<import("typebox").TObject<{
                    technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    link: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
                    gameEngines: import("typebox").TOptional<import("typebox").TString>;
                    platforms: import("typebox").TOptional<import("typebox").TString>;
                    genres: import("typebox").TOptional<import("typebox").TString>;
                    shippedTitles: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
                theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
                isDefault: import("typebox").TBoolean;
            }>;
        };
        readonly update: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                personalInfo: import("typebox").TOptional<import("typebox").TObject<{
                    name: import("typebox").TOptional<import("typebox").TString>;
                    email: import("typebox").TOptional<import("typebox").TString>;
                    phone: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    website: import("typebox").TOptional<import("typebox").TString>;
                    linkedIn: import("typebox").TOptional<import("typebox").TString>;
                    github: import("typebox").TOptional<import("typebox").TString>;
                    portfolio: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                summary: import("typebox").TString;
                experience: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    company: import("typebox").TString;
                    startDate: import("typebox").TString;
                    endDate: import("typebox").TOptional<import("typebox").TString>;
                    location: import("typebox").TOptional<import("typebox").TString>;
                    description: import("typebox").TOptional<import("typebox").TString>;
                    achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                education: import("typebox").TArray<import("typebox").TObject<{
                    degree: import("typebox").TString;
                    field: import("typebox").TString;
                    school: import("typebox").TString;
                    year: import("typebox").TString;
                    gpa: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                skills: import("typebox").TOptional<import("typebox").TObject<{
                    technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                projects: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    link: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
                    gameEngines: import("typebox").TOptional<import("typebox").TString>;
                    platforms: import("typebox").TOptional<import("typebox").TString>;
                    genres: import("typebox").TOptional<import("typebox").TString>;
                    shippedTitles: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
                theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
                isDefault: import("typebox").TBoolean;
            }>;
        };
        readonly delete: {
            200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
                id: import("typebox").TString;
            }>;
        };
        readonly export: {
            200: import("typebox").TUnknown;
        };
        readonly enhance: {
            200: import("typebox").TObject<{
                resume: import("typebox").TObject<{
                    id: import("typebox").TString;
                    name: import("typebox").TString;
                    personalInfo: import("typebox").TOptional<import("typebox").TObject<{
                        name: import("typebox").TOptional<import("typebox").TString>;
                        email: import("typebox").TOptional<import("typebox").TString>;
                        phone: import("typebox").TOptional<import("typebox").TString>;
                        location: import("typebox").TOptional<import("typebox").TString>;
                        website: import("typebox").TOptional<import("typebox").TString>;
                        linkedIn: import("typebox").TOptional<import("typebox").TString>;
                        github: import("typebox").TOptional<import("typebox").TString>;
                        portfolio: import("typebox").TOptional<import("typebox").TString>;
                    }>>;
                    summary: import("typebox").TString;
                    experience: import("typebox").TArray<import("typebox").TObject<{
                        title: import("typebox").TString;
                        company: import("typebox").TString;
                        startDate: import("typebox").TString;
                        endDate: import("typebox").TOptional<import("typebox").TString>;
                        location: import("typebox").TOptional<import("typebox").TString>;
                        description: import("typebox").TOptional<import("typebox").TString>;
                        achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>>;
                    education: import("typebox").TArray<import("typebox").TObject<{
                        degree: import("typebox").TString;
                        field: import("typebox").TString;
                        school: import("typebox").TString;
                        year: import("typebox").TString;
                        gpa: import("typebox").TOptional<import("typebox").TString>;
                    }>>;
                    skills: import("typebox").TOptional<import("typebox").TObject<{
                        technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>>;
                    projects: import("typebox").TArray<import("typebox").TObject<{
                        title: import("typebox").TString;
                        description: import("typebox").TString;
                        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        link: import("typebox").TOptional<import("typebox").TString>;
                    }>>;
                    gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
                        gameEngines: import("typebox").TOptional<import("typebox").TString>;
                        platforms: import("typebox").TOptional<import("typebox").TString>;
                        genres: import("typebox").TOptional<import("typebox").TString>;
                        shippedTitles: import("typebox").TOptional<import("typebox").TString>;
                    }>>;
                    template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
                    theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
                    isDefault: import("typebox").TBoolean;
                }>;
                suggestions: import("typebox").TArray<import("typebox").TUnknown>;
                section: import("typebox").TString;
            }>;
        };
        readonly score: {
            200: import("typebox").TObject<{
                resumeId: import("typebox").TString;
                jobId: import("typebox").TString;
                score: import("typebox").TNumber;
                strengths: import("typebox").TArray<import("typebox").TString>;
                improvements: import("typebox").TArray<import("typebox").TString>;
                keywords: import("typebox").TArray<import("typebox").TString>;
                analysis: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
            }>;
        };
    };
    readonly scraper: {
        readonly operation: {
            readonly 200: import("typebox").TObject<{
                scraped: import("typebox").TNumber;
                upserted: import("typebox").TNumber;
                errors: import("typebox").TArray<import("typebox").TString>;
                enrichment: import("typebox").TObject<{
                    enabled: import("typebox").TBoolean;
                    enrichedRecords: import("typebox").TNumber;
                    warnings: import("typebox").TArray<import("typebox").TString>;
                    provider: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>>;
                    model: import("typebox").TOptional<import("typebox").TString>;
                }>;
            }>;
        };
        readonly error: import("typebox").TObject<{
            error: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TString>;
        }>;
    };
    readonly search: {
        readonly all: {
            readonly 200: import("typebox").TObject<{
                query: import("typebox").TString;
                results: import("typebox").TArray<import("typebox").TObject<{
                    type: import("typebox").TUnion<[import("typebox").TLiteral<"jobs">, import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"skills">, import("typebox").TLiteral<"resumes">]>;
                    id: import("typebox").TString;
                    title: import("typebox").TString;
                    subtitle: import("typebox").TString;
                    snippet: import("typebox").TString;
                    relevance: import("typebox").TNumber;
                }>>;
                counts: import("typebox").TObject<{
                    jobs: import("typebox").TNumber;
                    studios: import("typebox").TNumber;
                    skills: import("typebox").TNumber;
                    resumes: import("typebox").TNumber;
                }>;
                totalTime: import("typebox").TNumber;
            }>;
        };
        readonly autocomplete: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                text: import("typebox").TString;
                type: import("typebox").TString;
            }>>;
        };
    };
    readonly settings: {
        readonly read: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                geminiApiKey: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                openaiApiKey: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                claudeApiKey: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                huggingfaceToken: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                localModelEndpoint: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                localModelName: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                aiRouting: import("typebox").TObject<{
                    chat: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    interviewQuestions: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    interviewFeedback: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    resume: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    coverLetter: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    emailResponse: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    jobMatch: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    scrapeEnrichment: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                    automationFieldMapping: import("typebox").TObject<{
                        provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                        model: import("typebox").TOptional<import("typebox").TString>;
                    }>;
                }>;
                preferredProvider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                preferredModel: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                theme: import("typebox").TUnion<[import("typebox").TLiteral<"corporate">, import("typebox").TLiteral<"business">]>;
                language: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TLiteral<"en-US">, import("typebox").TLiteral<"es-ES">, import("typebox").TLiteral<"fr-FR">, import("typebox").TLiteral<"ja-JP">]>, import("typebox").TNull]>;
                brandSettings: import("typebox").TObject<{
                    name: import("typebox").TString;
                    assistantName: import("typebox").TString;
                    apiName: import("typebox").TString;
                    logoPath: import("typebox").TString;
                    faviconPath: import("typebox").TString;
                    typography: import("typebox").TObject<{
                        fontStylesheetUrl: import("typebox").TString;
                        displayFontFamily: import("typebox").TString;
                        bodyFontFamily: import("typebox").TString;
                        monoFontFamily: import("typebox").TString;
                    }>;
                    lightTheme: import("typebox").TObject<{
                        base100: import("typebox").TString;
                        base200: import("typebox").TString;
                        base300: import("typebox").TString;
                        baseContent: import("typebox").TString;
                        primary: import("typebox").TString;
                        primaryContent: import("typebox").TString;
                        secondary: import("typebox").TString;
                        secondaryContent: import("typebox").TString;
                        accent: import("typebox").TString;
                        accentContent: import("typebox").TString;
                        neutral: import("typebox").TString;
                        neutralContent: import("typebox").TString;
                        info: import("typebox").TString;
                        infoContent: import("typebox").TString;
                        success: import("typebox").TString;
                        successContent: import("typebox").TString;
                        warning: import("typebox").TString;
                        warningContent: import("typebox").TString;
                        error: import("typebox").TString;
                        errorContent: import("typebox").TString;
                        radiusSelector: import("typebox").TString;
                        radiusField: import("typebox").TString;
                        radiusBox: import("typebox").TString;
                        sizeSelector: import("typebox").TString;
                        sizeField: import("typebox").TString;
                        border: import("typebox").TString;
                        depth: import("typebox").TString;
                        noise: import("typebox").TString;
                    }>;
                    darkTheme: import("typebox").TObject<{
                        base100: import("typebox").TString;
                        base200: import("typebox").TString;
                        base300: import("typebox").TString;
                        baseContent: import("typebox").TString;
                        primary: import("typebox").TString;
                        primaryContent: import("typebox").TString;
                        secondary: import("typebox").TString;
                        secondaryContent: import("typebox").TString;
                        accent: import("typebox").TString;
                        accentContent: import("typebox").TString;
                        neutral: import("typebox").TString;
                        neutralContent: import("typebox").TString;
                        info: import("typebox").TString;
                        infoContent: import("typebox").TString;
                        success: import("typebox").TString;
                        successContent: import("typebox").TString;
                        warning: import("typebox").TString;
                        warningContent: import("typebox").TString;
                        error: import("typebox").TString;
                        errorContent: import("typebox").TString;
                        radiusSelector: import("typebox").TString;
                        radiusField: import("typebox").TString;
                        radiusBox: import("typebox").TString;
                        sizeSelector: import("typebox").TString;
                        sizeField: import("typebox").TString;
                        border: import("typebox").TString;
                        depth: import("typebox").TString;
                        noise: import("typebox").TString;
                    }>;
                    content: import("typebox").TObject<{
                        tagline: import("typebox").TString;
                        defaultTitle: import("typebox").TString;
                        defaultDescription: import("typebox").TString;
                        contentOverrides: import("typebox").TRecord<"^.*$", import("typebox").TString>;
                    }>;
                }>;
                notifications: import("typebox").TUnion<[import("typebox").TObject<{
                    achievements: import("typebox").TBoolean;
                    dailyChallenges: import("typebox").TBoolean;
                    jobAlerts: import("typebox").TBoolean;
                    levelUp: import("typebox").TBoolean;
                }>, import("typebox").TNull]>;
                automationSettings: import("typebox").TUnion<[import("typebox").TObject<{
                    headless: import("typebox").TBoolean;
                    defaultTimeout: import("typebox").TNumber;
                    screenshotRetention: import("typebox").TNumber;
                    maxConcurrentRuns: import("typebox").TNumber;
                    defaultBrowser: import("typebox").TUnion<[import("typebox").TLiteral<"chrome">, import("typebox").TLiteral<"chromium">, import("typebox").TLiteral<"edge">]>;
                    enableSmartSelectors: import("typebox").TBoolean;
                    autoSaveScreenshots: import("typebox").TBoolean;
                    speech: import("typebox").TObject<{
                        locale: import("typebox").TString;
                        stt: import("typebox").TObject<{
                            provider: import("typebox").TUnion<[import("typebox").TLiteral<"browser">, import("typebox").TLiteral<"openai">, import("typebox").TLiteral<"huggingface">, import("typebox").TLiteral<"local">, import("typebox").TLiteral<"custom">]>;
                            model: import("typebox").TString;
                            endpoint: import("typebox").TString;
                        }>;
                        tts: import("typebox").TObject<{
                            provider: import("typebox").TUnion<[import("typebox").TLiteral<"browser">, import("typebox").TLiteral<"openai">, import("typebox").TLiteral<"huggingface">, import("typebox").TLiteral<"local">, import("typebox").TLiteral<"custom">]>;
                            model: import("typebox").TString;
                            endpoint: import("typebox").TString;
                            voice: import("typebox").TString;
                            format: import("typebox").TUnion<[import("typebox").TLiteral<"mp3">, import("typebox").TLiteral<"wav">]>;
                        }>;
                    }>;
                    jobProviders: import("typebox").TObject<{
                        providerTimeoutMs: import("typebox").TNumber;
                        companyBoardResultLimit: import("typebox").TNumber;
                        gamingBoardResultLimit: import("typebox").TNumber;
                        unknownLocationLabel: import("typebox").TString;
                        unknownCompanyLabel: import("typebox").TString;
                        hitmarkerEnabled: import("typebox").TBoolean;
                        hitmarkerApiBaseUrl: import("typebox").TString;
                        hitmarkerDefaultQuery: import("typebox").TString;
                        hitmarkerDefaultLocation: import("typebox").TString;
                        greenhouseApiBaseUrl: import("typebox").TString;
                        greenhouseMaxPages: import("typebox").TNumber;
                        greenhouseBoards: import("typebox").TArray<import("typebox").TObject<{
                            board: import("typebox").TString;
                            company: import("typebox").TString;
                            enabled: import("typebox").TBoolean;
                        }>>;
                        leverApiBaseUrl: import("typebox").TString;
                        leverMaxPages: import("typebox").TNumber;
                        leverCompanies: import("typebox").TArray<import("typebox").TObject<{
                            slug: import("typebox").TString;
                            company: import("typebox").TString;
                            enabled: import("typebox").TBoolean;
                        }>>;
                        companyBoardApiTemplates: import("typebox").TObject<{
                            greenhouse: import("typebox").TString;
                            lever: import("typebox").TString;
                            recruitee: import("typebox").TString;
                            workable: import("typebox").TString;
                            ashby: import("typebox").TString;
                            smartrecruiters: import("typebox").TString;
                            teamtailor: import("typebox").TString;
                            workday: import("typebox").TString;
                        }>;
                        companyBoards: import("typebox").TArray<import("typebox").TObject<{
                            name: import("typebox").TString;
                            token: import("typebox").TString;
                            type: import("typebox").TUnion<[import("typebox").TLiteral<"greenhouse">, import("typebox").TLiteral<"lever">, import("typebox").TLiteral<"recruitee">, import("typebox").TLiteral<"workable">, import("typebox").TLiteral<"ashby">, import("typebox").TLiteral<"smartrecruiters">, import("typebox").TLiteral<"teamtailor">, import("typebox").TLiteral<"workday">]>;
                            enabled: import("typebox").TBoolean;
                            priority: import("typebox").TNumber;
                        }>>;
                        gamingPortals: import("typebox").TArray<import("typebox").TObject<{
                            id: import("typebox").TUnion<[import("typebox").TLiteral<"hitmarker">, import("typebox").TLiteral<"grackle">, import("typebox").TLiteral<"workwithindies">, import("typebox").TLiteral<"remotegamejobs">, import("typebox").TLiteral<"gamesjobsdirect">, import("typebox").TLiteral<"pocketgamer">]>;
                            name: import("typebox").TString;
                            source: import("typebox").TString;
                            fallbackUrl: import("typebox").TString;
                            enabled: import("typebox").TBoolean;
                        }>>;
                    }>;
                }>, import("typebox").TNull]>;
                emailTransportSettings: import("typebox").TUnion<[import("typebox").TObject<{
                    host: import("typebox").TString;
                    port: import("typebox").TNumber;
                    security: import("typebox").TUnion<[import("typebox").TLiteral<"tls">, import("typebox").TLiteral<"starttls">, import("typebox").TLiteral<"plain">]>;
                    username: import("typebox").TString;
                    fromEmail: import("typebox").TString;
                    fromName: import("typebox").TString;
                    authMethod: import("typebox").TUnion<[import("typebox").TLiteral<"plain">, import("typebox").TLiteral<"login">]>;
                    connectionTimeoutSeconds: import("typebox").TNumber;
                }>, import("typebox").TNull]>;
                createdAt: import("typebox").TString;
                updatedAt: import("typebox").TString;
                providerDiagnostics: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TObject<{
                    provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                    code: import("typebox").TString;
                    checkedAt: import("typebox").TString;
                    endpoint: import("typebox").TOptional<import("typebox").TString>;
                    selectedModel: import("typebox").TOptional<import("typebox").TString>;
                    availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    message: import("typebox").TOptional<import("typebox").TString>;
                }>>>;
                hasGeminiKey: import("typebox").TBoolean;
                hasOpenaiKey: import("typebox").TBoolean;
                hasClaudeKey: import("typebox").TBoolean;
                hasHuggingfaceToken: import("typebox").TBoolean;
                hasEmailTransportPassword: import("typebox").TBoolean;
                hasLocalKey: import("typebox").TBoolean;
                jobTaxonomy: import("typebox").TObject<{
                    keywords: import("typebox").TArray<import("typebox").TObject<{
                        id: import("typebox").TString;
                        category: import("typebox").TUnion<[import("typebox").TLiteral<"remote-location">, import("typebox").TLiteral<"hybrid-location">, import("typebox").TLiteral<"requirement">, import("typebox").TLiteral<"technology">, import("typebox").TLiteral<"genre">, import("typebox").TLiteral<"platform">, import("typebox").TLiteral<"role">]>;
                        label: import("typebox").TString;
                        synonyms: import("typebox").TArray<import("typebox").TString>;
                        sortOrder: import("typebox").TNumber;
                        enabled: import("typebox").TBoolean;
                    }>>;
                    studioRules: import("typebox").TArray<import("typebox").TObject<{
                        id: import("typebox").TString;
                        studioType: import("typebox").TUnion<[import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>]>;
                        keyword: import("typebox").TString;
                        sortOrder: import("typebox").TNumber;
                        enabled: import("typebox").TBoolean;
                    }>>;
                }>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly update: {
            readonly 200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly jobTaxonomyUpdate: {
            readonly 200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
                jobTaxonomy: import("typebox").TObject<{
                    keywords: import("typebox").TArray<import("typebox").TObject<{
                        id: import("typebox").TString;
                        category: import("typebox").TUnion<[import("typebox").TLiteral<"remote-location">, import("typebox").TLiteral<"hybrid-location">, import("typebox").TLiteral<"requirement">, import("typebox").TLiteral<"technology">, import("typebox").TLiteral<"genre">, import("typebox").TLiteral<"platform">, import("typebox").TLiteral<"role">]>;
                        label: import("typebox").TString;
                        synonyms: import("typebox").TArray<import("typebox").TString>;
                        sortOrder: import("typebox").TNumber;
                        enabled: import("typebox").TBoolean;
                    }>>;
                    studioRules: import("typebox").TArray<import("typebox").TObject<{
                        id: import("typebox").TString;
                        studioType: import("typebox").TUnion<[import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>]>;
                        keyword: import("typebox").TString;
                        sortOrder: import("typebox").TNumber;
                        enabled: import("typebox").TBoolean;
                    }>>;
                }>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly apiKeysUpdate: {
            readonly 200: import("typebox").TObject<{
                success: import("typebox").TBoolean;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly providerTest: {
            readonly 200: import("typebox").TObject<{
                valid: import("typebox").TBoolean;
                provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
                diagnosticCode: import("typebox").TOptional<import("typebox").TString>;
                message: import("typebox").TOptional<import("typebox").TString>;
                availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                selectedModel: import("typebox").TOptional<import("typebox").TString>;
                error: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly export: {
            readonly 200: import("typebox").TObject<{
                version: import("typebox").TLiteral<"1.0">;
                exportedAt: import("typebox").TString;
                profile: import("typebox").TUnknown;
                settings: import("typebox").TUnknown;
                resumes: import("typebox").TArray<import("typebox").TUnknown>;
                coverLetters: import("typebox").TArray<import("typebox").TUnknown>;
                portfolio: import("typebox").TUnknown;
                portfolioProjects: import("typebox").TArray<import("typebox").TUnknown>;
                interviewSessions: import("typebox").TArray<import("typebox").TUnknown>;
                gamification: import("typebox").TUnknown;
                applications: import("typebox").TArray<import("typebox").TUnknown>;
                chatHistory: import("typebox").TArray<import("typebox").TUnknown>;
                savedJobs: import("typebox").TArray<import("typebox").TUnknown>;
                skillMappings: import("typebox").TArray<import("typebox").TUnknown>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly import: {
            readonly 200: import("typebox").TObject<{
                imported: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
                skipped: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
                errors: import("typebox").TArray<import("typebox").TString>;
            }>;
            readonly 429: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
    };
    readonly skillMapping: {
        readonly list: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                gameExpression: import("typebox").TString;
                transferableSkill: import("typebox").TString;
                industryApplications: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
                evidence: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>;
                confidence: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
                category: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                demandLevel: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                aiGenerated: import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>;
                createdAt: import("typebox").TString;
                updatedAt: import("typebox").TString;
            }>>;
        };
        readonly create: {
            201: import("typebox").TObject<{
                id: import("typebox").TString;
                gameExpression: import("typebox").TString;
                transferableSkill: import("typebox").TString;
                industryApplications: import("typebox").TArray<import("typebox").TString>;
                evidenceSuggestions: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                evidence: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TString;
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    url: import("typebox").TOptional<import("typebox").TString>;
                    verificationStatus: import("typebox").TString;
                }>>;
                confidence: import("typebox").TNumber;
                category: import("typebox").TString;
                demandLevel: import("typebox").TString;
                verified: import("typebox").TBoolean;
                aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
            }>;
        };
        readonly update: {
            200: import("typebox").TObject<{
                id: import("typebox").TString;
                gameExpression: import("typebox").TString;
                transferableSkill: import("typebox").TString;
                industryApplications: import("typebox").TArray<import("typebox").TString>;
                evidenceSuggestions: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                evidence: import("typebox").TArray<import("typebox").TObject<{
                    id: import("typebox").TString;
                    type: import("typebox").TString;
                    title: import("typebox").TString;
                    description: import("typebox").TString;
                    url: import("typebox").TOptional<import("typebox").TString>;
                    verificationStatus: import("typebox").TString;
                }>>;
                confidence: import("typebox").TNumber;
                category: import("typebox").TString;
                demandLevel: import("typebox").TString;
                verified: import("typebox").TBoolean;
                aiGenerated: import("typebox").TOptional<import("typebox").TBoolean>;
            }>;
        };
        readonly delete: {
            200: import("typebox").TObject<{
                message: import("typebox").TString;
                id: import("typebox").TString;
            }>;
            410: import("typebox").TObject<{
                error: import("typebox").TString;
                code: import("typebox").TOptional<import("typebox").TString>;
                fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>;
        };
        readonly pathways: {
            200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                title: import("typebox").TString;
                description: import("typebox").TString;
                detailedDescription: import("typebox").TOptional<import("typebox").TString>;
                matchScore: import("typebox").TNumber;
                stages: import("typebox").TArray<import("typebox").TObject<{
                    title: import("typebox").TString;
                    duration: import("typebox").TString;
                    description: import("typebox").TString;
                    completed: import("typebox").TOptional<import("typebox").TBoolean>;
                    current: import("typebox").TOptional<import("typebox").TBoolean>;
                    requirements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    outcomes: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                }>>;
                requiredSkills: import("typebox").TArray<import("typebox").TString>;
                estimatedTimeToEntry: import("typebox").TString;
                icon: import("typebox").TOptional<import("typebox").TString>;
                averageSalary: import("typebox").TOptional<import("typebox").TObject<{
                    min: import("typebox").TNumber;
                    max: import("typebox").TNumber;
                    currency: import("typebox").TOptional<import("typebox").TString>;
                }>>;
                jobMarketTrend: import("typebox").TString;
            }>>;
        };
        readonly readiness: {
            200: import("typebox").TObject<{
                overallScore: import("typebox").TNumber;
                categories: import("typebox").TObject<{
                    technical: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                    softSkills: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                    industryKnowledge: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                    portfolio: import("typebox").TObject<{
                        score: import("typebox").TNumber;
                        feedbackId: import("typebox").TString;
                        strengths: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                        improvements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                    }>;
                }>;
                improvementSuggestions: import("typebox").TArray<import("typebox").TString>;
                nextSteps: import("typebox").TArray<import("typebox").TString>;
                targetRoleReadiness: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
                    roleId: import("typebox").TString;
                    roleTitle: import("typebox").TString;
                    readinessScore: import("typebox").TNumber;
                    missingSkills: import("typebox").TArray<import("typebox").TString>;
                    matchingSkills: import("typebox").TArray<import("typebox").TString>;
                    timeToReady: import("typebox").TOptional<import("typebox").TString>;
                    recommendedActions: import("typebox").TArray<import("typebox").TString>;
                }>>>;
                jobId: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly analysis: {
            200: import("typebox").TObject<{
                message: import("typebox").TString;
                detectedSkills: import("typebox").TArray<import("typebox").TString>;
                suggestedMappings: import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
                recommendations: import("typebox").TArray<import("typebox").TString>;
                provider: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
    };
    readonly stats: {
        readonly dashboard: {
            readonly 200: import("typebox").TObject<{
                profile: import("typebox").TObject<{
                    completeness: import("typebox").TNumber;
                }>;
                jobs: import("typebox").TObject<{
                    saved: import("typebox").TNumber;
                    applied: import("typebox").TNumber;
                    interviewing: import("typebox").TNumber;
                    offered: import("typebox").TNumber;
                }>;
                resumes: import("typebox").TObject<{
                    count: import("typebox").TNumber;
                    lastUpdated: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                }>;
                coverLetters: import("typebox").TObject<{
                    count: import("typebox").TNumber;
                }>;
                portfolio: import("typebox").TObject<{
                    projectCount: import("typebox").TNumber;
                }>;
                interviews: import("typebox").TObject<{
                    totalSessions: import("typebox").TNumber;
                    averageScore: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
                }>;
                skills: import("typebox").TObject<{
                    mappedCount: import("typebox").TNumber;
                }>;
                ai: import("typebox").TObject<{
                    chatMessages: import("typebox").TNumber;
                    chatSessions: import("typebox").TNumber;
                }>;
                gamification: import("typebox").TObject<{
                    level: import("typebox").TNumber;
                    xp: import("typebox").TNumber;
                    achievements: import("typebox").TNumber;
                    streak: import("typebox").TNumber;
                }>;
                automation: import("typebox").TObject<{
                    totalRuns: import("typebox").TNumber;
                    successfulRuns: import("typebox").TNumber;
                    successRate: import("typebox").TNumber;
                    todayRuns: import("typebox").TNumber;
                    recentRuns: import("typebox").TArray<import("typebox").TObject<{
                        id: import("typebox").TString;
                        type: import("typebox").TString;
                        status: import("typebox").TString;
                        createdAt: import("typebox").TString;
                    }>>;
                }>;
            }>;
        };
        readonly weekly: {
            readonly 200: import("typebox").TObject<{
                days: import("typebox").TArray<import("typebox").TObject<{
                    date: import("typebox").TString;
                    actions: import("typebox").TNumber;
                    xpEarned: import("typebox").TNumber;
                }>>;
                topCategory: import("typebox").TString;
                totalXP: import("typebox").TNumber;
            }>;
        };
        readonly career: {
            readonly 200: import("typebox").TObject<{
                skillCoverage: import("typebox").TNumber;
                applicationSuccessRate: import("typebox").TNumber;
                interviewTrend: import("typebox").TArray<import("typebox").TNumber>;
            }>;
        };
    };
    readonly studio: {
        readonly list: {
            readonly 200: import("typebox").TArray<import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>>;
        };
        readonly entity: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
            readonly 201: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                logo: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                size: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                type: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                description: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                games: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
                culture: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                interviewStyle: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
                remoteWork: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
                enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>>;
                createdAt: import("typebox").TOptional<import("typebox").TString>;
                updatedAt: import("typebox").TOptional<import("typebox").TString>;
            }>;
        };
        readonly delete: {
            readonly 200: import("typebox").TObject<{
                message: import("typebox").TString;
                id: import("typebox").TString;
            }>;
        };
        readonly analytics: {
            readonly 200: import("typebox").TObject<{
                totalStudios: import("typebox").TNumber;
                byType: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
                bySize: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
                remoteWorkStudios: import("typebox").TNumber;
                topTechnologies: import("typebox").TArray<import("typebox").TObject<{
                    name: import("typebox").TString;
                    count: import("typebox").TNumber;
                }>>;
            }>;
        };
    };
    readonly user: {
        readonly profile: {
            readonly 200: import("typebox").TObject<{
                id: import("typebox").TString;
                name: import("typebox").TString;
                email: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                phone: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                linkedin: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                github: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                summary: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                currentRole: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                currentCompany: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
                yearsExperience: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
                technicalSkills: import("typebox").TArray<import("typebox").TString>;
                softSkills: import("typebox").TArray<import("typebox").TString>;
                gamingExperience: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
                careerGoals: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
                createdAt: import("typebox").TString;
                updatedAt: import("typebox").TString;
            }>;
        };
    };
};
