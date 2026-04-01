import { HTTP_STATUS_CREATED } from "@bao/shared/constants/http";
import Type, { type StaticParse } from "baobox";
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
}, never, Type.InferOptionalKeys<{
    readonly q: Type.TOptional<Type.TString>;
    readonly location: Type.TOptional<Type.TString>;
    readonly remote: Type.TOptional<Type.TString>;
    readonly experienceLevel: Type.TOptional<Type.TString>;
    readonly studioType: Type.TOptional<Type.TString>;
    readonly platform: Type.TOptional<Type.TString>;
    readonly genre: Type.TOptional<Type.TString>;
    readonly page: Type.TOptional<Type.TString>;
    readonly limit: Type.TOptional<Type.TString>;
}>>;
export declare const jobIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type JobIdParams = StaticParse<typeof jobIdParamsSchema>;
export declare const saveJobBodySchema: Type.TObject<{
    readonly jobId: Type.TString;
}, "jobId", never>;
export type SaveJobBody = StaticParse<typeof saveJobBodySchema>;
export declare const savedJobParamsSchema: Type.TObject<{
    readonly jobId: Type.TString;
}, "jobId", never>;
export type SavedJobParams = StaticParse<typeof savedJobParamsSchema>;
export declare const applyJobBodySchema: Type.TObject<{
    readonly jobId: Type.TString;
    readonly notes: Type.TOptional<Type.TString>;
}, "jobId", "notes">;
export type ApplyJobBody = StaticParse<typeof applyJobBodySchema>;
export declare const updateApplicationParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type UpdateApplicationParams = StaticParse<typeof updateApplicationParamsSchema>;
export declare const updateApplicationBodySchema: Type.TObject<{
    readonly status: Type.TOptional<Type.TString>;
    readonly notes: Type.TOptional<Type.TString>;
}, never, Type.InferOptionalKeys<{
    readonly status: Type.TOptional<Type.TString>;
    readonly notes: Type.TOptional<Type.TString>;
}>>;
export type UpdateApplicationBody = StaticParse<typeof updateApplicationBodySchema>;
export { HTTP_STATUS_CREATED };
