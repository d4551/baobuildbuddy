import type { AIResponse } from "@bao/shared";
/**
 * Minimal AI client contract required by smart field mapping.
 */
export interface FieldMapperAIClient {
    generate: (prompt: string, options?: {
        temperature?: number;
        maxTokens?: number;
    }) => Promise<AIResponse>;
}
/**
 * Candidate context supplied to AI-assisted form analysis.
 */
export interface SmartFieldAnalysisContext {
    readonly resume: Record<string, unknown>;
    readonly coverLetter?: Record<string, unknown> | null;
    readonly existingAnswers?: Record<string, string>;
}
/**
 * AI-generated selector hints plus inferred answers for non-core form fields.
 */
export interface SmartFieldAnalysisResult {
    readonly selectorMap: Record<string, string[]>;
    readonly fieldAnswers: Record<string, string>;
}
/**
 * AI-powered selector mapper for job-application form fields.
 */
export declare class SmartFieldMapper {
    /**
     * Analyzes a job page and returns validated selector candidates plus inferred answers.
     */
    analyze(jobUrl: string, fieldsNeeded: string[], context: SmartFieldAnalysisContext, aiService: FieldMapperAIClient): Promise<SmartFieldAnalysisResult>;
    /**
     * Fetches page HTML and retries for transient failures.
     */
    private fetchPageWithRetry;
    /**
     * Fetches page HTML with a deterministic timeout and status checks.
     */
    private fetchPage;
    /**
     * Executes AI analysis with bounded retries and exponential backoff.
     */
    private generateFieldAnalysisWithRetry;
    /**
     * Parses and validates selector/answer JSON emitted by the AI provider.
     */
    private parseFieldAnalysisResponse;
    /**
     * Strips an HTML document to form-relevant elements only.
     */
    private stripToFormElements;
}
export declare const smartFieldMapper: SmartFieldMapper;
