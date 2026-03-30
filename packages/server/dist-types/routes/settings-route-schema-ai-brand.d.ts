import type { AIProviderType } from "@bao/shared";
export declare const VALID_PROVIDERS: [AIProviderType, ...AIProviderType[]];
export declare const resolveKnownProvider: (value?: string | null) => AIProviderType;
export declare const preferredProviderBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">, import("@sinclair/typebox").TLiteral<"gemini" | "claude" | "openai" | "huggingface" | "local">]>;
export declare const aiRoutingBodySchema: import("@sinclair/typebox").TObject<{
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
}>;
export declare const brandSettingsPatchBodySchema: import("@sinclair/typebox").TObject<{
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
}>;
export declare const languageBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"en-US">, import("@sinclair/typebox").TLiteral<"es-ES">, import("@sinclair/typebox").TLiteral<"fr-FR">, import("@sinclair/typebox").TLiteral<"ja-JP">]>;
export declare const browserBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"chrome">, import("@sinclair/typebox").TLiteral<"chromium">, import("@sinclair/typebox").TLiteral<"edge">]>;
export declare const emailTransportSecurityBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"tls">, import("@sinclair/typebox").TLiteral<"starttls">, import("@sinclair/typebox").TLiteral<"plain">]>;
export declare const emailTransportAuthModeBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"plain">, import("@sinclair/typebox").TLiteral<"login">]>;
