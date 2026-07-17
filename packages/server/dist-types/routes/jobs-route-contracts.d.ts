import type { Static } from "typebox";
import { HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
export type JobListQuery = {
    q?: string;
    location?: string;
    remote?: string;
    experienceLevel?: string;
    studioType?: string;
    platform?: string;
    genre?: string;
    page?: string;
    limit?: string;
};
export declare const jobsListQuerySchema: import("typebox").TObject<{
    q: import("typebox").TOptional<import("typebox").TString>;
    location: import("typebox").TOptional<import("typebox").TString>;
    remote: import("typebox").TOptional<import("typebox").TString>;
    experienceLevel: import("typebox").TOptional<import("typebox").TString>;
    studioType: import("typebox").TOptional<import("typebox").TString>;
    platform: import("typebox").TOptional<import("typebox").TString>;
    genre: import("typebox").TOptional<import("typebox").TString>;
    page: import("typebox").TOptional<import("typebox").TString>;
    limit: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const jobIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type JobIdParams = Static<typeof jobIdParamsSchema>;
export declare const saveJobBodySchema: import("typebox").TObject<{
    jobId: import("typebox").TString;
}>;
export type SaveJobBody = Static<typeof saveJobBodySchema>;
export declare const savedJobParamsSchema: import("typebox").TObject<{
    jobId: import("typebox").TString;
}>;
export type SavedJobParams = Static<typeof savedJobParamsSchema>;
export declare const applyJobBodySchema: import("typebox").TObject<{
    jobId: import("typebox").TString;
    notes: import("typebox").TOptional<import("typebox").TString>;
}>;
export type ApplyJobBody = Static<typeof applyJobBodySchema>;
export declare const updateApplicationParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type UpdateApplicationParams = Static<typeof updateApplicationParamsSchema>;
export declare const updateApplicationBodySchema: import("typebox").TObject<{
    status: import("typebox").TOptional<import("typebox").TString>;
    notes: import("typebox").TOptional<import("typebox").TString>;
}>;
export type UpdateApplicationBody = Static<typeof updateApplicationBodySchema>;
export declare const jobEntityResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    title: import("typebox").TString;
    company: import("typebox").TString;
    location: import("typebox").TString;
    remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
    hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
    salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
    description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
    companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
    createdAt: import("typebox").TOptional<import("typebox").TString>;
    updatedAt: import("typebox").TOptional<import("typebox").TString>;
    matchScore: import("typebox").TOptional<import("typebox").TNumber>;
    matchReason: import("typebox").TOptional<import("typebox").TString>;
    rank: import("typebox").TOptional<import("typebox").TNumber>;
}>;
export declare const jobsListResponseSchema: import("typebox").TObject<{
    jobs: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        title: import("typebox").TString;
        company: import("typebox").TString;
        location: import("typebox").TString;
        remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
        matchScore: import("typebox").TOptional<import("typebox").TNumber>;
        matchReason: import("typebox").TOptional<import("typebox").TString>;
        rank: import("typebox").TOptional<import("typebox").TNumber>;
    }>>;
    page: import("typebox").TNumber;
    limit: import("typebox").TNumber;
    total: import("typebox").TNumber;
}>;
export declare const savedJobResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    jobId: import("typebox").TString;
    savedAt: import("typebox").TString;
}>;
export declare const applicationResponseSchema: import("typebox").TObject<{
    id: import("typebox").TString;
    jobId: import("typebox").TString;
    status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
    timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
    createdAt: import("typebox").TOptional<import("typebox").TString>;
    updatedAt: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const jobsRefreshResponseSchema: import("typebox").TObject<{
    message: import("typebox").TString;
    status: import("typebox").TString;
    totalJobs: import("typebox").TNumber;
    newJobs: import("typebox").TNumber;
    updatedJobs: import("typebox").TNumber;
}>;
export declare const jobsListResponses: {
    readonly 200: import("typebox").TObject<{
        jobs: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            title: import("typebox").TString;
            company: import("typebox").TString;
            location: import("typebox").TString;
            remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
            hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
            salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
            description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
            createdAt: import("typebox").TOptional<import("typebox").TString>;
            updatedAt: import("typebox").TOptional<import("typebox").TString>;
            matchScore: import("typebox").TOptional<import("typebox").TNumber>;
            matchReason: import("typebox").TOptional<import("typebox").TString>;
            rank: import("typebox").TOptional<import("typebox").TNumber>;
        }>>;
        page: import("typebox").TNumber;
        limit: import("typebox").TNumber;
        total: import("typebox").TNumber;
    }>;
};
export declare const jobEntityResponses: {
    readonly 200: import("typebox").TObject<{
        id: import("typebox").TString;
        title: import("typebox").TString;
        company: import("typebox").TString;
        location: import("typebox").TString;
        remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
        salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
        companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
        matchScore: import("typebox").TOptional<import("typebox").TNumber>;
        matchReason: import("typebox").TOptional<import("typebox").TString>;
        rank: import("typebox").TOptional<import("typebox").TNumber>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const saveJobResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TOptional<import("typebox").TString>;
        saved: import("typebox").TOptional<import("typebox").TObject<{
            id: import("typebox").TString;
            jobId: import("typebox").TString;
            savedAt: import("typebox").TString;
        }>>;
        id: import("typebox").TOptional<import("typebox").TString>;
        jobId: import("typebox").TOptional<import("typebox").TString>;
        savedAt: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 201: import("typebox").TObject<{
        id: import("typebox").TString;
        jobId: import("typebox").TString;
        savedAt: import("typebox").TString;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const deleteSavedJobResponses: {
    readonly 200: import("typebox").TObject<{
        success: import("typebox").TBoolean;
        deleted: import("typebox").TUnknown;
    }>;
};
export declare const savedJobsListResponses: {
    readonly 200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        jobId: import("typebox").TString;
        savedAt: import("typebox").TString;
        job: import("typebox").TUnion<[import("typebox").TObject<{
            id: import("typebox").TString;
            title: import("typebox").TString;
            company: import("typebox").TString;
            location: import("typebox").TString;
            remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
            hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
            salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
            description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
            createdAt: import("typebox").TOptional<import("typebox").TString>;
            updatedAt: import("typebox").TOptional<import("typebox").TString>;
            matchScore: import("typebox").TOptional<import("typebox").TNumber>;
            matchReason: import("typebox").TOptional<import("typebox").TString>;
            rank: import("typebox").TOptional<import("typebox").TNumber>;
        }>, import("typebox").TNull]>;
    }>>;
};
export declare const applyJobResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TOptional<import("typebox").TString>;
        application: import("typebox").TOptional<import("typebox").TObject<{
            id: import("typebox").TString;
            jobId: import("typebox").TString;
            status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
            appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
            createdAt: import("typebox").TOptional<import("typebox").TString>;
            updatedAt: import("typebox").TOptional<import("typebox").TString>;
        }>>;
        id: import("typebox").TOptional<import("typebox").TString>;
        jobId: import("typebox").TOptional<import("typebox").TString>;
        status: import("typebox").TOptional<import("typebox").TString>;
        appliedDate: import("typebox").TOptional<import("typebox").TString>;
        notes: import("typebox").TOptional<import("typebox").TString>;
        timeline: import("typebox").TOptional<import("typebox").TArray<import("typebox").TUnknown>>;
    }>;
    readonly 201: import("typebox").TObject<{
        id: import("typebox").TString;
        jobId: import("typebox").TString;
        status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const updateApplicationResponses: {
    readonly 200: import("typebox").TObject<{
        id: import("typebox").TString;
        jobId: import("typebox").TString;
        status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const applicationsListResponses: {
    readonly 200: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        jobId: import("typebox").TString;
        status: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
        appliedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        notes: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
        timeline: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TUnknown>, import("typebox").TNull]>>;
        createdAt: import("typebox").TOptional<import("typebox").TString>;
        updatedAt: import("typebox").TOptional<import("typebox").TString>;
    }>>;
};
export declare const recommendationsResponses: {
    readonly 200: import("typebox").TObject<{
        recommendations: import("typebox").TArray<import("typebox").TObject<{
            id: import("typebox").TString;
            title: import("typebox").TString;
            company: import("typebox").TString;
            location: import("typebox").TString;
            remote: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
            hybrid: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TBoolean, import("typebox").TNull]>>;
            salary: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
            description: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            requirements: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            technologies: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            experienceLevel: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            postedDate: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            url: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            source: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            studioType: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            gameGenres: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            platforms: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            contentHash: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            tags: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>>;
            companyLogo: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            applicationUrl: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>>;
            enrichment: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TUnknown, import("typebox").TNull]>>;
            createdAt: import("typebox").TOptional<import("typebox").TString>;
            updatedAt: import("typebox").TOptional<import("typebox").TString>;
            matchScore: import("typebox").TOptional<import("typebox").TNumber>;
            matchReason: import("typebox").TOptional<import("typebox").TString>;
            rank: import("typebox").TOptional<import("typebox").TNumber>;
        }>>;
        reason: import("typebox").TString;
        aiPowered: import("typebox").TBoolean;
        provider: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const jobsRefreshResponses: {
    readonly 200: import("typebox").TObject<{
        message: import("typebox").TString;
        status: import("typebox").TString;
        totalJobs: import("typebox").TNumber;
        newJobs: import("typebox").TNumber;
        updatedJobs: import("typebox").TNumber;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export { HTTP_STATUS_CREATED };
