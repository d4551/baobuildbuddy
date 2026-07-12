import Type, { type StaticParse } from "baobox";
import { resolveKnownProvider as resolveKnownProviderValue } from "./settings-route-schema-ai-brand";
export declare const preferredProviderBodySchema: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
export declare const resolveKnownProvider: typeof resolveKnownProviderValue;
export declare const settingsUpdateBodySchema: Type.TObject<{
    readonly aiRouting: Type.TOptional<Type.TObject<{
        readonly chat: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly interviewQuestions: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly interviewFeedback: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly resume: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly coverLetter: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly emailResponse: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly jobMatch: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly scrapeEnrichment: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly automationFieldMapping: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
    }, "automationFieldMapping" | "chat" | "coverLetter" | "emailResponse" | "interviewFeedback" | "interviewQuestions" | "jobMatch" | "resume" | "scrapeEnrichment", never>>;
    readonly preferredProvider: Type.TOptional<Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>>;
    readonly preferredModel: Type.TOptional<Type.TString>;
    readonly theme: Type.TOptional<Type.TUnion<(Type.TLiteral<"bao-dark"> | Type.TLiteral<"bao-light"> | Type.TLiteral<"business"> | Type.TLiteral<"corporate">)[]>>;
    readonly language: Type.TOptional<Type.TUnion<(Type.TLiteral<"en-US"> | Type.TLiteral<"es-ES"> | Type.TLiteral<"fr-FR"> | Type.TLiteral<"ja-JP">)[]>>;
    readonly brandSettings: Type.TOptional<Type.TPartial<Type.TObject<{
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
        }, "bodyFontFamily" | "displayFontFamily" | "fontStylesheetUrl" | "monoFontFamily", never>>;
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
        }, "accent" | "accentContent" | "base100" | "base200" | "base300" | "baseContent" | "border" | "depth" | "error" | "errorContent" | "info" | "infoContent" | "neutral" | "neutralContent" | "noise" | "primary" | "primaryContent" | "radiusBox" | "radiusField" | "radiusSelector" | "secondary" | "secondaryContent" | "sizeField" | "sizeSelector" | "success" | "successContent" | "warning" | "warningContent", never>>;
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
        }, "accent" | "accentContent" | "base100" | "base200" | "base300" | "baseContent" | "border" | "depth" | "error" | "errorContent" | "info" | "infoContent" | "neutral" | "neutralContent" | "noise" | "primary" | "primaryContent" | "radiusBox" | "radiusField" | "radiusSelector" | "secondary" | "secondaryContent" | "sizeField" | "sizeSelector" | "success" | "successContent" | "warning" | "warningContent", never>>;
        readonly content: Type.TPartial<Type.TObject<{
            readonly tagline: Type.TString;
            readonly defaultTitle: Type.TString;
            readonly defaultDescription: Type.TString;
            readonly contentOverrides: Type.TRecord<Type.TString, Type.TString>;
        }, "contentOverrides" | "defaultDescription" | "defaultTitle" | "tagline", never>>;
    }, "apiName" | "assistantName" | "content" | "darkTheme" | "faviconPath" | "lightTheme" | "logoPath" | "name" | "typography", never>>>;
    readonly notifications: Type.TOptional<Type.TObject<{
        readonly achievements: Type.TOptional<Type.TBoolean>;
        readonly dailyChallenges: Type.TOptional<Type.TBoolean>;
        readonly jobAlerts: Type.TOptional<Type.TBoolean>;
        readonly levelUp: Type.TOptional<Type.TBoolean>;
    }, never, Type.InferOptionalKeys<{
        readonly achievements: Type.TOptional<Type.TBoolean>;
        readonly dailyChallenges: Type.TOptional<Type.TBoolean>;
        readonly jobAlerts: Type.TOptional<Type.TBoolean>;
        readonly levelUp: Type.TOptional<Type.TBoolean>;
    }>>>;
    readonly automationSettings: Type.TOptional<Type.TObject<{
        readonly headless: Type.TOptional<Type.TBoolean>;
        readonly defaultTimeout: Type.TOptional<Type.TNumber>;
        readonly screenshotRetention: Type.TOptional<Type.TNumber>;
        readonly maxConcurrentRuns: Type.TOptional<Type.TNumber>;
        readonly defaultBrowser: Type.TOptional<Type.TUnion<(Type.TLiteral<"chrome"> | Type.TLiteral<"chromium"> | Type.TLiteral<"edge">)[]>>;
        readonly enableSmartSelectors: Type.TOptional<Type.TBoolean>;
        readonly autoSaveScreenshots: Type.TOptional<Type.TBoolean>;
        readonly speech: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly locale: Type.TString;
            readonly stt: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
            }, "endpoint" | "model" | "provider", never>>;
            readonly tts: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
                voice: Type.TString;
                format: Type.TUnion<(Type.TLiteral<"mp3"> | Type.TLiteral<"wav">)[]>;
            }, "endpoint" | "format" | "model" | "provider" | "voice", never>>;
        }, "locale" | "stt" | "tts", never>>>;
        readonly jobProviders: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly providerTimeoutMs: Type.TNumber;
            readonly companyBoardResultLimit: Type.TNumber;
            readonly gamingBoardResultLimit: Type.TNumber;
            readonly unknownLocationLabel: Type.TString;
            readonly unknownCompanyLabel: Type.TString;
            readonly hitmarkerEnabled: Type.TBoolean;
            readonly hitmarkerApiBaseUrl: Type.TString;
            readonly hitmarkerDefaultQuery: Type.TString;
            readonly hitmarkerDefaultLocation: Type.TString;
            readonly greenhouseApiBaseUrl: Type.TString;
            readonly greenhouseMaxPages: Type.TNumber;
            readonly greenhouseBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly board: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "board" | "company" | "enabled", never>>>;
            readonly leverApiBaseUrl: Type.TString;
            readonly leverMaxPages: Type.TNumber;
            readonly leverCompanies: Type.TArray<Type.TRequired<Type.TObject<{
                readonly slug: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "company" | "enabled" | "slug", never>>>;
            readonly companyBoardApiTemplates: Type.TRequired<Type.TObject<{
                readonly greenhouse: Type.TString;
                readonly lever: Type.TString;
                readonly recruitee: Type.TString;
                readonly workable: Type.TString;
                readonly ashby: Type.TString;
                readonly smartrecruiters: Type.TString;
                readonly teamtailor: Type.TString;
                readonly workday: Type.TString;
            }, "ashby" | "greenhouse" | "lever" | "recruitee" | "smartrecruiters" | "teamtailor" | "workable" | "workday", never>>;
            readonly companyBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly name: Type.TString;
                readonly token: Type.TString;
                readonly type: Type.TUnion<(Type.TLiteral<"ashby"> | Type.TLiteral<"greenhouse"> | Type.TLiteral<"lever"> | Type.TLiteral<"recruitee"> | Type.TLiteral<"smartrecruiters"> | Type.TLiteral<"teamtailor"> | Type.TLiteral<"workable"> | Type.TLiteral<"workday">)[]>;
                readonly enabled: Type.TBoolean;
                readonly priority: Type.TNumber;
            }, "enabled" | "name" | "priority" | "token" | "type", never>>>;
            readonly gamingPortals: Type.TArray<Type.TRequired<Type.TObject<{
                readonly id: Type.TUnion<(Type.TLiteral<"gamesjobsdirect"> | Type.TLiteral<"grackle"> | Type.TLiteral<"hitmarker"> | Type.TLiteral<"pocketgamer"> | Type.TLiteral<"remotegamejobs"> | Type.TLiteral<"workwithindies">)[]>;
                readonly name: Type.TString;
                readonly source: Type.TString;
                readonly fallbackUrl: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "enabled" | "fallbackUrl" | "id" | "name" | "source", never>>>;
        }, "companyBoardApiTemplates" | "companyBoardResultLimit" | "companyBoards" | "gamingBoardResultLimit" | "gamingPortals" | "greenhouseApiBaseUrl" | "greenhouseBoards" | "greenhouseMaxPages" | "hitmarkerApiBaseUrl" | "hitmarkerDefaultLocation" | "hitmarkerDefaultQuery" | "hitmarkerEnabled" | "leverApiBaseUrl" | "leverCompanies" | "leverMaxPages" | "providerTimeoutMs" | "unknownCompanyLabel" | "unknownLocationLabel", never>>>;
    }, never, Type.InferOptionalKeys<{
        readonly headless: Type.TOptional<Type.TBoolean>;
        readonly defaultTimeout: Type.TOptional<Type.TNumber>;
        readonly screenshotRetention: Type.TOptional<Type.TNumber>;
        readonly maxConcurrentRuns: Type.TOptional<Type.TNumber>;
        readonly defaultBrowser: Type.TOptional<Type.TUnion<(Type.TLiteral<"chrome"> | Type.TLiteral<"chromium"> | Type.TLiteral<"edge">)[]>>;
        readonly enableSmartSelectors: Type.TOptional<Type.TBoolean>;
        readonly autoSaveScreenshots: Type.TOptional<Type.TBoolean>;
        readonly speech: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly locale: Type.TString;
            readonly stt: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
            }, "endpoint" | "model" | "provider", never>>;
            readonly tts: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
                voice: Type.TString;
                format: Type.TUnion<(Type.TLiteral<"mp3"> | Type.TLiteral<"wav">)[]>;
            }, "endpoint" | "format" | "model" | "provider" | "voice", never>>;
        }, "locale" | "stt" | "tts", never>>>;
        readonly jobProviders: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly providerTimeoutMs: Type.TNumber;
            readonly companyBoardResultLimit: Type.TNumber;
            readonly gamingBoardResultLimit: Type.TNumber;
            readonly unknownLocationLabel: Type.TString;
            readonly unknownCompanyLabel: Type.TString;
            readonly hitmarkerEnabled: Type.TBoolean;
            readonly hitmarkerApiBaseUrl: Type.TString;
            readonly hitmarkerDefaultQuery: Type.TString;
            readonly hitmarkerDefaultLocation: Type.TString;
            readonly greenhouseApiBaseUrl: Type.TString;
            readonly greenhouseMaxPages: Type.TNumber;
            readonly greenhouseBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly board: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "board" | "company" | "enabled", never>>>;
            readonly leverApiBaseUrl: Type.TString;
            readonly leverMaxPages: Type.TNumber;
            readonly leverCompanies: Type.TArray<Type.TRequired<Type.TObject<{
                readonly slug: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "company" | "enabled" | "slug", never>>>;
            readonly companyBoardApiTemplates: Type.TRequired<Type.TObject<{
                readonly greenhouse: Type.TString;
                readonly lever: Type.TString;
                readonly recruitee: Type.TString;
                readonly workable: Type.TString;
                readonly ashby: Type.TString;
                readonly smartrecruiters: Type.TString;
                readonly teamtailor: Type.TString;
                readonly workday: Type.TString;
            }, "ashby" | "greenhouse" | "lever" | "recruitee" | "smartrecruiters" | "teamtailor" | "workable" | "workday", never>>;
            readonly companyBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly name: Type.TString;
                readonly token: Type.TString;
                readonly type: Type.TUnion<(Type.TLiteral<"ashby"> | Type.TLiteral<"greenhouse"> | Type.TLiteral<"lever"> | Type.TLiteral<"recruitee"> | Type.TLiteral<"smartrecruiters"> | Type.TLiteral<"teamtailor"> | Type.TLiteral<"workable"> | Type.TLiteral<"workday">)[]>;
                readonly enabled: Type.TBoolean;
                readonly priority: Type.TNumber;
            }, "enabled" | "name" | "priority" | "token" | "type", never>>>;
            readonly gamingPortals: Type.TArray<Type.TRequired<Type.TObject<{
                readonly id: Type.TUnion<(Type.TLiteral<"gamesjobsdirect"> | Type.TLiteral<"grackle"> | Type.TLiteral<"hitmarker"> | Type.TLiteral<"pocketgamer"> | Type.TLiteral<"remotegamejobs"> | Type.TLiteral<"workwithindies">)[]>;
                readonly name: Type.TString;
                readonly source: Type.TString;
                readonly fallbackUrl: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "enabled" | "fallbackUrl" | "id" | "name" | "source", never>>>;
        }, "companyBoardApiTemplates" | "companyBoardResultLimit" | "companyBoards" | "gamingBoardResultLimit" | "gamingPortals" | "greenhouseApiBaseUrl" | "greenhouseBoards" | "greenhouseMaxPages" | "hitmarkerApiBaseUrl" | "hitmarkerDefaultLocation" | "hitmarkerDefaultQuery" | "hitmarkerEnabled" | "leverApiBaseUrl" | "leverCompanies" | "leverMaxPages" | "providerTimeoutMs" | "unknownCompanyLabel" | "unknownLocationLabel", never>>>;
    }>>>;
    readonly emailTransportSettings: Type.TOptional<Type.TObject<{
        readonly host: Type.TOptional<Type.TString>;
        readonly port: Type.TOptional<Type.TNumber>;
        readonly security: Type.TOptional<Type.TUnion<(Type.TLiteral<"plain"> | Type.TLiteral<"starttls"> | Type.TLiteral<"tls">)[]>>;
        readonly username: Type.TOptional<Type.TString>;
        readonly fromEmail: Type.TOptional<Type.TString>;
        readonly fromName: Type.TOptional<Type.TString>;
        readonly authMethod: Type.TOptional<Type.TUnion<(Type.TLiteral<"login"> | Type.TLiteral<"plain">)[]>>;
        readonly connectionTimeoutSeconds: Type.TOptional<Type.TNumber>;
    }, never, Type.InferOptionalKeys<{
        readonly host: Type.TOptional<Type.TString>;
        readonly port: Type.TOptional<Type.TNumber>;
        readonly security: Type.TOptional<Type.TUnion<(Type.TLiteral<"plain"> | Type.TLiteral<"starttls"> | Type.TLiteral<"tls">)[]>>;
        readonly username: Type.TOptional<Type.TString>;
        readonly fromEmail: Type.TOptional<Type.TString>;
        readonly fromName: Type.TOptional<Type.TString>;
        readonly authMethod: Type.TOptional<Type.TUnion<(Type.TLiteral<"login"> | Type.TLiteral<"plain">)[]>>;
        readonly connectionTimeoutSeconds: Type.TOptional<Type.TNumber>;
    }>>>;
}, never, Type.InferOptionalKeys<{
    readonly aiRouting: Type.TOptional<Type.TObject<{
        readonly chat: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly interviewQuestions: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly interviewFeedback: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly resume: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly coverLetter: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly emailResponse: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly jobMatch: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly scrapeEnrichment: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
        readonly automationFieldMapping: Type.TObject<{
            readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
            readonly model: Type.TOptional<Type.TString>;
        }, "provider", "model">;
    }, "automationFieldMapping" | "chat" | "coverLetter" | "emailResponse" | "interviewFeedback" | "interviewQuestions" | "jobMatch" | "resume" | "scrapeEnrichment", never>>;
    readonly preferredProvider: Type.TOptional<Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>>;
    readonly preferredModel: Type.TOptional<Type.TString>;
    readonly theme: Type.TOptional<Type.TUnion<(Type.TLiteral<"bao-dark"> | Type.TLiteral<"bao-light"> | Type.TLiteral<"business"> | Type.TLiteral<"corporate">)[]>>;
    readonly language: Type.TOptional<Type.TUnion<(Type.TLiteral<"en-US"> | Type.TLiteral<"es-ES"> | Type.TLiteral<"fr-FR"> | Type.TLiteral<"ja-JP">)[]>>;
    readonly brandSettings: Type.TOptional<Type.TPartial<Type.TObject<{
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
        }, "bodyFontFamily" | "displayFontFamily" | "fontStylesheetUrl" | "monoFontFamily", never>>;
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
        }, "accent" | "accentContent" | "base100" | "base200" | "base300" | "baseContent" | "border" | "depth" | "error" | "errorContent" | "info" | "infoContent" | "neutral" | "neutralContent" | "noise" | "primary" | "primaryContent" | "radiusBox" | "radiusField" | "radiusSelector" | "secondary" | "secondaryContent" | "sizeField" | "sizeSelector" | "success" | "successContent" | "warning" | "warningContent", never>>;
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
        }, "accent" | "accentContent" | "base100" | "base200" | "base300" | "baseContent" | "border" | "depth" | "error" | "errorContent" | "info" | "infoContent" | "neutral" | "neutralContent" | "noise" | "primary" | "primaryContent" | "radiusBox" | "radiusField" | "radiusSelector" | "secondary" | "secondaryContent" | "sizeField" | "sizeSelector" | "success" | "successContent" | "warning" | "warningContent", never>>;
        readonly content: Type.TPartial<Type.TObject<{
            readonly tagline: Type.TString;
            readonly defaultTitle: Type.TString;
            readonly defaultDescription: Type.TString;
            readonly contentOverrides: Type.TRecord<Type.TString, Type.TString>;
        }, "contentOverrides" | "defaultDescription" | "defaultTitle" | "tagline", never>>;
    }, "apiName" | "assistantName" | "content" | "darkTheme" | "faviconPath" | "lightTheme" | "logoPath" | "name" | "typography", never>>>;
    readonly notifications: Type.TOptional<Type.TObject<{
        readonly achievements: Type.TOptional<Type.TBoolean>;
        readonly dailyChallenges: Type.TOptional<Type.TBoolean>;
        readonly jobAlerts: Type.TOptional<Type.TBoolean>;
        readonly levelUp: Type.TOptional<Type.TBoolean>;
    }, never, Type.InferOptionalKeys<{
        readonly achievements: Type.TOptional<Type.TBoolean>;
        readonly dailyChallenges: Type.TOptional<Type.TBoolean>;
        readonly jobAlerts: Type.TOptional<Type.TBoolean>;
        readonly levelUp: Type.TOptional<Type.TBoolean>;
    }>>>;
    readonly automationSettings: Type.TOptional<Type.TObject<{
        readonly headless: Type.TOptional<Type.TBoolean>;
        readonly defaultTimeout: Type.TOptional<Type.TNumber>;
        readonly screenshotRetention: Type.TOptional<Type.TNumber>;
        readonly maxConcurrentRuns: Type.TOptional<Type.TNumber>;
        readonly defaultBrowser: Type.TOptional<Type.TUnion<(Type.TLiteral<"chrome"> | Type.TLiteral<"chromium"> | Type.TLiteral<"edge">)[]>>;
        readonly enableSmartSelectors: Type.TOptional<Type.TBoolean>;
        readonly autoSaveScreenshots: Type.TOptional<Type.TBoolean>;
        readonly speech: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly locale: Type.TString;
            readonly stt: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
            }, "endpoint" | "model" | "provider", never>>;
            readonly tts: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
                voice: Type.TString;
                format: Type.TUnion<(Type.TLiteral<"mp3"> | Type.TLiteral<"wav">)[]>;
            }, "endpoint" | "format" | "model" | "provider" | "voice", never>>;
        }, "locale" | "stt" | "tts", never>>>;
        readonly jobProviders: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly providerTimeoutMs: Type.TNumber;
            readonly companyBoardResultLimit: Type.TNumber;
            readonly gamingBoardResultLimit: Type.TNumber;
            readonly unknownLocationLabel: Type.TString;
            readonly unknownCompanyLabel: Type.TString;
            readonly hitmarkerEnabled: Type.TBoolean;
            readonly hitmarkerApiBaseUrl: Type.TString;
            readonly hitmarkerDefaultQuery: Type.TString;
            readonly hitmarkerDefaultLocation: Type.TString;
            readonly greenhouseApiBaseUrl: Type.TString;
            readonly greenhouseMaxPages: Type.TNumber;
            readonly greenhouseBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly board: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "board" | "company" | "enabled", never>>>;
            readonly leverApiBaseUrl: Type.TString;
            readonly leverMaxPages: Type.TNumber;
            readonly leverCompanies: Type.TArray<Type.TRequired<Type.TObject<{
                readonly slug: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "company" | "enabled" | "slug", never>>>;
            readonly companyBoardApiTemplates: Type.TRequired<Type.TObject<{
                readonly greenhouse: Type.TString;
                readonly lever: Type.TString;
                readonly recruitee: Type.TString;
                readonly workable: Type.TString;
                readonly ashby: Type.TString;
                readonly smartrecruiters: Type.TString;
                readonly teamtailor: Type.TString;
                readonly workday: Type.TString;
            }, "ashby" | "greenhouse" | "lever" | "recruitee" | "smartrecruiters" | "teamtailor" | "workable" | "workday", never>>;
            readonly companyBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly name: Type.TString;
                readonly token: Type.TString;
                readonly type: Type.TUnion<(Type.TLiteral<"ashby"> | Type.TLiteral<"greenhouse"> | Type.TLiteral<"lever"> | Type.TLiteral<"recruitee"> | Type.TLiteral<"smartrecruiters"> | Type.TLiteral<"teamtailor"> | Type.TLiteral<"workable"> | Type.TLiteral<"workday">)[]>;
                readonly enabled: Type.TBoolean;
                readonly priority: Type.TNumber;
            }, "enabled" | "name" | "priority" | "token" | "type", never>>>;
            readonly gamingPortals: Type.TArray<Type.TRequired<Type.TObject<{
                readonly id: Type.TUnion<(Type.TLiteral<"gamesjobsdirect"> | Type.TLiteral<"grackle"> | Type.TLiteral<"hitmarker"> | Type.TLiteral<"pocketgamer"> | Type.TLiteral<"remotegamejobs"> | Type.TLiteral<"workwithindies">)[]>;
                readonly name: Type.TString;
                readonly source: Type.TString;
                readonly fallbackUrl: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "enabled" | "fallbackUrl" | "id" | "name" | "source", never>>>;
        }, "companyBoardApiTemplates" | "companyBoardResultLimit" | "companyBoards" | "gamingBoardResultLimit" | "gamingPortals" | "greenhouseApiBaseUrl" | "greenhouseBoards" | "greenhouseMaxPages" | "hitmarkerApiBaseUrl" | "hitmarkerDefaultLocation" | "hitmarkerDefaultQuery" | "hitmarkerEnabled" | "leverApiBaseUrl" | "leverCompanies" | "leverMaxPages" | "providerTimeoutMs" | "unknownCompanyLabel" | "unknownLocationLabel", never>>>;
    }, never, Type.InferOptionalKeys<{
        readonly headless: Type.TOptional<Type.TBoolean>;
        readonly defaultTimeout: Type.TOptional<Type.TNumber>;
        readonly screenshotRetention: Type.TOptional<Type.TNumber>;
        readonly maxConcurrentRuns: Type.TOptional<Type.TNumber>;
        readonly defaultBrowser: Type.TOptional<Type.TUnion<(Type.TLiteral<"chrome"> | Type.TLiteral<"chromium"> | Type.TLiteral<"edge">)[]>>;
        readonly enableSmartSelectors: Type.TOptional<Type.TBoolean>;
        readonly autoSaveScreenshots: Type.TOptional<Type.TBoolean>;
        readonly speech: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly locale: Type.TString;
            readonly stt: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
            }, "endpoint" | "model" | "provider", never>>;
            readonly tts: Type.TRequired<Type.TObject<{
                provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"custom"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"openai">)[]>;
                model: Type.TString;
                endpoint: Type.TString;
                voice: Type.TString;
                format: Type.TUnion<(Type.TLiteral<"mp3"> | Type.TLiteral<"wav">)[]>;
            }, "endpoint" | "format" | "model" | "provider" | "voice", never>>;
        }, "locale" | "stt" | "tts", never>>>;
        readonly jobProviders: Type.TOptional<Type.TRequired<Type.TObject<{
            readonly providerTimeoutMs: Type.TNumber;
            readonly companyBoardResultLimit: Type.TNumber;
            readonly gamingBoardResultLimit: Type.TNumber;
            readonly unknownLocationLabel: Type.TString;
            readonly unknownCompanyLabel: Type.TString;
            readonly hitmarkerEnabled: Type.TBoolean;
            readonly hitmarkerApiBaseUrl: Type.TString;
            readonly hitmarkerDefaultQuery: Type.TString;
            readonly hitmarkerDefaultLocation: Type.TString;
            readonly greenhouseApiBaseUrl: Type.TString;
            readonly greenhouseMaxPages: Type.TNumber;
            readonly greenhouseBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly board: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "board" | "company" | "enabled", never>>>;
            readonly leverApiBaseUrl: Type.TString;
            readonly leverMaxPages: Type.TNumber;
            readonly leverCompanies: Type.TArray<Type.TRequired<Type.TObject<{
                readonly slug: Type.TString;
                readonly company: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "company" | "enabled" | "slug", never>>>;
            readonly companyBoardApiTemplates: Type.TRequired<Type.TObject<{
                readonly greenhouse: Type.TString;
                readonly lever: Type.TString;
                readonly recruitee: Type.TString;
                readonly workable: Type.TString;
                readonly ashby: Type.TString;
                readonly smartrecruiters: Type.TString;
                readonly teamtailor: Type.TString;
                readonly workday: Type.TString;
            }, "ashby" | "greenhouse" | "lever" | "recruitee" | "smartrecruiters" | "teamtailor" | "workable" | "workday", never>>;
            readonly companyBoards: Type.TArray<Type.TRequired<Type.TObject<{
                readonly name: Type.TString;
                readonly token: Type.TString;
                readonly type: Type.TUnion<(Type.TLiteral<"ashby"> | Type.TLiteral<"greenhouse"> | Type.TLiteral<"lever"> | Type.TLiteral<"recruitee"> | Type.TLiteral<"smartrecruiters"> | Type.TLiteral<"teamtailor"> | Type.TLiteral<"workable"> | Type.TLiteral<"workday">)[]>;
                readonly enabled: Type.TBoolean;
                readonly priority: Type.TNumber;
            }, "enabled" | "name" | "priority" | "token" | "type", never>>>;
            readonly gamingPortals: Type.TArray<Type.TRequired<Type.TObject<{
                readonly id: Type.TUnion<(Type.TLiteral<"gamesjobsdirect"> | Type.TLiteral<"grackle"> | Type.TLiteral<"hitmarker"> | Type.TLiteral<"pocketgamer"> | Type.TLiteral<"remotegamejobs"> | Type.TLiteral<"workwithindies">)[]>;
                readonly name: Type.TString;
                readonly source: Type.TString;
                readonly fallbackUrl: Type.TString;
                readonly enabled: Type.TBoolean;
            }, "enabled" | "fallbackUrl" | "id" | "name" | "source", never>>>;
        }, "companyBoardApiTemplates" | "companyBoardResultLimit" | "companyBoards" | "gamingBoardResultLimit" | "gamingPortals" | "greenhouseApiBaseUrl" | "greenhouseBoards" | "greenhouseMaxPages" | "hitmarkerApiBaseUrl" | "hitmarkerDefaultLocation" | "hitmarkerDefaultQuery" | "hitmarkerEnabled" | "leverApiBaseUrl" | "leverCompanies" | "leverMaxPages" | "providerTimeoutMs" | "unknownCompanyLabel" | "unknownLocationLabel", never>>>;
    }>>>;
    readonly emailTransportSettings: Type.TOptional<Type.TObject<{
        readonly host: Type.TOptional<Type.TString>;
        readonly port: Type.TOptional<Type.TNumber>;
        readonly security: Type.TOptional<Type.TUnion<(Type.TLiteral<"plain"> | Type.TLiteral<"starttls"> | Type.TLiteral<"tls">)[]>>;
        readonly username: Type.TOptional<Type.TString>;
        readonly fromEmail: Type.TOptional<Type.TString>;
        readonly fromName: Type.TOptional<Type.TString>;
        readonly authMethod: Type.TOptional<Type.TUnion<(Type.TLiteral<"login"> | Type.TLiteral<"plain">)[]>>;
        readonly connectionTimeoutSeconds: Type.TOptional<Type.TNumber>;
    }, never, Type.InferOptionalKeys<{
        readonly host: Type.TOptional<Type.TString>;
        readonly port: Type.TOptional<Type.TNumber>;
        readonly security: Type.TOptional<Type.TUnion<(Type.TLiteral<"plain"> | Type.TLiteral<"starttls"> | Type.TLiteral<"tls">)[]>>;
        readonly username: Type.TOptional<Type.TString>;
        readonly fromEmail: Type.TOptional<Type.TString>;
        readonly fromName: Type.TOptional<Type.TString>;
        readonly authMethod: Type.TOptional<Type.TUnion<(Type.TLiteral<"login"> | Type.TLiteral<"plain">)[]>>;
        readonly connectionTimeoutSeconds: Type.TOptional<Type.TNumber>;
    }>>>;
}>>;
export type SettingsUpdateBody = StaticParse<typeof settingsUpdateBodySchema>;
export declare const apiKeysUpdateBodySchema: Type.TObject<{
    readonly geminiApiKey: Type.TOptional<Type.TString>;
    readonly openaiApiKey: Type.TOptional<Type.TString>;
    readonly claudeApiKey: Type.TOptional<Type.TString>;
    readonly huggingfaceToken: Type.TOptional<Type.TString>;
    readonly localModelEndpoint: Type.TOptional<Type.TString>;
    readonly localModelName: Type.TOptional<Type.TString>;
    readonly emailTransportPassword: Type.TOptional<Type.TString>;
}, never, Type.InferOptionalKeys<{
    readonly geminiApiKey: Type.TOptional<Type.TString>;
    readonly openaiApiKey: Type.TOptional<Type.TString>;
    readonly claudeApiKey: Type.TOptional<Type.TString>;
    readonly huggingfaceToken: Type.TOptional<Type.TString>;
    readonly localModelEndpoint: Type.TOptional<Type.TString>;
    readonly localModelName: Type.TOptional<Type.TString>;
    readonly emailTransportPassword: Type.TOptional<Type.TString>;
}>>;
export type ApiKeysUpdateBody = StaticParse<typeof apiKeysUpdateBodySchema>;
export declare const providerTestBodySchema: Type.TObject<{
    readonly provider: Type.TUnion<Type.TLiteral<"claude" | "gemini" | "huggingface" | "local" | "openai">[]>;
    readonly key: Type.TString;
    readonly model: Type.TOptional<Type.TString>;
}, "key" | "provider", "model">;
export type ProviderTestBody = StaticParse<typeof providerTestBodySchema>;
export declare const jobTaxonomyUpdateBodySchema: Type.TRequired<Type.TObject<{
    readonly keywords: Type.TArray<Type.TRequired<Type.TObject<{
        readonly id: Type.TString;
        readonly category: Type.TUnion<(Type.TLiteral<"genre"> | Type.TLiteral<"hybrid-location"> | Type.TLiteral<"platform"> | Type.TLiteral<"remote-location"> | Type.TLiteral<"requirement"> | Type.TLiteral<"role"> | Type.TLiteral<"technology">)[]>;
        readonly label: Type.TString;
        readonly synonyms: Type.TArray<Type.TString>;
        readonly sortOrder: Type.TNumber;
        readonly enabled: Type.TBoolean;
    }, "category" | "enabled" | "id" | "label" | "sortOrder" | "synonyms", never>>>;
    readonly studioRules: Type.TArray<Type.TRequired<Type.TObject<{
        readonly id: Type.TString;
        readonly studioType: Type.TUnion<Type.TLiteral<import("@bao/shared/types/jobs").StudioType>[]>;
        readonly keyword: Type.TString;
        readonly sortOrder: Type.TNumber;
        readonly enabled: Type.TBoolean;
    }, "enabled" | "id" | "keyword" | "sortOrder" | "studioType", never>>>;
}, "keywords" | "studioRules", never>>;
export type JobTaxonomyUpdateBody = StaticParse<typeof jobTaxonomyUpdateBodySchema>;
export declare const importSettingsBodySchema: Type.TObject<{
    readonly version: Type.TLiteral<"1.0">;
    readonly exportedAt: Type.TString;
    readonly profile: Type.TUnion<(Type.TNull | Type.TRecursive<Type.TSchema>)[]>;
    readonly settings: Type.TUnion<(Type.TNull | Type.TRecursive<Type.TSchema>)[]>;
    readonly resumes: Type.TArray<Type.TRecursive<Type.TSchema>>;
    readonly coverLetters: Type.TArray<Type.TRecursive<Type.TSchema>>;
    readonly portfolio: Type.TUnion<(Type.TNull | Type.TRecursive<Type.TSchema>)[]>;
    readonly portfolioProjects: Type.TArray<Type.TRecursive<Type.TSchema>>;
    readonly interviewSessions: Type.TArray<Type.TRecursive<Type.TSchema>>;
    readonly gamification: Type.TUnion<(Type.TNull | Type.TRecursive<Type.TSchema>)[]>;
    readonly applications: Type.TArray<Type.TRecursive<Type.TSchema>>;
    readonly chatHistory: Type.TArray<Type.TRecursive<Type.TSchema>>;
    readonly savedJobs: Type.TArray<Type.TRecursive<Type.TSchema>>;
    readonly skillMappings: Type.TArray<Type.TRecursive<Type.TSchema>>;
}, "applications" | "chatHistory" | "coverLetters" | "exportedAt" | "gamification" | "interviewSessions" | "portfolio" | "portfolioProjects" | "profile" | "resumes" | "savedJobs" | "settings" | "skillMappings" | "version", never>;
export type ImportSettingsBody = StaticParse<typeof importSettingsBodySchema>;
