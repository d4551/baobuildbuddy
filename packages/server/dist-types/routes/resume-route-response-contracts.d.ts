import type { Static } from "typebox";
export declare const resumePersonalInfoResponseSchema: import("typebox").TObject<{
    name: import("typebox").TOptional<import("typebox").TString>;
    email: import("typebox").TOptional<import("typebox").TString>;
    phone: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    website: import("typebox").TOptional<import("typebox").TString>;
    linkedIn: import("typebox").TOptional<import("typebox").TString>;
    github: import("typebox").TOptional<import("typebox").TString>;
    portfolio: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeExperienceResponseSchema: import("typebox").TObject<{
    title: import("typebox").TString;
    company: import("typebox").TString;
    startDate: import("typebox").TString;
    endDate: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    description: import("typebox").TOptional<import("typebox").TString>;
    achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
export declare const resumeEducationResponseSchema: import("typebox").TObject<{
    degree: import("typebox").TString;
    field: import("typebox").TString;
    school: import("typebox").TString;
    year: import("typebox").TString;
    gpa: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeSkillsResponseSchema: import("typebox").TObject<{
    technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
}>;
export declare const resumeProjectResponseSchema: import("typebox").TObject<{
    title: import("typebox").TString;
    description: import("typebox").TString;
    technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    link: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeGamingExperienceResponseSchema: import("typebox").TObject<{
    gameEngines: import("typebox").TOptional<import("typebox").TString>;
    platforms: import("typebox").TOptional<import("typebox").TString>;
    genres: import("typebox").TOptional<import("typebox").TString>;
    shippedTitles: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const resumeEntityResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    name: import("typebox").TString;
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
    summary: import("typebox").TString;
    experience: import("typebox").TArray<import("typebox").TObject<{
        title: import("typebox").TString;
        company: import("typebox").TString;
        startDate: import("typebox").TString;
        endDate: import("typebox").TOptional<import("typebox").TString>;
        location: import("typebox").TOptional<import("typebox").TString>;
        description: import("typebox").TOptional<import("typebox").TString>;
        achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>>;
    education: import("typebox").TArray<import("typebox").TObject<{
        degree: import("typebox").TString;
        field: import("typebox").TString;
        school: import("typebox").TString;
        year: import("typebox").TString;
        gpa: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    skills: import("typebox").TOptional<import("typebox").TObject<{
        technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
    }>>;
    projects: import("typebox").TArray<import("typebox").TObject<{
        title: import("typebox").TString;
        description: import("typebox").TString;
        technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        link: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
        gameEngines: import("typebox").TOptional<import("typebox").TString>;
        platforms: import("typebox").TOptional<import("typebox").TString>;
        genres: import("typebox").TOptional<import("typebox").TString>;
        shippedTitles: import("typebox").TOptional<import("typebox").TString>;
    }>>;
    template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
    theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
    isDefault: import("typebox").TBoolean;
}>;
export type ResumeEntityResponse = Static<typeof resumeEntityResponseSchema>;
export declare const resumeQuestionResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    question: import("typebox").TString;
    category: import("typebox").TString;
}>;
export declare const resumeQuestionGenerateResponseSchema: import("typebox").TObject<{
    questions: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        question: import("typebox").TString;
        category: import("typebox").TString;
    }>>;
}>;
export type ResumeQuestionGenerateResponse = Static<typeof resumeQuestionGenerateResponseSchema>;
export declare const resumeDeleteResponseSchema: import("typebox").TObject<{
    success: import("typebox").TBoolean;
    id: import("typebox").TString;
}>;
export declare const resumeEnhanceResponseSchema: import("typebox").TObject<{
    resume: import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
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
        summary: import("typebox").TString;
        experience: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            company: import("typebox").TString;
            startDate: import("typebox").TString;
            endDate: import("typebox").TOptional<import("typebox").TString>;
            location: import("typebox").TOptional<import("typebox").TString>;
            description: import("typebox").TOptional<import("typebox").TString>;
            achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        education: import("typebox").TArray<import("typebox").TObject<{
            degree: import("typebox").TString;
            field: import("typebox").TString;
            school: import("typebox").TString;
            year: import("typebox").TString;
            gpa: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        skills: import("typebox").TOptional<import("typebox").TObject<{
            technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        projects: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            description: import("typebox").TString;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            link: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
            gameEngines: import("typebox").TOptional<import("typebox").TString>;
            platforms: import("typebox").TOptional<import("typebox").TString>;
            genres: import("typebox").TOptional<import("typebox").TString>;
            shippedTitles: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
    suggestions: import("typebox").TArray<import("typebox").TUnknown>;
    section: import("typebox").TString;
}>;
export declare const resumeScoreResponseSchema: import("typebox").TObject<{
    resumeId: import("typebox").TString;
    jobId: import("typebox").TString;
    score: import("typebox").TNumber;
    strengths: import("typebox").TArray<import("typebox").TString>;
    improvements: import("typebox").TArray<import("typebox").TString>;
    keywords: import("typebox").TArray<import("typebox").TString>;
    analysis: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
}>;
export declare const resumeQuestionGenerateResponses: {
    200: import("typebox").TObject<{
        questions: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            question: import("typebox").TString;
            category: import("typebox").TString;
        }>>;
    }>;
};
export declare const resumeQuestionSynthesizeResponses: {
    201: import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
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
        summary: import("typebox").TString;
        experience: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            company: import("typebox").TString;
            startDate: import("typebox").TString;
            endDate: import("typebox").TOptional<import("typebox").TString>;
            location: import("typebox").TOptional<import("typebox").TString>;
            description: import("typebox").TOptional<import("typebox").TString>;
            achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        education: import("typebox").TArray<import("typebox").TObject<{
            degree: import("typebox").TString;
            field: import("typebox").TString;
            school: import("typebox").TString;
            year: import("typebox").TString;
            gpa: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        skills: import("typebox").TOptional<import("typebox").TObject<{
            technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        projects: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            description: import("typebox").TString;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            link: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
            gameEngines: import("typebox").TOptional<import("typebox").TString>;
            platforms: import("typebox").TOptional<import("typebox").TString>;
            genres: import("typebox").TOptional<import("typebox").TString>;
            shippedTitles: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
};
export declare const resumeListResponses: {
    200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
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
        summary: import("typebox").TString;
        experience: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            company: import("typebox").TString;
            startDate: import("typebox").TString;
            endDate: import("typebox").TOptional<import("typebox").TString>;
            location: import("typebox").TOptional<import("typebox").TString>;
            description: import("typebox").TOptional<import("typebox").TString>;
            achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        education: import("typebox").TArray<import("typebox").TObject<{
            degree: import("typebox").TString;
            field: import("typebox").TString;
            school: import("typebox").TString;
            year: import("typebox").TString;
            gpa: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        skills: import("typebox").TOptional<import("typebox").TObject<{
            technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        projects: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            description: import("typebox").TString;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            link: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
            gameEngines: import("typebox").TOptional<import("typebox").TString>;
            platforms: import("typebox").TOptional<import("typebox").TString>;
            genres: import("typebox").TOptional<import("typebox").TString>;
            shippedTitles: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>>;
};
export declare const resumeEntityResponses: {
    200: import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
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
        summary: import("typebox").TString;
        experience: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            company: import("typebox").TString;
            startDate: import("typebox").TString;
            endDate: import("typebox").TOptional<import("typebox").TString>;
            location: import("typebox").TOptional<import("typebox").TString>;
            description: import("typebox").TOptional<import("typebox").TString>;
            achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        education: import("typebox").TArray<import("typebox").TObject<{
            degree: import("typebox").TString;
            field: import("typebox").TString;
            school: import("typebox").TString;
            year: import("typebox").TString;
            gpa: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        skills: import("typebox").TOptional<import("typebox").TObject<{
            technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        projects: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            description: import("typebox").TString;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            link: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
            gameEngines: import("typebox").TOptional<import("typebox").TString>;
            platforms: import("typebox").TOptional<import("typebox").TString>;
            genres: import("typebox").TOptional<import("typebox").TString>;
            shippedTitles: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
};
export declare const resumeCreateResponses: {
    201: import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
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
        summary: import("typebox").TString;
        experience: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            company: import("typebox").TString;
            startDate: import("typebox").TString;
            endDate: import("typebox").TOptional<import("typebox").TString>;
            location: import("typebox").TOptional<import("typebox").TString>;
            description: import("typebox").TOptional<import("typebox").TString>;
            achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        education: import("typebox").TArray<import("typebox").TObject<{
            degree: import("typebox").TString;
            field: import("typebox").TString;
            school: import("typebox").TString;
            year: import("typebox").TString;
            gpa: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        skills: import("typebox").TOptional<import("typebox").TObject<{
            technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        projects: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            description: import("typebox").TString;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            link: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
            gameEngines: import("typebox").TOptional<import("typebox").TString>;
            platforms: import("typebox").TOptional<import("typebox").TString>;
            genres: import("typebox").TOptional<import("typebox").TString>;
            shippedTitles: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
};
export declare const resumeUpdateResponses: {
    200: import("typebox").TObject<{
        id: import("typebox").TString;
        name: import("typebox").TString;
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
        summary: import("typebox").TString;
        experience: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            company: import("typebox").TString;
            startDate: import("typebox").TString;
            endDate: import("typebox").TOptional<import("typebox").TString>;
            location: import("typebox").TOptional<import("typebox").TString>;
            description: import("typebox").TOptional<import("typebox").TString>;
            achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        education: import("typebox").TArray<import("typebox").TObject<{
            degree: import("typebox").TString;
            field: import("typebox").TString;
            school: import("typebox").TString;
            year: import("typebox").TString;
            gpa: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        skills: import("typebox").TOptional<import("typebox").TObject<{
            technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        }>>;
        projects: import("typebox").TArray<import("typebox").TObject<{
            title: import("typebox").TString;
            description: import("typebox").TString;
            technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            link: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
            gameEngines: import("typebox").TOptional<import("typebox").TString>;
            platforms: import("typebox").TOptional<import("typebox").TString>;
            genres: import("typebox").TOptional<import("typebox").TString>;
            shippedTitles: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
};
export declare const resumeDeleteResponses: {
    200: import("typebox").TObject<{
        success: import("typebox").TBoolean;
        id: import("typebox").TString;
    }>;
};
export declare const resumeExportResponses: {
    200: import("typebox").TUnknown;
};
export declare const resumeEnhanceResponses: {
    200: import("typebox").TObject<{
        resume: import("typebox").TObject<{
            id: import("typebox").TString;
            name: import("typebox").TString;
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
            summary: import("typebox").TString;
            experience: import("typebox").TArray<import("typebox").TObject<{
                title: import("typebox").TString;
                company: import("typebox").TString;
                startDate: import("typebox").TString;
                endDate: import("typebox").TOptional<import("typebox").TString>;
                location: import("typebox").TOptional<import("typebox").TString>;
                description: import("typebox").TOptional<import("typebox").TString>;
                achievements: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>>;
            education: import("typebox").TArray<import("typebox").TObject<{
                degree: import("typebox").TString;
                field: import("typebox").TString;
                school: import("typebox").TString;
                year: import("typebox").TString;
                gpa: import("typebox").TOptional<import("typebox").TString>;
            }>>;
            skills: import("typebox").TOptional<import("typebox").TObject<{
                technical: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                soft: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                gaming: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
            }>>;
            projects: import("typebox").TArray<import("typebox").TObject<{
                title: import("typebox").TString;
                description: import("typebox").TString;
                technologies: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
                link: import("typebox").TOptional<import("typebox").TString>;
            }>>;
            gamingExperience: import("typebox").TOptional<import("typebox").TObject<{
                gameEngines: import("typebox").TOptional<import("typebox").TString>;
                platforms: import("typebox").TOptional<import("typebox").TString>;
                genres: import("typebox").TOptional<import("typebox").TString>;
                shippedTitles: import("typebox").TOptional<import("typebox").TString>;
            }>>;
            template: import("typebox").TUnion<import("typebox").TLiteral<"classic" | "creative" | "executive" | "gaming" | "google-xyz" | "minimal" | "modern" | "technical">[]>;
            theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
            isDefault: import("typebox").TBoolean;
        }>;
        suggestions: import("typebox").TArray<import("typebox").TUnknown>;
        section: import("typebox").TString;
    }>;
};
export declare const resumeScoreResponses: {
    200: import("typebox").TObject<{
        resumeId: import("typebox").TString;
        jobId: import("typebox").TString;
        score: import("typebox").TNumber;
        strengths: import("typebox").TArray<import("typebox").TString>;
        improvements: import("typebox").TArray<import("typebox").TString>;
        keywords: import("typebox").TArray<import("typebox").TString>;
        analysis: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
    }>;
};
