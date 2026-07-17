import type { Static } from "typebox";
import { resolveKnownProvider as resolveKnownProviderValue } from "./settings-route-schema-ai-brand";
export declare const preferredProviderBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
export declare const resolveKnownProvider: typeof resolveKnownProviderValue;
export declare const settingsUpdateBodySchema: import("typebox").TObject<{
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
    preferredProvider: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>>;
    preferredModel: import("typebox").TOptional<import("typebox").TString>;
    theme: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"corporate">, import("typebox").TLiteral<"business">, import("typebox").TLiteral<"bao-light">, import("typebox").TLiteral<"bao-dark">]>>;
    language: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"en-US">, import("typebox").TLiteral<"es-ES">, import("typebox").TLiteral<"fr-FR">, import("typebox").TLiteral<"ja-JP">]>>;
    brandSettings: import("typebox").TOptional<import("typebox").TObject<{
        name: import("typebox").TOptional<import("typebox").TString>;
        assistantName: import("typebox").TOptional<import("typebox").TString>;
        apiName: import("typebox").TOptional<import("typebox").TString>;
        logoPath: import("typebox").TOptional<import("typebox").TString>;
        faviconPath: import("typebox").TOptional<import("typebox").TString>;
        typography: import("typebox").TOptional<import("typebox").TObject<{
            fontStylesheetUrl: import("typebox").TOptional<import("typebox").TString>;
            displayFontFamily: import("typebox").TOptional<import("typebox").TString>;
            bodyFontFamily: import("typebox").TOptional<import("typebox").TString>;
            monoFontFamily: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        lightTheme: import("typebox").TOptional<import("typebox").TObject<{
            base100: import("typebox").TOptional<import("typebox").TString>;
            base200: import("typebox").TOptional<import("typebox").TString>;
            base300: import("typebox").TOptional<import("typebox").TString>;
            baseContent: import("typebox").TOptional<import("typebox").TString>;
            primary: import("typebox").TOptional<import("typebox").TString>;
            primaryContent: import("typebox").TOptional<import("typebox").TString>;
            secondary: import("typebox").TOptional<import("typebox").TString>;
            secondaryContent: import("typebox").TOptional<import("typebox").TString>;
            accent: import("typebox").TOptional<import("typebox").TString>;
            accentContent: import("typebox").TOptional<import("typebox").TString>;
            neutral: import("typebox").TOptional<import("typebox").TString>;
            neutralContent: import("typebox").TOptional<import("typebox").TString>;
            info: import("typebox").TOptional<import("typebox").TString>;
            infoContent: import("typebox").TOptional<import("typebox").TString>;
            success: import("typebox").TOptional<import("typebox").TString>;
            successContent: import("typebox").TOptional<import("typebox").TString>;
            warning: import("typebox").TOptional<import("typebox").TString>;
            warningContent: import("typebox").TOptional<import("typebox").TString>;
            error: import("typebox").TOptional<import("typebox").TString>;
            errorContent: import("typebox").TOptional<import("typebox").TString>;
            radiusSelector: import("typebox").TOptional<import("typebox").TString>;
            radiusField: import("typebox").TOptional<import("typebox").TString>;
            radiusBox: import("typebox").TOptional<import("typebox").TString>;
            sizeSelector: import("typebox").TOptional<import("typebox").TString>;
            sizeField: import("typebox").TOptional<import("typebox").TString>;
            border: import("typebox").TOptional<import("typebox").TString>;
            depth: import("typebox").TOptional<import("typebox").TString>;
            noise: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        darkTheme: import("typebox").TOptional<import("typebox").TObject<{
            base100: import("typebox").TOptional<import("typebox").TString>;
            base200: import("typebox").TOptional<import("typebox").TString>;
            base300: import("typebox").TOptional<import("typebox").TString>;
            baseContent: import("typebox").TOptional<import("typebox").TString>;
            primary: import("typebox").TOptional<import("typebox").TString>;
            primaryContent: import("typebox").TOptional<import("typebox").TString>;
            secondary: import("typebox").TOptional<import("typebox").TString>;
            secondaryContent: import("typebox").TOptional<import("typebox").TString>;
            accent: import("typebox").TOptional<import("typebox").TString>;
            accentContent: import("typebox").TOptional<import("typebox").TString>;
            neutral: import("typebox").TOptional<import("typebox").TString>;
            neutralContent: import("typebox").TOptional<import("typebox").TString>;
            info: import("typebox").TOptional<import("typebox").TString>;
            infoContent: import("typebox").TOptional<import("typebox").TString>;
            success: import("typebox").TOptional<import("typebox").TString>;
            successContent: import("typebox").TOptional<import("typebox").TString>;
            warning: import("typebox").TOptional<import("typebox").TString>;
            warningContent: import("typebox").TOptional<import("typebox").TString>;
            error: import("typebox").TOptional<import("typebox").TString>;
            errorContent: import("typebox").TOptional<import("typebox").TString>;
            radiusSelector: import("typebox").TOptional<import("typebox").TString>;
            radiusField: import("typebox").TOptional<import("typebox").TString>;
            radiusBox: import("typebox").TOptional<import("typebox").TString>;
            sizeSelector: import("typebox").TOptional<import("typebox").TString>;
            sizeField: import("typebox").TOptional<import("typebox").TString>;
            border: import("typebox").TOptional<import("typebox").TString>;
            depth: import("typebox").TOptional<import("typebox").TString>;
            noise: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        content: import("typebox").TOptional<import("typebox").TObject<{
            tagline: import("typebox").TOptional<import("typebox").TString>;
            defaultTitle: import("typebox").TOptional<import("typebox").TString>;
            defaultDescription: import("typebox").TOptional<import("typebox").TString>;
            contentOverrides: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TString>>;
        }>>;
    }>>;
    notifications: import("typebox").TOptional<import("typebox").TObject<{
        achievements: import("typebox").TOptional<import("typebox").TBoolean>;
        dailyChallenges: import("typebox").TOptional<import("typebox").TBoolean>;
        jobAlerts: import("typebox").TOptional<import("typebox").TBoolean>;
        levelUp: import("typebox").TOptional<import("typebox").TBoolean>;
    }>>;
    automationSettings: import("typebox").TOptional<import("typebox").TObject<{
        headless: import("typebox").TOptional<import("typebox").TBoolean>;
        defaultTimeout: import("typebox").TOptional<import("typebox").TNumber>;
        screenshotRetention: import("typebox").TOptional<import("typebox").TNumber>;
        maxConcurrentRuns: import("typebox").TOptional<import("typebox").TNumber>;
        defaultBrowser: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"chrome">, import("typebox").TLiteral<"chromium">, import("typebox").TLiteral<"edge">]>>;
        enableSmartSelectors: import("typebox").TOptional<import("typebox").TBoolean>;
        autoSaveScreenshots: import("typebox").TOptional<import("typebox").TBoolean>;
        speech: import("typebox").TOptional<import("typebox").TObject<{
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
        }>>;
        jobProviders: import("typebox").TOptional<import("typebox").TObject<{
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
        }>>;
    }>>;
    emailTransportSettings: import("typebox").TOptional<import("typebox").TObject<{
        host: import("typebox").TOptional<import("typebox").TString>;
        port: import("typebox").TOptional<import("typebox").TNumber>;
        security: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"tls">, import("typebox").TLiteral<"starttls">, import("typebox").TLiteral<"plain">]>>;
        username: import("typebox").TOptional<import("typebox").TString>;
        fromEmail: import("typebox").TOptional<import("typebox").TString>;
        fromName: import("typebox").TOptional<import("typebox").TString>;
        authMethod: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"plain">, import("typebox").TLiteral<"login">]>>;
        connectionTimeoutSeconds: import("typebox").TOptional<import("typebox").TNumber>;
    }>>;
}>;
export type SettingsUpdateBody = Static<typeof settingsUpdateBodySchema>;
export declare const apiKeysUpdateBodySchema: import("typebox").TObject<{
    geminiApiKey: import("typebox").TOptional<import("typebox").TString>;
    openaiApiKey: import("typebox").TOptional<import("typebox").TString>;
    claudeApiKey: import("typebox").TOptional<import("typebox").TString>;
    huggingfaceToken: import("typebox").TOptional<import("typebox").TString>;
    localModelEndpoint: import("typebox").TOptional<import("typebox").TString>;
    localModelName: import("typebox").TOptional<import("typebox").TString>;
    emailTransportPassword: import("typebox").TOptional<import("typebox").TString>;
}>;
export type ApiKeysUpdateBody = Static<typeof apiKeysUpdateBodySchema>;
export declare const providerTestBodySchema: import("typebox").TObject<{
    provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
    key: import("typebox").TString;
    model: import("typebox").TOptional<import("typebox").TString>;
}>;
export type ProviderTestBody = Static<typeof providerTestBodySchema>;
export declare const jobTaxonomyUpdateBodySchema: import("typebox").TObject<{
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
export type JobTaxonomyUpdateBody = Static<typeof jobTaxonomyUpdateBodySchema>;
export declare const importSettingsBodySchema: import("typebox").TObject<{
    version: import("typebox").TLiteral<"1.0">;
    exportedAt: import("typebox").TString;
    profile: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>, import("typebox").TNull]>;
    settings: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>, import("typebox").TNull]>;
    resumes: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
    coverLetters: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
    portfolio: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>, import("typebox").TNull]>;
    portfolioProjects: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
    interviewSessions: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
    gamification: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>, import("typebox").TNull]>;
    applications: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
    chatHistory: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
    savedJobs: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
    skillMappings: import("typebox").TArray<import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>>;
}>;
export type ImportSettingsBody = Static<typeof importSettingsBodySchema>;
export declare const settingsResponseSchema: import("typebox").TObject<{
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
export type SettingsResponse = Static<typeof settingsResponseSchema>;
export declare const settingsMutationResponseSchema: import("typebox").TObject<{
    success: import("typebox").TBoolean;
}>;
export declare const jobTaxonomyUpdateResponseSchema: import("typebox").TObject<{
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
export declare const providerTestResponseSchema: import("typebox").TObject<{
    valid: import("typebox").TBoolean;
    provider: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
    diagnosticCode: import("typebox").TOptional<import("typebox").TString>;
    message: import("typebox").TOptional<import("typebox").TString>;
    availableModels: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    selectedModel: import("typebox").TOptional<import("typebox").TString>;
    error: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const settingsExportResponseSchema: import("typebox").TObject<{
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
export declare const settingsImportResponseSchema: import("typebox").TObject<{
    imported: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
    skipped: import("typebox").TRecord<"^.*$", import("typebox").TNumber>;
    errors: import("typebox").TArray<import("typebox").TString>;
}>;
export declare const settingsReadResponses: {
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
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const settingsUpdateResponses: {
    readonly 200: import("typebox").TObject<{
        success: import("typebox").TBoolean;
    }>;
    readonly 422: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const jobTaxonomyUpdateResponses: {
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
export declare const apiKeysUpdateResponses: {
    readonly 200: import("typebox").TObject<{
        success: import("typebox").TBoolean;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>;
};
export declare const providerTestResponses: {
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
export declare const settingsExportResponses: {
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
export declare const settingsImportResponses: {
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
