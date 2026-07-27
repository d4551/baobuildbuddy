import type { Static } from "typebox";
export declare const userProfileUpdateBodySchema: import("typebox").TObject<{
    name: import("typebox").TOptional<import("typebox").TString>;
    email: import("typebox").TOptional<import("typebox").TString>;
    phone: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    website: import("typebox").TOptional<import("typebox").TString>;
    linkedin: import("typebox").TOptional<import("typebox").TString>;
    github: import("typebox").TOptional<import("typebox").TString>;
    summary: import("typebox").TOptional<import("typebox").TString>;
    currentRole: import("typebox").TOptional<import("typebox").TString>;
    currentCompany: import("typebox").TOptional<import("typebox").TString>;
    yearsExperience: import("typebox").TOptional<import("typebox").TNumber>;
    technicalSkills: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    softSkills: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
        yearsInGaming: import("typebox").TOptional<import("typebox").TNumber>;
        experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"entry">, import("typebox").TLiteral<"junior">, import("typebox").TLiteral<"mid">, import("typebox").TLiteral<"senior">, import("typebox").TLiteral<"lead">, import("typebox").TLiteral<"principal">, import("typebox").TLiteral<"director">]>>;
        specializations: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        gameEngines: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        platforms: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        genres: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        shippedTitles: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
            name: import("typebox").TString;
            platforms: import("typebox").TArray<import("typebox").TString>;
            releaseDate: import("typebox").TOptional<import("typebox").TString>;
            role: import("typebox").TString;
            teamSize: import("typebox").TOptional<import("typebox").TNumber>;
        }>>>;
    }>>;
    careerGoals: import("typebox").TOptional<import("typebox").TObject<{
        desiredRoles: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        preferredCompanySize: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        preferredLocations: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        remotePreference: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"onsite">, import("typebox").TLiteral<"hybrid">, import("typebox").TLiteral<"remote">, import("typebox").TLiteral<"flexible">]>>;
        salaryRange: import("typebox").TOptional<import("typebox").TObject<{
            min: import("typebox").TNumber;
            max: import("typebox").TNumber;
            currency: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        willingToRelocate: import("typebox").TOptional<import("typebox").TBoolean>;
    }>>;
}>;
export type UserProfileUpdateRouteBody = Static<typeof userProfileUpdateBodySchema>;
export declare const userProfileResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    name: import("typebox").TString;
    email: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    phone: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    location: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    website: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    linkedin: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    github: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    summary: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    currentRole: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    currentCompany: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    yearsExperience: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
    technicalSkills: import("typebox").TArray<import("typebox").TString>;
    softSkills: import("typebox").TArray<import("typebox").TString>;
    gamingExperience: import("typebox").TObject<{
        yearsInGaming: import("typebox").TOptional<import("typebox").TNumber>;
        experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"entry">, import("typebox").TLiteral<"junior">, import("typebox").TLiteral<"mid">, import("typebox").TLiteral<"senior">, import("typebox").TLiteral<"lead">, import("typebox").TLiteral<"principal">, import("typebox").TLiteral<"director">]>>;
        specializations: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        gameEngines: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        platforms: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        genres: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        shippedTitles: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
            name: import("typebox").TString;
            platforms: import("typebox").TArray<import("typebox").TString>;
            releaseDate: import("typebox").TOptional<import("typebox").TString>;
            role: import("typebox").TString;
            teamSize: import("typebox").TOptional<import("typebox").TNumber>;
        }>>>;
    }>;
    careerGoals: import("typebox").TObject<{
        desiredRoles: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        preferredCompanySize: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        preferredLocations: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        remotePreference: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"onsite">, import("typebox").TLiteral<"hybrid">, import("typebox").TLiteral<"remote">, import("typebox").TLiteral<"flexible">]>>;
        salaryRange: import("typebox").TOptional<import("typebox").TObject<{
            min: import("typebox").TNumber;
            max: import("typebox").TNumber;
            currency: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        willingToRelocate: import("typebox").TOptional<import("typebox").TBoolean>;
    }>;
    createdAt: import("typebox").TString;
    updatedAt: import("typebox").TString;
}>;
