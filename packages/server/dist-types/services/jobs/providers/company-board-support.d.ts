import type { CompanyBoardATSType, JobProviderSettings } from "@bao/shared/types/settings-contracts";
import type { JsonObject, JsonValue } from "@bao/shared/utils/json";
export interface ATSJob {
    id?: string;
    title?: string;
    text?: string;
    name?: string;
    content?: string;
    description?: string;
    descriptionPlain?: string;
    location?: {
        name?: string;
        city?: string;
    } | string;
    offices?: Array<{
        name?: string;
    }>;
    categories?: {
        location?: string;
    };
    absolute_url?: string;
    hostedUrl?: string;
    applyUrl?: string;
    url?: string;
    ref?: string;
    updated_at?: string;
    created_at?: string;
    createdAt?: number | string;
    releasedDate?: string;
    [key: string]: JsonValue | undefined;
}
type ATSResponseFields = {
    jobs?: ATSJob[];
    content?: ATSJob[];
    postings?: ATSJob[];
    results?: ATSJob[];
    data?: ATSJob[];
};
export type ATSResponse = ATSJob[] | (ATSResponseFields & JsonObject);
export declare const isAtsResponse: <T>(value: T) => value is T & ATSResponse;
export declare const resolveLocation: (location: ATSJob["location"]) => string;
export declare const toISODate: (value?: string | number) => string;
export declare const resolveHashFragment: (job: ATSJob) => string;
export declare const resolveJobs: (data: ATSResponse, keys: ReadonlyArray<keyof ATSResponseFields>) => ATSJob[];
export declare const resolveBoardUrl: (providerType: CompanyBoardATSType, token: string, settings: JobProviderSettings) => string;
export {};
