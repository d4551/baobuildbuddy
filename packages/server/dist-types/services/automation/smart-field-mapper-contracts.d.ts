import type { AIResponse } from "@bao/shared/types/ai";
import type { JsonObject } from "@bao/shared/utils/json";
import { z } from "zod";
export interface FieldMapperAIClient {
    generate: (prompt: string, options?: {
        purpose?: "automationFieldMapping";
        temperature?: number;
        maxTokens?: number;
    }) => Promise<AIResponse>;
}
export interface SmartFieldAnalysisContext {
    readonly resume: JsonObject;
    readonly coverLetter?: JsonObject | null;
    readonly existingAnswers?: Record<string, string>;
    readonly jobContext?: string;
    readonly studioContext?: string;
    readonly skillContext?: string;
    readonly profileContext?: string;
    readonly portfolioContext?: string;
}
export interface SmartFieldAnalysisResult {
    readonly selectorMap: Record<string, string[]>;
    readonly fieldAnswers: Record<string, string>;
}
export type FetchPageResult = {
    ok: true;
    html: string;
} | {
    ok: false;
    statusCode?: number;
    message: string;
};
export declare const selectorMapSchema: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>;
export declare const fieldAnswersSchema: z.ZodRecord<z.ZodString, z.ZodString>;
export declare const fieldAnalysisSchema: z.ZodObject<{
    selectorMap: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString>>>;
    fieldAnswers: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export declare const EMPTY_FIELD_ANALYSIS_RESULT: {
    selectorMap: {};
    fieldAnswers: {};
};
