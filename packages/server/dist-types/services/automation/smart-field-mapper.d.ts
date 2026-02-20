import type { AIService } from "../ai/ai-service";
/**
 * AI-powered form field analyzer that maps job application form fields
 * to optimal CSS selectors. Falls back gracefully when AI is unavailable.
 */
export declare class SmartFieldMapper {
    /**
     * Fetch a job page, strip it to form-relevant elements, and use AI to
     * map field names to CSS selectors.
     *
     * @returns A mapping of field names to prioritized selector arrays,
     *          or an empty object if analysis fails (hardcoded selectors still work).
     */
    analyze(jobUrl: string, fieldsNeeded: string[], aiService: AIService): Promise<Record<string, string[]>>;
    /**
     * Fetch page HTML with a short timeout.
     */
    private fetchPage;
    /**
     * Strip an HTML document down to only form-relevant elements:
     * <form>, <input>, <textarea>, <select>, <label>, <button>.
     *
     * Truncates to ~4000 chars to keep AI prompt costs low.
     */
    private stripToFormElements;
}
export declare const smartFieldMapper: SmartFieldMapper;
