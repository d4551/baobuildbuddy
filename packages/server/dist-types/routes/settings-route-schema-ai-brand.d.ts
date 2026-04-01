import type { AIProviderType } from "@bao/shared/types/ai";
import Type from "baobox";
export declare const VALID_PROVIDERS: [AIProviderType, ...AIProviderType[]];
export declare const resolveKnownProvider: (value?: string | null) => AIProviderType;
export declare const preferredProviderBodySchema: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
export declare const aiRoutingBodySchema: Type.TObject<{
    readonly chat: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly interviewQuestions: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly interviewFeedback: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly resume: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly coverLetter: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly emailResponse: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly jobMatch: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly scrapeEnrichment: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
    readonly automationFieldMapping: Type.TObject<{
        readonly provider: Type.TUnion<Type.TLiteral<"openai" | "huggingface" | "local" | "gemini" | "claude">[]>;
        readonly model: Type.TOptional<Type.TString>;
    }, "provider", "model">;
}, "chat" | "interviewQuestions" | "interviewFeedback" | "resume" | "coverLetter" | "emailResponse" | "jobMatch" | "scrapeEnrichment" | "automationFieldMapping", never>;
export declare const brandSettingsPatchBodySchema: Type.TPartial<Type.TObject<{
    readonly name: Type.TString;
    readonly assistantName: Type.TString;
    readonly apiName: Type.TString;
    readonly logoPath: Type.TString;
    readonly faviconPath: Type.TString;
    readonly typography: Type.TPartial<Type.TObject<{
        readonly fontStylesheetUrl: Type.TString;
        readonly displayFontFamily: Type.TString;
        readonly bodyFontFamily: Type.TString;
        readonly monoFontFamily: Type.TString;
    }, "fontStylesheetUrl" | "displayFontFamily" | "bodyFontFamily" | "monoFontFamily", never>>;
    readonly lightTheme: Type.TPartial<Type.TObject<{
        readonly base100: Type.TString;
        readonly base200: Type.TString;
        readonly base300: Type.TString;
        readonly baseContent: Type.TString;
        readonly primary: Type.TString;
        readonly primaryContent: Type.TString;
        readonly secondary: Type.TString;
        readonly secondaryContent: Type.TString;
        readonly accent: Type.TString;
        readonly accentContent: Type.TString;
        readonly neutral: Type.TString;
        readonly neutralContent: Type.TString;
        readonly info: Type.TString;
        readonly infoContent: Type.TString;
        readonly success: Type.TString;
        readonly successContent: Type.TString;
        readonly warning: Type.TString;
        readonly warningContent: Type.TString;
        readonly error: Type.TString;
        readonly errorContent: Type.TString;
        readonly radiusSelector: Type.TString;
        readonly radiusField: Type.TString;
        readonly radiusBox: Type.TString;
        readonly sizeSelector: Type.TString;
        readonly sizeField: Type.TString;
        readonly border: Type.TString;
        readonly depth: Type.TString;
        readonly noise: Type.TString;
    }, "error" | "success" | "base100" | "base200" | "base300" | "baseContent" | "primary" | "primaryContent" | "secondary" | "secondaryContent" | "accent" | "accentContent" | "neutral" | "neutralContent" | "info" | "infoContent" | "successContent" | "warning" | "warningContent" | "errorContent" | "radiusSelector" | "radiusField" | "radiusBox" | "sizeSelector" | "sizeField" | "border" | "depth" | "noise", never>>;
    readonly darkTheme: Type.TPartial<Type.TObject<{
        readonly base100: Type.TString;
        readonly base200: Type.TString;
        readonly base300: Type.TString;
        readonly baseContent: Type.TString;
        readonly primary: Type.TString;
        readonly primaryContent: Type.TString;
        readonly secondary: Type.TString;
        readonly secondaryContent: Type.TString;
        readonly accent: Type.TString;
        readonly accentContent: Type.TString;
        readonly neutral: Type.TString;
        readonly neutralContent: Type.TString;
        readonly info: Type.TString;
        readonly infoContent: Type.TString;
        readonly success: Type.TString;
        readonly successContent: Type.TString;
        readonly warning: Type.TString;
        readonly warningContent: Type.TString;
        readonly error: Type.TString;
        readonly errorContent: Type.TString;
        readonly radiusSelector: Type.TString;
        readonly radiusField: Type.TString;
        readonly radiusBox: Type.TString;
        readonly sizeSelector: Type.TString;
        readonly sizeField: Type.TString;
        readonly border: Type.TString;
        readonly depth: Type.TString;
        readonly noise: Type.TString;
    }, "error" | "success" | "base100" | "base200" | "base300" | "baseContent" | "primary" | "primaryContent" | "secondary" | "secondaryContent" | "accent" | "accentContent" | "neutral" | "neutralContent" | "info" | "infoContent" | "successContent" | "warning" | "warningContent" | "errorContent" | "radiusSelector" | "radiusField" | "radiusBox" | "sizeSelector" | "sizeField" | "border" | "depth" | "noise", never>>;
    readonly content: Type.TPartial<Type.TObject<{
        readonly tagline: Type.TString;
        readonly defaultTitle: Type.TString;
        readonly defaultDescription: Type.TString;
        readonly contentOverrides: Type.TRecord<Type.TString, Type.TString>;
    }, "tagline" | "defaultTitle" | "defaultDescription" | "contentOverrides", never>>;
}, "name" | "assistantName" | "apiName" | "logoPath" | "faviconPath" | "typography" | "lightTheme" | "darkTheme" | "content", never>>;
export declare const languageBodySchema: Type.TUnion<(Type.TLiteral<"en-US"> | Type.TLiteral<"es-ES"> | Type.TLiteral<"fr-FR"> | Type.TLiteral<"ja-JP">)[]>;
export declare const browserBodySchema: Type.TUnion<(Type.TLiteral<"chrome"> | Type.TLiteral<"chromium"> | Type.TLiteral<"edge">)[]>;
export declare const emailTransportSecurityBodySchema: Type.TUnion<(Type.TLiteral<"tls"> | Type.TLiteral<"starttls"> | Type.TLiteral<"plain">)[]>;
export declare const emailTransportAuthModeBodySchema: Type.TUnion<(Type.TLiteral<"plain"> | Type.TLiteral<"login">)[]>;
