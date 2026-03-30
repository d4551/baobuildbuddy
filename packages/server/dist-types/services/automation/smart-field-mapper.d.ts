import { type FieldMapperAIClient, type SmartFieldAnalysisContext, type SmartFieldAnalysisResult } from "./smart-field-mapper-contracts";
/**
 * AI-powered selector mapper for job-application form fields.
 */
export declare class SmartFieldMapper {
    /**
     * Analyzes a job page and returns validated selector candidates plus inferred answers.
     */
    analyze(jobUrl: string, fieldsNeeded: string[], context: SmartFieldAnalysisContext, aiService: FieldMapperAIClient): Promise<SmartFieldAnalysisResult>;
}
export declare const smartFieldMapper: SmartFieldMapper;
export type { FieldMapperAIClient, SmartFieldAnalysisContext, SmartFieldAnalysisResult, } from "./smart-field-mapper-contracts";
