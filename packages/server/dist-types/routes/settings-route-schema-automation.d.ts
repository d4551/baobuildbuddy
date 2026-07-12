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
}, "companyBoardApiTemplates" | "companyBoardResultLimit" | "companyBoards" | "gamingBoardResultLimit" | "gamingPortals" | "greenhouseApiBaseUrl" | "greenhouseBoards" | "greenhouseMaxPages" | "hitmarkerApiBaseUrl" | "hitmarkerDefaultLocation" | "hitmarkerDefaultQuery" | "hitmarkerEnabled" | "leverApiBaseUrl" | "leverCompanies" | "leverMaxPages" | "providerTimeoutMs" | "unknownCompanyLabel" | "unknownLocationLabel", never>>;
export declare const speechSettingsBodySchema: Type.TRequired<Type.TObject<{
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
}, "locale" | "stt" | "tts", never>>;
export declare const jobTaxonomyKeywordEntryBodySchema: Type.TRequired<Type.TObject<{
    readonly id: Type.TString;
    readonly category: Type.TUnion<(Type.TLiteral<"genre"> | Type.TLiteral<"hybrid-location"> | Type.TLiteral<"platform"> | Type.TLiteral<"remote-location"> | Type.TLiteral<"requirement"> | Type.TLiteral<"role"> | Type.TLiteral<"technology">)[]>;
    readonly label: Type.TString;
    readonly synonyms: Type.TArray<Type.TString>;
    readonly sortOrder: Type.TNumber;
    readonly enabled: Type.TBoolean;
}, "category" | "enabled" | "id" | "label" | "sortOrder" | "synonyms", never>>;
export declare const studioClassificationRuleBodySchema: Type.TRequired<Type.TObject<{
    readonly id: Type.TString;
    readonly studioType: Type.TUnion<Type.TLiteral<import("@bao/shared/types/jobs").StudioType>[]>;
    readonly keyword: Type.TString;
    readonly sortOrder: Type.TNumber;
    readonly enabled: Type.TBoolean;
}, "enabled" | "id" | "keyword" | "sortOrder" | "studioType", never>>;
export declare const jobTaxonomySettingsBodySchema: Type.TRequired<Type.TObject<{
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
declare const jsonValueBodySchema: Type.TRecursive<Type.TSchema>;
export declare const nullableJsonValueBodySchema: Type.TUnion<(Type.TNull | Type.TRecursive<Type.TSchema>)[]>;
export { jsonValueBodySchema };
