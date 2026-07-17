export declare const jobProviderSettingsBodySchema: import("typebox").TObject<{
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
export declare const speechSettingsBodySchema: import("typebox").TObject<{
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
export declare const jobTaxonomyKeywordEntryBodySchema: import("typebox").TObject<{
    id: import("typebox").TString;
    category: import("typebox").TUnion<[import("typebox").TLiteral<"remote-location">, import("typebox").TLiteral<"hybrid-location">, import("typebox").TLiteral<"requirement">, import("typebox").TLiteral<"technology">, import("typebox").TLiteral<"genre">, import("typebox").TLiteral<"platform">, import("typebox").TLiteral<"role">]>;
    label: import("typebox").TString;
    synonyms: import("typebox").TArray<import("typebox").TString>;
    sortOrder: import("typebox").TNumber;
    enabled: import("typebox").TBoolean;
}>;
export declare const studioClassificationRuleBodySchema: import("typebox").TObject<{
    id: import("typebox").TString;
    studioType: import("typebox").TUnion<[import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>, import("typebox").TLiteral<import("@bao/shared/types/jobs").StudioType>]>;
    keyword: import("typebox").TString;
    sortOrder: import("typebox").TNumber;
    enabled: import("typebox").TBoolean;
}>;
export declare const jobTaxonomySettingsBodySchema: import("typebox").TObject<{
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
declare const jsonValueBodySchema: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>;
export declare const nullableJsonValueBodySchema: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>, import("typebox").TArray<import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>>, import("typebox").TRecord<"^.*$", import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>, import("typebox").TArray<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNumber, import("typebox").TBoolean, import("typebox").TNull]>>]>>]>, import("typebox").TNull]>;
export { jsonValueBodySchema };
