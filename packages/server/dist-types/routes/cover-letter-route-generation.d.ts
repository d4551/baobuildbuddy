import type { RouteSetState } from "../types/route-state";
import type { GenerateCoverLetterBody } from "./cover-letter-route-contracts";
import { type GeneratedCoverLetterContent } from "./cover-letter-route-generation-support";
export declare const handleGenerateCoverLetter: (body: GenerateCoverLetterBody, set: RouteSetState) => Promise<{
    details?: undefined;
    error: string;
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
    details?: undefined;
    error?: undefined;
    message: string;
    content: GeneratedCoverLetterContent;
    coverLetter?: undefined;
} | {
    details?: undefined;
    error?: undefined;
    content?: undefined;
    message: string;
    coverLetter: {
        id: string;
        company: string;
        position: string;
        jobInfo: Record<string, unknown>;
        content: GeneratedCoverLetterContent;
        template: "creative" | "executive" | "gaming" | "professional" | "technical";
    };
}>;
export declare const exportCoverLetterAttachment: (id: string, format: string | undefined, set: RouteSetState) => Promise<Response | {
    error: string;
}>;
