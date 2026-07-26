import type { RouteSetState } from "../types/route-state";
import type { GenerateCoverLetterBody } from "./cover-letter-route-contracts";
import { type GeneratedCoverLetterContent } from "./cover-letter-route-generation-support";
export declare const handleGenerateCoverLetter: (body: GenerateCoverLetterBody, set: RouteSetState) => Promise<{
    error: string;
    details?: undefined;
    content?: undefined;
    message?: undefined;
    coverLetter?: undefined;
} | {
    error: string;
    details: import("./cover-letter-route-generation-support").CoverLetterContentError;
    content?: undefined;
    message?: undefined;
    coverLetter?: undefined;
} | {
    error?: undefined;
    details?: undefined;
    message: string;
    content: GeneratedCoverLetterContent;
    coverLetter?: undefined;
} | {
    error?: undefined;
    details?: undefined;
    content?: undefined;
    message: string;
    coverLetter: {
        id: string;
        company: string;
        position: string;
        jobInfo: Record<string, unknown> | null;
        content: Record<string, unknown> | null;
        template: string | null;
        createdAt: string;
        updatedAt: string;
    };
}>;
export declare const exportCoverLetterAttachment: (id: string, format: string | undefined, set: RouteSetState, templateOverride?: string | null) => Promise<Response | {
    error: string;
}>;
