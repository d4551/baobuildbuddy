import type { AIProviderType } from "@bao/shared/types/ai";
export declare const VALID_PROVIDERS: [AIProviderType, ...AIProviderType[]];
export declare const resolveKnownProvider: (value?: string | null) => AIProviderType;
export declare const preferredProviderBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">, import("typebox").TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">]>;
export declare const aiRoutingBodySchema: import("typebox").TObject<{
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
export declare const brandSettingsPatchBodySchema: import("typebox").TObject<{
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
}>;
export declare const languageBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"en-US">, import("typebox").TLiteral<"es-ES">, import("typebox").TLiteral<"fr-FR">, import("typebox").TLiteral<"ja-JP">]>;
export declare const browserBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"chrome">, import("typebox").TLiteral<"chromium">, import("typebox").TLiteral<"edge">]>;
export declare const emailTransportSecurityBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"tls">, import("typebox").TLiteral<"starttls">, import("typebox").TLiteral<"plain">]>;
export declare const emailTransportAuthModeBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"plain">, import("typebox").TLiteral<"login">]>;
