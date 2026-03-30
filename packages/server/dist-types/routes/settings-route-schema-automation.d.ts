export declare const jobProviderSettingsBodySchema: import("@sinclair/typebox").TObject<{
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
}>;
export declare const speechSettingsBodySchema: import("@sinclair/typebox").TObject<{
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
}>;
export declare const jobTaxonomyKeywordEntryBodySchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    category: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"remote-location">, import("@sinclair/typebox").TLiteral<"hybrid-location">, import("@sinclair/typebox").TLiteral<"requirement">, import("@sinclair/typebox").TLiteral<"technology">, import("@sinclair/typebox").TLiteral<"genre">, import("@sinclair/typebox").TLiteral<"platform">, import("@sinclair/typebox").TLiteral<"role">]>;
    label: import("@sinclair/typebox").TString;
    synonyms: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    sortOrder: import("@sinclair/typebox").TNumber;
    enabled: import("@sinclair/typebox").TBoolean;
}>;
export declare const studioClassificationRuleBodySchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    studioType: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>]>;
    keyword: import("@sinclair/typebox").TString;
    sortOrder: import("@sinclair/typebox").TNumber;
    enabled: import("@sinclair/typebox").TBoolean;
}>;
export declare const jobTaxonomySettingsBodySchema: import("@sinclair/typebox").TObject<{
    keywords: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        category: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"remote-location">, import("@sinclair/typebox").TLiteral<"hybrid-location">, import("@sinclair/typebox").TLiteral<"requirement">, import("@sinclair/typebox").TLiteral<"technology">, import("@sinclair/typebox").TLiteral<"genre">, import("@sinclair/typebox").TLiteral<"platform">, import("@sinclair/typebox").TLiteral<"role">]>;
        label: import("@sinclair/typebox").TString;
        synonyms: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
        sortOrder: import("@sinclair/typebox").TNumber;
        enabled: import("@sinclair/typebox").TBoolean;
    }>>;
    studioRules: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        studioType: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>, import("@sinclair/typebox").TLiteral<import("@bao/shared").StudioType>]>;
        keyword: import("@sinclair/typebox").TString;
        sortOrder: import("@sinclair/typebox").TNumber;
        enabled: import("@sinclair/typebox").TBoolean;
    }>>;
}>;
declare const jsonValueBodySchema: import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>;
export declare const nullableJsonValueBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TRecursive<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TBoolean, import("@sinclair/typebox").TNull, import("@sinclair/typebox").TArray<import("@sinclair/typebox").TThis>, import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TThis>]>>, import("@sinclair/typebox").TNull]>;
export { jsonValueBodySchema };
