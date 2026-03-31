import { type ResumeData } from "@bao/shared";
import Type from "baobox";
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
export declare const resumeTemplateBodySchema: Type.TUnion<Type.TLiteral<"modern" | "classic" | "creative" | "minimal" | "google-xyz" | "gaming" | "executive" | "technical">[]>;
export declare const resumeThemeBodySchema: Type.TUnion<(Type.TLiteral<"light"> | Type.TLiteral<"dark">)[]>;
export declare const resumePersonalInfoBodySchema: Type.TObject<{
    readonly name: Type.TOptional<Type.TString>;
    readonly email: Type.TOptional<Type.TString>;
    readonly phone: Type.TOptional<Type.TString>;
    readonly location: Type.TOptional<Type.TString>;
    readonly website: Type.TOptional<Type.TString>;
    readonly linkedIn: Type.TOptional<Type.TString>;
    readonly github: Type.TOptional<Type.TString>;
    readonly portfolio: Type.TOptional<Type.TString>;
}, never, never>;
export declare const resumeExperienceBodySchema: Type.TObject<{
    readonly title: Type.TString;
    readonly company: Type.TString;
    readonly startDate: Type.TString;
    readonly endDate: Type.TOptional<Type.TString>;
    readonly location: Type.TOptional<Type.TString>;
    readonly description: Type.TOptional<Type.TString>;
    readonly achievements: Type.TOptional<Type.TArray<Type.TString>>;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
}, "title" | "company" | "startDate", never>;
export declare const resumeEducationBodySchema: Type.TObject<{
    readonly degree: Type.TString;
    readonly field: Type.TString;
    readonly school: Type.TString;
    readonly year: Type.TString;
    readonly gpa: Type.TOptional<Type.TString>;
}, "degree" | "field" | "school" | "year", never>;
export declare const resumeSkillsBodySchema: Type.TObject<{
    readonly technical: Type.TOptional<Type.TArray<Type.TString>>;
    readonly soft: Type.TOptional<Type.TArray<Type.TString>>;
    readonly gaming: Type.TOptional<Type.TArray<Type.TString>>;
}, never, never>;
export declare const resumeProjectBodySchema: Type.TObject<{
    readonly title: Type.TString;
    readonly description: Type.TString;
    readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    readonly link: Type.TOptional<Type.TString>;
}, "title" | "description", never>;
export declare const resumeGamingExperienceBodySchema: Type.TObject<{
    readonly gameEngines: Type.TOptional<Type.TString>;
    readonly platforms: Type.TOptional<Type.TString>;
    readonly genres: Type.TOptional<Type.TString>;
    readonly shippedTitles: Type.TOptional<Type.TString>;
}, never, never>;
export declare const resumeMutationBodySchema: Type.TObject<{
    readonly name: Type.TOptional<Type.TString>;
    readonly personalInfo: Type.TOptional<Type.TObject<{
        readonly name: Type.TOptional<Type.TString>;
        readonly email: Type.TOptional<Type.TString>;
        readonly phone: Type.TOptional<Type.TString>;
        readonly location: Type.TOptional<Type.TString>;
        readonly website: Type.TOptional<Type.TString>;
        readonly linkedIn: Type.TOptional<Type.TString>;
        readonly github: Type.TOptional<Type.TString>;
        readonly portfolio: Type.TOptional<Type.TString>;
    }, never, never>>;
    readonly summary: Type.TOptional<Type.TString>;
    readonly experience: Type.TOptional<Type.TArray<Type.TObject<{
        readonly title: Type.TString;
        readonly company: Type.TString;
        readonly startDate: Type.TString;
        readonly endDate: Type.TOptional<Type.TString>;
        readonly location: Type.TOptional<Type.TString>;
        readonly description: Type.TOptional<Type.TString>;
        readonly achievements: Type.TOptional<Type.TArray<Type.TString>>;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
    }, "title" | "company" | "startDate", never>>>;
    readonly education: Type.TOptional<Type.TArray<Type.TObject<{
        readonly degree: Type.TString;
        readonly field: Type.TString;
        readonly school: Type.TString;
        readonly year: Type.TString;
        readonly gpa: Type.TOptional<Type.TString>;
    }, "degree" | "field" | "school" | "year", never>>>;
    readonly skills: Type.TOptional<Type.TObject<{
        readonly technical: Type.TOptional<Type.TArray<Type.TString>>;
        readonly soft: Type.TOptional<Type.TArray<Type.TString>>;
        readonly gaming: Type.TOptional<Type.TArray<Type.TString>>;
    }, never, never>>;
    readonly projects: Type.TOptional<Type.TArray<Type.TObject<{
        readonly title: Type.TString;
        readonly description: Type.TString;
        readonly technologies: Type.TOptional<Type.TArray<Type.TString>>;
        readonly link: Type.TOptional<Type.TString>;
    }, "title" | "description", never>>>;
    readonly gamingExperience: Type.TOptional<Type.TObject<{
        readonly gameEngines: Type.TOptional<Type.TString>;
        readonly platforms: Type.TOptional<Type.TString>;
        readonly genres: Type.TOptional<Type.TString>;
        readonly shippedTitles: Type.TOptional<Type.TString>;
    }, never, never>>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"modern" | "classic" | "creative" | "minimal" | "google-xyz" | "gaming" | "executive" | "technical">[]>>;
    readonly theme: Type.TOptional<Type.TUnion<(Type.TLiteral<"light"> | Type.TLiteral<"dark">)[]>>;
    readonly isDefault: Type.TOptional<Type.TBoolean>;
}, never, never>;
export declare const resumeIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export declare const resumeQuestionGenerateBodySchema: Type.TObject<{
    readonly targetRole: Type.TString;
    readonly studioName: Type.TOptional<Type.TString>;
    readonly experienceLevel: Type.TOptional<Type.TString>;
}, "targetRole", never>;
export declare const resumeQuestionSynthesizeBodySchema: Type.TObject<{
    readonly questionsAndAnswers: Type.TArray<Type.TObject<{
        readonly id: Type.TString;
        readonly question: Type.TString;
        readonly answer: Type.TString;
        readonly category: Type.TString;
    }, "id" | "category" | "question" | "answer", never>>;
}, "questionsAndAnswers", never>;
export declare const resumeExportBodySchema: Type.TObject<{
    readonly format: Type.TOptional<Type.TString>;
    readonly template: Type.TOptional<Type.TUnion<Type.TLiteral<"modern" | "classic" | "creative" | "minimal" | "google-xyz" | "gaming" | "executive" | "technical">[]>>;
}, never, never>;
export declare const resumeEnhanceBodySchema: Type.TObject<{
    readonly section: Type.TOptional<Type.TString>;
}, never, never>;
export declare const resumeScoreBodySchema: Type.TObject<{
    readonly jobId: Type.TString;
}, "jobId", never>;
