export declare const preferredProviderBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
export declare const resolveKnownProvider: (value?: string | null) => import("@bao/shared").AIProviderType;
export declare const settingsUpdateBodySchema: import("@sinclair/typebox").TObject<{
    aiRouting: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        chat: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        interviewQuestions: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        interviewFeedback: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        resume: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        coverLetter: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        emailResponse: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        jobMatch: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        scrapeEnrichment: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
        automationFieldMapping: import("@sinclair/typebox").TObject<{
            provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
            model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>;
    }>>;
    preferredProvider: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>>;
    preferredModel: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    theme: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"corporate">, import("@sinclair/typebox").TLiteral<"business">, import("@sinclair/typebox").TLiteral<"bao-light">, import("@sinclair/typebox").TLiteral<"bao-dark">]>>;
    language: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"en-US">, import("@sinclair/typebox").TLiteral<"es-ES">, import("@sinclair/typebox").TLiteral<"fr-FR">, import("@sinclair/typebox").TLiteral<"ja-JP">]>>;
    brandSettings: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        assistantName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        apiName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        logoPath: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        faviconPath: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        typography: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            fontStylesheetUrl: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            displayFontFamily: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            bodyFontFamily: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            monoFontFamily: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        lightTheme: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            base100: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            base200: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            base300: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            baseContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            primary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            primaryContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            secondary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            secondaryContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            accent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            accentContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            neutral: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            neutralContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            info: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            infoContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            success: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            successContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            warning: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            warningContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            error: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            errorContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            radiusSelector: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            radiusField: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            radiusBox: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sizeSelector: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sizeField: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            border: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            depth: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            noise: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        darkTheme: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            base100: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            base200: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            base300: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            baseContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            primary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            primaryContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            secondary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            secondaryContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            accent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            accentContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            neutral: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            neutralContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            info: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            infoContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            success: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            successContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            warning: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            warningContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            error: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            errorContent: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            radiusSelector: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            radiusField: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            radiusBox: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sizeSelector: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            sizeField: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            border: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            depth: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            noise: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        }>>;
        content: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            tagline: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            defaultTitle: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            defaultDescription: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
            contentOverrides: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
        }>>;
    }>>;
    notifications: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        achievements: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        dailyChallenges: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        jobAlerts: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        levelUp: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    }>>;
    automationSettings: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        headless: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        defaultTimeout: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        screenshotRetention: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        maxConcurrentRuns: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        defaultBrowser: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"chrome">, import("@sinclair/typebox").TLiteral<"chromium">, import("@sinclair/typebox").TLiteral<"edge">]>>;
        enableSmartSelectors: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        autoSaveScreenshots: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
        speech: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            locale: import("@sinclair/typebox").TString;
            stt: import("@sinclair/typebox").TObject<{
                provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"browser">, import("@sinclair/typebox").TLiteral<"openai">, import("@sinclair/typebox").TLiteral<"huggingface">, import("@sinclair/typebox").TLiteral<"local">, import("@sinclair/typebox").TLiteral<"custom">]>;
                model: import("@sinclair/typebox").TString;
                endpoint: import("@sinclair/typebox").TString;
            }>;
            tts: import("@sinclair/typebox").TObject<{
                provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"browser">, import("@sinclair/typebox").TLiteral<"openai">, import("@sinclair/typebox").TLiteral<"huggingface">, import("@sinclair/typebox").TLiteral<"local">, import("@sinclair/typebox").TLiteral<"custom">]>;
                model: import("@sinclair/typebox").TString;
                endpoint: import("@sinclair/typebox").TString;
                voice: import("@sinclair/typebox").TString;
                format: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"mp3">, import("@sinclair/typebox").TLiteral<"wav">]>;
            }>;
        }>>;
        jobProviders: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
            providerTimeoutMs: import("@sinclair/typebox").TNumber;
            companyBoardResultLimit: import("@sinclair/typebox").TNumber;
            gamingBoardResultLimit: import("@sinclair/typebox").TNumber;
            unknownLocationLabel: import("@sinclair/typebox").TString;
            unknownCompanyLabel: import("@sinclair/typebox").TString;
            hitmarkerEnabled: import("@sinclair/typebox").TBoolean;
            hitmarkerApiBaseUrl: import("@sinclair/typebox").TString;
            hitmarkerDefaultQuery: import("@sinclair/typebox").TString;
            hitmarkerDefaultLocation: import("@sinclair/typebox").TString;
            greenhouseApiBaseUrl: import("@sinclair/typebox").TString;
            greenhouseMaxPages: import("@sinclair/typebox").TNumber;
            greenhouseBoards: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                board: import("@sinclair/typebox").TString;
                company: import("@sinclair/typebox").TString;
                enabled: import("@sinclair/typebox").TBoolean;
            }>>;
            leverApiBaseUrl: import("@sinclair/typebox").TString;
            leverMaxPages: import("@sinclair/typebox").TNumber;
            leverCompanies: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                slug: import("@sinclair/typebox").TString;
                company: import("@sinclair/typebox").TString;
                enabled: import("@sinclair/typebox").TBoolean;
            }>>;
            companyBoardApiTemplates: import("@sinclair/typebox").TObject<{
                greenhouse: import("@sinclair/typebox").TString;
                lever: import("@sinclair/typebox").TString;
                recruitee: import("@sinclair/typebox").TString;
                workable: import("@sinclair/typebox").TString;
                ashby: import("@sinclair/typebox").TString;
                smartrecruiters: import("@sinclair/typebox").TString;
                teamtailor: import("@sinclair/typebox").TString;
                workday: import("@sinclair/typebox").TString;
            }>;
            companyBoards: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                name: import("@sinclair/typebox").TString;
                token: import("@sinclair/typebox").TString;
                type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"greenhouse">, import("@sinclair/typebox").TLiteral<"lever">, import("@sinclair/typebox").TLiteral<"recruitee">, import("@sinclair/typebox").TLiteral<"workable">, import("@sinclair/typebox").TLiteral<"ashby">, import("@sinclair/typebox").TLiteral<"smartrecruiters">, import("@sinclair/typebox").TLiteral<"teamtailor">, import("@sinclair/typebox").TLiteral<"workday">]>;
                enabled: import("@sinclair/typebox").TBoolean;
                priority: import("@sinclair/typebox").TNumber;
            }>>;
            gamingPortals: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
                id: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"hitmarker">, import("@sinclair/typebox").TLiteral<"grackle">, import("@sinclair/typebox").TLiteral<"workwithindies">, import("@sinclair/typebox").TLiteral<"remotegamejobs">, import("@sinclair/typebox").TLiteral<"gamesjobsdirect">, import("@sinclair/typebox").TLiteral<"pocketgamer">]>;
                name: import("@sinclair/typebox").TString;
                source: import("@sinclair/typebox").TString;
                fallbackUrl: import("@sinclair/typebox").TString;
                enabled: import("@sinclair/typebox").TBoolean;
            }>>;
        }>>;
    }>>;
    emailTransportSettings: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        host: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        port: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        security: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"tls">, import("@sinclair/typebox").TLiteral<"starttls">, import("@sinclair/typebox").TLiteral<"plain">]>>;
        username: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        fromEmail: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        fromName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        authMethod: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"login">]>>;
        connectionTimeoutSeconds: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    }>>;
}>;
export declare const apiKeysUpdateBodySchema: import("@sinclair/typebox").TObject<{
    geminiApiKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    openaiApiKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    claudeApiKey: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    huggingfaceToken: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    localModelEndpoint: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    localModelName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    emailTransportPassword: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const providerTestBodySchema: import("@sinclair/typebox").TObject<{
    provider: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
    key: import("@sinclair/typebox").TString;
    model: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const importSettingsBodySchema: import("@sinclair/typebox").TObject<{
    version: import("@sinclair/typebox").TLiteral<"1.0">;
    exportedAt: import("@sinclair/typebox").TString;
    profile: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>, import("@sinclair/typebox").TNull]>;
    settings: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>, import("@sinclair/typebox").TNull]>;
    resumes: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
    coverLetters: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
    portfolio: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>, import("@sinclair/typebox").TNull]>;
    portfolioProjects: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
    interviewSessions: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
    gamification: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>, import("@sinclair/typebox").TNull]>;
    applications: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
    chatHistory: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
    savedJobs: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
    skillMappings: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>>;
}>;
