import { type ResumeData } from "@bao/shared";
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
export declare const resumeTemplateBodySchema: import("@sinclair/typebox").TString;
export declare const resumeThemeBodySchema: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"light">, import("@sinclair/typebox").TLiteral<"dark">]>;
export declare const resumePersonalInfoBodySchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    email: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    phone: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    location: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    website: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    linkedIn: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    github: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    portfolio: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const resumeExperienceBodySchema: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    company: import("@sinclair/typebox").TString;
    startDate: import("@sinclair/typebox").TString;
    endDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    location: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    achievements: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export declare const resumeEducationBodySchema: import("@sinclair/typebox").TObject<{
    degree: import("@sinclair/typebox").TString;
    field: import("@sinclair/typebox").TString;
    school: import("@sinclair/typebox").TString;
    year: import("@sinclair/typebox").TString;
    gpa: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const resumeSkillsBodySchema: import("@sinclair/typebox").TObject<{
    technical: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    soft: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    gaming: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
}>;
export declare const resumeProjectBodySchema: import("@sinclair/typebox").TObject<{
    title: import("@sinclair/typebox").TString;
    description: import("@sinclair/typebox").TString;
    technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    link: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const resumeGamingExperienceBodySchema: import("@sinclair/typebox").TObject<{
    gameEngines: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platforms: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    genres: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    shippedTitles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const resumeMutationBodySchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    personalInfo: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        email: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        phone: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        location: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        website: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        linkedIn: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        github: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        portfolio: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    summary: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    experience: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        company: import("@sinclair/typebox").TString;
        startDate: import("@sinclair/typebox").TString;
        endDate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        location: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        description: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        achievements: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    }>>>;
    education: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        degree: import("@sinclair/typebox").TString;
        field: import("@sinclair/typebox").TString;
        school: import("@sinclair/typebox").TString;
        year: import("@sinclair/typebox").TString;
        gpa: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    skills: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        technical: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        soft: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        gaming: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
    }>>;
    projects: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        title: import("@sinclair/typebox").TString;
        description: import("@sinclair/typebox").TString;
        technologies: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>>;
        link: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    gamingExperience: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TObject<{
        gameEngines: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        platforms: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        genres: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        shippedTitles: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>;
    template: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    theme: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"light">, import("@sinclair/typebox").TLiteral<"dark">]>>;
    isDefault: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const resumeIdParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export declare const resumeQuestionGenerateBodySchema: import("@sinclair/typebox").TObject<{
    targetRole: import("@sinclair/typebox").TString;
    studioName: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    experienceLevel: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const resumeQuestionSynthesizeBodySchema: import("@sinclair/typebox").TObject<{
    questionsAndAnswers: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        question: import("@sinclair/typebox").TString;
        answer: import("@sinclair/typebox").TString;
        category: import("@sinclair/typebox").TString;
    }>>;
}>;
export declare const resumeExportBodySchema: import("@sinclair/typebox").TObject<{
    format: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    template: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const resumeEnhanceBodySchema: import("@sinclair/typebox").TObject<{
    section: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const resumeScoreBodySchema: import("@sinclair/typebox").TObject<{
    jobId: import("@sinclair/typebox").TString;
}>;
