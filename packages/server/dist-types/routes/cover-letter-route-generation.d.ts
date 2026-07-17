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
    details: string;
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
        jobInfo: Record<string, unknown>;
        content: GeneratedCoverLetterContent;
        template: "creative" | "executive" | "gaming" | "professional" | "technical";
    };
}>;
export declare const exportCoverLetterAttachment: (id: string, format: string | undefined, set: RouteSetState) => Promise<Response | {
    error: string;
    details: string;
} | {
    error: string;
}>;
