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
 * AI-powered selector mapper for job-application form fields.
 */
export declare class SmartFieldMapper {
    /**
     * Analyzes a job page and returns validated selector candidates for requested fields.
     */
    analyze(jobUrl: string, fieldsNeeded: string[], aiService: FieldMapperAIClient): Promise<Record<string, string[]>>;
    /**
     * Fetches page HTML with a deterministic timeout and status checks.
     */
    private fetchPage;
    /**
     * Executes AI analysis with bounded retries and exponential backoff.
     */
    private generateSelectorMapWithRetry;
    /**
     * Parses and validates selector-map JSON emitted by the AI provider.
     */
    private parseSelectorResponse;
    /**
     * Strips an HTML document to form-relevant elements only.
     */
    private stripToFormElements;
}
export declare const smartFieldMapper: SmartFieldMapper;
