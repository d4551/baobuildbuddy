import { type CoverLetterTemplate } from "@bao/shared/constants/cover-letter";
import type { RouteSetState } from "../types/route-state";
export declare const normalizeTemplate: (value: string | undefined) => CoverLetterTemplate;
export declare const listCoverLetters: () => Promise<{
    id: string;
    company: string;
    position: string;
    jobInfo: Record<string, unknown> | null;
    content: Record<string, unknown> | null;
    template: string | null;
    createdAt: string;
    updatedAt: string;
}[]>;
export declare const createCoverLetter: (body: {
    company: string;
    position: string;
    jobInfo?: Record<string, unknown>;
    content?: Record<string, unknown>;
    template?: string;
}) => Promise<{
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
    statusCode: number;
}>;
export declare const getCoverLetterById: (id: string, set: RouteSetState) => Promise<{
    id: string;
    company: string;
    position: string;
    jobInfo: Record<string, unknown> | null;
    content: Record<string, unknown> | null;
    template: string | null;
    createdAt: string;
    updatedAt: string;
} | null>;
export declare const updateCoverLetter: (id: string, body: {
    company?: string;
    position?: string;
    jobInfo?: Record<string, unknown>;
    content?: Record<string, unknown>;
    template?: string;
}, set: RouteSetState) => Promise<{
    id: string;
    company: string;
    position: string;
    jobInfo: Record<string, unknown> | null;
    content: Record<string, unknown> | null;
    template: string | null;
    createdAt: string;
    updatedAt: string;
} | {
    error: string;
}>;
export declare const deleteCoverLetter: (id: string, set: RouteSetState) => Promise<{
    error: string;
    success?: undefined;
    id?: undefined;
} | {
    error?: undefined;
    success: boolean;
    id: string;
}>;
