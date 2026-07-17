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
    gamingExperience: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    careerGoals: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
}>;
export type UserProfileUpdateRouteBody = Static<typeof userProfileUpdateBodySchema>;
