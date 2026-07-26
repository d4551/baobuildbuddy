import type { Static } from "typebox";
/**
 * Spelled out as a literal tuple: `t.Union` over a mapped array loses the member
 * literals and its `Static` collapses to `never`, which silently widened every
 * response embedding a template. `resume-route-template-parity.test.ts` asserts
 * these members stay identical to RESUME_TEMPLATE_OPTIONS, which remains SSOT.
 */
export declare const resumeTemplateBodySchema: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
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
    template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
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
        template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
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
    readonly 200: import("typebox").TObject<{
        questions: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            question: import("typebox").TString;
            category: import("typebox").TString;
        }>>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const resumeQuestionSynthesizeResponses: {
    readonly 201: import("typebox").TObject<{
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
        template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const resumeListResponses: {
    readonly 200: import("typebox").TArray<import("typebox").TObject<{
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
        template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>>;
};
export declare const resumeEntityResponses: {
    readonly 200: import("typebox").TObject<{
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
        template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const resumeCreateResponses: {
    readonly 201: import("typebox").TObject<{
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
        template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
};
export declare const resumeUpdateResponses: {
    readonly 200: import("typebox").TObject<{
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
        template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
        theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
        isDefault: import("typebox").TBoolean;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const resumeDeleteResponses: {
    readonly 200: import("typebox").TObject<{
        success: import("typebox").TBoolean;
        id: import("typebox").TString;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
/** Export streams a generated document body, so only the error arms are typed. */
export declare const resumeExportResponses: {
    readonly 200: import("typebox").TUnknown;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const resumeEnhanceResponses: {
    readonly 200: import("typebox").TObject<{
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
            template: import("typebox").TUnion<[import("typebox").TLiteral<"modern">, import("typebox").TLiteral<"classic">, import("typebox").TLiteral<"creative">, import("typebox").TLiteral<"minimal">, import("typebox").TLiteral<"google-xyz">, import("typebox").TLiteral<"gaming">, import("typebox").TLiteral<"executive">, import("typebox").TLiteral<"technical">]>;
            theme: import("typebox").TUnion<[import("typebox").TLiteral<"light">, import("typebox").TLiteral<"dark">]>;
            isDefault: import("typebox").TBoolean;
        }>;
        suggestions: import("typebox").TArray<import("typebox").TUnknown>;
        section: import("typebox").TString;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const resumeScoreResponses: {
    readonly 200: import("typebox").TObject<{
        resumeId: import("typebox").TString;
        jobId: import("typebox").TString;
        score: import("typebox").TNumber;
        strengths: import("typebox").TArray<import("typebox").TString>;
        improvements: import("typebox").TArray<import("typebox").TString>;
        keywords: import("typebox").TArray<import("typebox").TString>;
        analysis: import("typebox").TRecord<"^.*$", import("typebox").TUnknown>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
