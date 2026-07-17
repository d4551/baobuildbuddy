import { HTTP_STATUS_CREATED, HTTP_STATUS_NOT_FOUND } from "@bao/shared/constants/http";
import { applications, savedJobs } from "../db/schema/jobs";
import type { JobListQuery } from "./jobs-route-contracts";
type SavedJobRow = typeof savedJobs.$inferSelect;
type ApplicationRow = typeof applications.$inferSelect;
type RouteErrorBody = {
    error: string;
};
type SaveJobResult = {
    status: typeof HTTP_STATUS_NOT_FOUND;
    body: RouteErrorBody;
} | {
    status: null;
    body: {
        message: string;
        saved: SavedJobRow;
    };
} | {
    status: typeof HTTP_STATUS_CREATED;
    body: SavedJobRow;
};
type NewApplicationBody = {
    id: string;
    jobId: string;
    status: string;
    appliedDate: string;
    notes: string;
    timeline: Array<{
        status: string;
        date: string;
        notes: string;
    }>;
};
type CreateApplicationResult = {
    status: typeof HTTP_STATUS_NOT_FOUND;
    body: RouteErrorBody;
} | {
    status: null;
    body: {
        message: string;
        application: ApplicationRow;
    };
} | {
    status: typeof HTTP_STATUS_CREATED;
    body: NewApplicationBody;
};
type UpdateApplicationResult = {
    status: typeof HTTP_STATUS_NOT_FOUND;
    body: RouteErrorBody;
} | {
    status: null;
    body: ApplicationRow;
};
export declare const listJobs: (query: JobListQuery) => Promise<{
    jobs: {
        applicationUrl: string | null;
        company: string;
        companyLogo: string | null;
        contentHash: string | null;
        createdAt: string;
        description: string | null;
        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
        experienceLevel: string | null;
        gameGenres: string[] | null;
        hybrid: boolean | null;
        id: string;
        location: string;
        platforms: string[] | null;
        postedDate: string | null;
        remote: boolean | null;
        requirements: string[] | null;
        salary: Record<string, unknown> | null;
        source: string | null;
        studioType: string | null;
        tags: string[] | null;
        technologies: string[] | null;
        title: string;
        type: string | null;
        updatedAt: string;
        url: string | null;
    }[];
    page: number;
    limit: number;
    total: number;
}>;
export declare const getJobById: (id: string) => Promise<{
    id: string;
    title: string;
    company: string;
    location: string;
    remote: boolean | null;
    hybrid: boolean | null;
    salary: Record<string, unknown> | null;
    description: string | null;
    requirements: string[] | null;
    technologies: string[] | null;
    experienceLevel: string | null;
    type: string | null;
    postedDate: string | null;
    url: string | null;
    source: string | null;
    studioType: string | null;
    gameGenres: string[] | null;
    platforms: string[] | null;
    contentHash: string | null;
    tags: string[] | null;
    companyLogo: string | null;
    applicationUrl: string | null;
    enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
    createdAt: string;
    updatedAt: string;
}>;
export declare const saveJob: (jobId: string) => Promise<SaveJobResult>;
export declare const deleteSavedJob: (jobId: string) => Promise<{
    success: boolean;
    deleted: void;
}>;
export declare const listSavedJobs: () => Promise<{
    id: string;
    jobId: string;
    savedAt: string;
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
        remote: boolean | null;
        hybrid: boolean | null;
        salary: Record<string, unknown> | null;
        description: string | null;
        requirements: string[] | null;
        technologies: string[] | null;
        experienceLevel: string | null;
        type: string | null;
        postedDate: string | null;
        url: string | null;
        source: string | null;
        studioType: string | null;
        gameGenres: string[] | null;
        platforms: string[] | null;
        contentHash: string | null;
        tags: string[] | null;
        companyLogo: string | null;
        applicationUrl: string | null;
        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
        createdAt: string;
        updatedAt: string;
    } | null;
}[]>;
export declare const createApplication: (jobId: string, notes: string) => Promise<CreateApplicationResult>;
export declare const updateApplication: (id: string, newStatus: string | undefined, notes: string | undefined) => Promise<UpdateApplicationResult>;
export declare const listApplications: () => Promise<{
    id: string;
    jobId: string;
    status: string | null;
    appliedDate: string;
    notes: string | null;
    timeline: unknown[] | null;
    createdAt: string;
    updatedAt: string;
    job: {
        id: string;
        title: string;
        company: string;
        location: string;
        remote: boolean | null;
        hybrid: boolean | null;
        salary: Record<string, unknown> | null;
        description: string | null;
        requirements: string[] | null;
        technologies: string[] | null;
        experienceLevel: string | null;
        type: string | null;
        postedDate: string | null;
        url: string | null;
        source: string | null;
        studioType: string | null;
        gameGenres: string[] | null;
        platforms: string[] | null;
        contentHash: string | null;
        tags: string[] | null;
        companyLogo: string | null;
        applicationUrl: string | null;
        enrichment: import("@bao/shared/types/jobs").ScrapePersonaEnrichment | null;
        createdAt: string;
        updatedAt: string;
    } | null;
}[]>;
export {};
