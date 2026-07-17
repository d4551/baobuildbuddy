import type { Static } from "typebox";
import type { ResumeData } from "@bao/shared/types/resume";
export type ResumeRouteSetState = {
    status?: number | string;
};
export type ResumeScoreBody = {
    jobId: string;
};
export type ResumeMutationBody = {
    name?: string;
    personalInfo?: ResumeData["personalInfo"];
    summary?: string;
    experience?: ResumeData["experience"];
    education?: ResumeData["education"];
    skills?: ResumeData["skills"];
    projects?: ResumeData["projects"];
    gamingExperience?: ResumeData["gamingExperience"];
    template?: string;
    theme?: "light" | "dark";
    isDefault?: boolean;
};
export type ResumeExportBody = {
    format?: string;
    template?: string;
};
export type ResumeEnhanceBody = {
    section?: string;
};
export declare const resumeTemplateBodySchema: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
export declare const resumeThemeBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
export declare const resumePersonalInfoBodySchema: import("typebox").TObject<{
    name: import("typebox").TOptional<import("typebox").TString>;
    email: import("typebox").TOptional<import("typebox").TString>;
    phone: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    website: import("typebox").TOptional<import("typebox").TString>;
    linkedIn: import("typebox").TOptional<import("typebox").TString>;
    github: import("typebox").TOptional<import("typebox").TString>;
    portfolio: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeExperienceBodySchema: import("typebox").TObject<{
    title: import("typebox").TString;
    company: import("typebox").TString;
    startDate: import("typebox").TString;
    endDate: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    description: import("typebox").TOptional<import("typebox").TString>;
    achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
export declare const resumeEducationBodySchema: import("typebox").TObject<{
    degree: import("typebox").TString;
    field: import("typebox").TString;
    school: import("typebox").TString;
    year: import("typebox").TString;
    gpa: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeSkillsBodySchema: import("typebox").TObject<{
    technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
export declare const resumeProjectBodySchema: import("typebox").TObject<{
    title: import("typebox").TString;
    description: import("typebox").TString;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    link: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeGamingExperienceBodySchema: import("typebox").TObject<{
    gameEngines: import("typebox").TOptional<import("typebox").TString>;
    platforms: import("typebox").TOptional<import("typebox").TString>;
    genres: import("typebox").TOptional<import("typebox").TString>;
    shippedTitles: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeMutationBodySchema: import("typebox").TObject<{
    name: import("typebox").TOptional<import("typebox").TString>;
    personalInfo: import("typebox").TOptional<import("typebox").TObject<{
        name: import("typebox").TOptional<import("typebox").TString>;
        email: import("typebox").TOptional<import("typebox").TString>;
        phone: import("typebox").TOptional<import("typebox").TString>;
        location: import("typebox").TOptional<import("typebox").TString>;
        website: import("typebox").TOptional<import("typebox").TString>;
        linkedIn: import("typebox").TOptional<import("typebox").TString>;
        github: import("typebox").TOptional<import("typebox").TString>;
        portfolio: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    summary: import("typebox").TOptional<import("typebox").TString>;
    experience: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
        title: import("typebox").TString;
        company: import("typebox").TString;
        startDate: import("typebox").TString;
        endDate: import("typebox").TOptional<import("typebox").TString>;
        location: import("typebox").TOptional<import("typebox").TString>;
        description: import("typebox").TOptional<import("typebox").TString>;
        achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>>>;
    education: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
        degree: import("typebox").TString;
        field: import("typebox").TString;
        school: import("typebox").TString;
        year: import("typebox").TString;
        gpa: import("typebox").TOptional<import("typebox").TString>;
    }>>>;
    skills: import("typebox").TOptional<import("typebox").TObject<{
        technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>>;
    projects: import("typebox").TOptional<import("typebox").TArray<import("typebox").TObject<{
        title: import("typebox").TString;
        description: import("typebox").TString;
        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        link: import("typebox").TOptional<import("typebox").TString>;
    }>>>;
    gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
        gameEngines: import("typebox").TOptional<import("typebox").TString>;
        platforms: import("typebox").TOptional<import("typebox").TString>;
        genres: import("typebox").TOptional<import("typebox").TString>;
        shippedTitles: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>>;
    theme: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>>;
    isDefault: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export declare const resumeIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type ResumeIdParams = Static<typeof resumeIdParamsSchema>;
export declare const resumeQuestionGenerateBodySchema: import("typebox").TObject<{
    targetRole: import("typebox").TString;
    studioName: import("typebox").TOptional<import("typebox").TString>;
    experienceLevel: import("typebox").TOptional<import("typebox").TString>;
}>;
export type ResumeQuestionGenerateRouteBody = Static<typeof resumeQuestionGenerateBodySchema>;
export declare const resumeQuestionSynthesizeBodySchema: import("typebox").TObject<{
    questionsAndAnswers: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        question: import("typebox").TString;
        answer: import("typebox").TString;
        category: import("typebox").TString;
    }>>;
}>;
export type ResumeQuestionSynthesizeRouteBody = Static<typeof resumeQuestionSynthesizeBodySchema>;
export declare const resumeExportBodySchema: import("typebox").TObject<{
    format: import("typebox").TOptional<import("typebox").TString>;
    template: import("typebox").TOptional<import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>>;
}>;
export type ResumeExportRouteBody = Static<typeof resumeExportBodySchema>;
export declare const resumeEnhanceBodySchema: import("typebox").TObject<{
    section: import("typebox").TOptional<import("typebox").TString>;
}>;
export type ResumeEnhanceRouteBody = Static<typeof resumeEnhanceBodySchema>;
export declare const resumeScoreBodySchema: import("typebox").TObject<{
    jobId: import("typebox").TString;
}>;
export type ResumeScoreRouteBody = Static<typeof resumeScoreBodySchema>;
export { resumeCreateResponses, resumeDeleteResponses, resumeEnhanceResponses, resumeEntityResponseSchema, resumeEntityResponses, resumeExportResponses, resumeListResponses, resumeQuestionGenerateResponseSchema, resumeQuestionGenerateResponses, resumeQuestionSynthesizeResponses, resumeScoreResponses, resumeUpdateResponses, type ResumeEntityResponse, type ResumeQuestionGenerateResponse, } from "./resume-route-response-contracts";
