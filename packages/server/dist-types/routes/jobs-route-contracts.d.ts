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
export { HTTP_STATUS_CREATED };
