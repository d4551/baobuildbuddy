import { type FieldMapperAIClient, type SmartFieldAnalysisResult } from "./smart-field-mapper-contracts";
export declare const stripToFormElements: (html: string) => string;
export declare const generateFieldAnalysisWithRetry: (params: {
    aiService: FieldMapperAIClient;
    strippedHtml: string;
    fieldsNeeded: string[];
    candidateContext: string;
    attemptsRemaining: number;
    delayMs: number;
}) => Promise<SmartFieldAnalysisResult>;
