import { HTTP_STATUS_CREATED } from "@bao/shared";
import Type from "baobox";
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
export declare const jobsListQuerySchema: Type.TObject<{
    readonly q: Type.TOptional<Type.TString>;
    readonly location: Type.TOptional<Type.TString>;
    readonly remote: Type.TOptional<Type.TString>;
    readonly experienceLevel: Type.TOptional<Type.TString>;
    readonly studioType: Type.TOptional<Type.TString>;
    readonly platform: Type.TOptional<Type.TString>;
    readonly genre: Type.TOptional<Type.TString>;
    readonly page: Type.TOptional<Type.TString>;
    readonly limit: Type.TOptional<Type.TString>;
}, never, never>;
export declare const jobIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export declare const saveJobBodySchema: Type.TObject<{
    readonly jobId: Type.TString;
}, "jobId", never>;
export declare const savedJobParamsSchema: Type.TObject<{
    readonly jobId: Type.TString;
}, "jobId", never>;
export declare const applyJobBodySchema: Type.TObject<{
    readonly jobId: Type.TString;
    readonly notes: Type.TOptional<Type.TString>;
}, "jobId", never>;
export declare const updateApplicationParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export declare const updateApplicationBodySchema: Type.TObject<{
    readonly status: Type.TOptional<Type.TString>;
    readonly notes: Type.TOptional<Type.TString>;
}, never, never>;
export { HTTP_STATUS_CREATED };
