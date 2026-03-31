import type { GenerateCoverLetterBody, RouteSetState } from "./cover-letter-route-contracts";
type GeneratedCoverLetterContent = {
    introduction: string;
    body: string;
    conclusion: string;
};
export declare const handleGenerateCoverLetter: (body: GenerateCoverLetterBody, set: RouteSetState) => Promise<{
    error: string;
    details?: undefined;
    message?: undefined;
    content?: undefined;
    coverLetter?: undefined;
} | {
    error: string;
    details: string;
    message?: undefined;
    content?: undefined;
    coverLetter?: undefined;
} | {
    message: string;
    content: GeneratedCoverLetterContent;
    error?: undefined;
    details?: undefined;
    coverLetter?: undefined;
} | {
    message: string;
    coverLetter: {
        id: string;
        company: string;
        position: string;
        jobInfo: Record<string, unknown>;
        content: GeneratedCoverLetterContent;
        template: "creative" | "gaming" | "executive" | "technical" | "professional";
    };
    error?: undefined;
    details?: undefined;
    content?: undefined;
}>;
export declare const exportCoverLetterAttachment: (id: string, format: string | undefined, set: RouteSetState) => Promise<Response | {
    error: string;
    details: string;
} | {
    error: string;
}>;
export {};
