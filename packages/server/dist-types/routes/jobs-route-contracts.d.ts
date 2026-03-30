import { HTTP_STATUS_CREATED } from "@bao/shared";
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
export declare const jobsListQuerySchema: import("@sinclair/typebox").TObject<{
    q: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    location: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    remote: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    experienceLevel: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    studioType: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    platform: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    genre: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    page: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    limit: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const jobIdParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export declare const saveJobBodySchema: import("@sinclair/typebox").TObject<{
    jobId: import("@sinclair/typebox").TString;
}>;
export declare const savedJobParamsSchema: import("@sinclair/typebox").TObject<{
    jobId: import("@sinclair/typebox").TString;
}>;
export declare const applyJobBodySchema: import("@sinclair/typebox").TObject<{
    jobId: import("@sinclair/typebox").TString;
    notes: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const updateApplicationParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export declare const updateApplicationBodySchema: import("@sinclair/typebox").TObject<{
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    notes: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export { HTTP_STATUS_CREATED };
