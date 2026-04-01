import Type from "baobox";
export declare const jobProviderSettingsBodySchema: Type.TRequired<Type.TObject<{
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
    }, "company" | "enabled" | "board", never>>>;
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
    }, "greenhouse" | "lever" | "recruitee" | "workable" | "ashby" | "smartrecruiters" | "teamtailor" | "workday", never>>;
    readonly companyBoards: Type.TArray<Type.TRequired<Type.TObject<{
        readonly name: Type.TString;
        readonly token: Type.TString;
        readonly type: Type.TUnion<(Type.TLiteral<"greenhouse"> | Type.TLiteral<"lever"> | Type.TLiteral<"recruitee"> | Type.TLiteral<"workable"> | Type.TLiteral<"ashby"> | Type.TLiteral<"smartrecruiters"> | Type.TLiteral<"teamtailor"> | Type.TLiteral<"workday">)[]>;
        readonly enabled: Type.TBoolean;
        readonly priority: Type.TNumber;
    }, "name" | "type" | "enabled" | "priority" | "token", never>>>;
    readonly gamingPortals: Type.TArray<Type.TRequired<Type.TObject<{
        readonly id: Type.TUnion<(Type.TLiteral<"hitmarker"> | Type.TLiteral<"grackle"> | Type.TLiteral<"workwithindies"> | Type.TLiteral<"remotegamejobs"> | Type.TLiteral<"gamesjobsdirect"> | Type.TLiteral<"pocketgamer">)[]>;
        readonly name: Type.TString;
        readonly source: Type.TString;
        readonly fallbackUrl: Type.TString;
        readonly enabled: Type.TBoolean;
    }, "name" | "id" | "source" | "enabled" | "fallbackUrl", never>>>;
}, "companyBoardApiTemplates" | "providerTimeoutMs" | "companyBoardResultLimit" | "gamingBoardResultLimit" | "unknownLocationLabel" | "unknownCompanyLabel" | "hitmarkerEnabled" | "hitmarkerApiBaseUrl" | "hitmarkerDefaultQuery" | "hitmarkerDefaultLocation" | "greenhouseApiBaseUrl" | "greenhouseMaxPages" | "greenhouseBoards" | "leverApiBaseUrl" | "leverMaxPages" | "leverCompanies" | "companyBoards" | "gamingPortals", never>>;
export declare const speechSettingsBodySchema: Type.TRequired<Type.TObject<{
    readonly locale: Type.TString;
    readonly stt: Type.TRequired<Type.TObject<{
        provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"openai"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"custom">)[]>;
        model: Type.TString;
        endpoint: Type.TString;
    }, "provider" | "model" | "endpoint", never>>;
    readonly tts: Type.TRequired<Type.TObject<{
        voice: Type.TString;
        format: Type.TUnion<(Type.TLiteral<"mp3"> | Type.TLiteral<"wav">)[]>;
        provider: Type.TUnion<(Type.TLiteral<"browser"> | Type.TLiteral<"openai"> | Type.TLiteral<"huggingface"> | Type.TLiteral<"local"> | Type.TLiteral<"custom">)[]>;
        model: Type.TString;
        endpoint: Type.TString;
    }, "provider" | "model" | "format" | "endpoint" | "voice", never>>;
}, "locale" | "stt" | "tts", never>>;
export declare const jobTaxonomyKeywordEntryBodySchema: Type.TRequired<Type.TObject<{
    readonly id: Type.TString;
    readonly category: Type.TUnion<(Type.TLiteral<"remote-location"> | Type.TLiteral<"hybrid-location"> | Type.TLiteral<"requirement"> | Type.TLiteral<"technology"> | Type.TLiteral<"genre"> | Type.TLiteral<"platform"> | Type.TLiteral<"role">)[]>;
    readonly label: Type.TString;
    readonly synonyms: Type.TArray<Type.TString>;
    readonly sortOrder: Type.TNumber;
    readonly enabled: Type.TBoolean;
}, "id" | "label" | "category" | "synonyms" | "sortOrder" | "enabled", never>>;
export declare const studioClassificationRuleBodySchema: Type.TRequired<Type.TObject<{
    readonly id: Type.TString;
    readonly studioType: Type.TUnion<Type.TLiteral<import("@bao/shared/types/jobs").StudioType>[]>;
    readonly keyword: Type.TString;
    readonly sortOrder: Type.TNumber;
    readonly enabled: Type.TBoolean;
}, "id" | "sortOrder" | "enabled" | "studioType" | "keyword", never>>;
export declare const jobTaxonomySettingsBodySchema: Type.TRequired<Type.TObject<{
    readonly keywords: Type.TArray<Type.TRequired<Type.TObject<{
        readonly id: Type.TString;
        readonly category: Type.TUnion<(Type.TLiteral<"remote-location"> | Type.TLiteral<"hybrid-location"> | Type.TLiteral<"requirement"> | Type.TLiteral<"technology"> | Type.TLiteral<"genre"> | Type.TLiteral<"platform"> | Type.TLiteral<"role">)[]>;
        readonly label: Type.TString;
        readonly synonyms: Type.TArray<Type.TString>;
        readonly sortOrder: Type.TNumber;
        readonly enabled: Type.TBoolean;
    }, "id" | "label" | "category" | "synonyms" | "sortOrder" | "enabled", never>>>;
    readonly studioRules: Type.TArray<Type.TRequired<Type.TObject<{
        readonly id: Type.TString;
        readonly studioType: Type.TUnion<Type.TLiteral<import("@bao/shared/types/jobs").StudioType>[]>;
        readonly keyword: Type.TString;
        readonly sortOrder: Type.TNumber;
        readonly enabled: Type.TBoolean;
    }, "id" | "sortOrder" | "enabled" | "studioType" | "keyword", never>>>;
}, "keywords" | "studioRules", never>>;
declare const jsonValueBodySchema: Type.TRecursive<Type.TSchema>;
export declare const nullableJsonValueBodySchema: Type.TUnion<(Type.TNull | Type.TRecursive<Type.TSchema>)[]>;
export { jsonValueBodySchema };
