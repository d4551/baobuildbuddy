import type { CoverLetterData } from "@bao/shared";
export declare class CoverLetterService {
    private toCoverLetterData;
    /**
     * Get all cover letters
     */
    getCoverLetters(): Promise<CoverLetterData[]>;
    /**
     * Get a single cover letter by ID
     */
    getCoverLetter(id: string): Promise<CoverLetterData | null>;
    /**
     * Create a new cover letter
     */
    createCoverLetter(data: Omit<CoverLetterData, "id">): Promise<CoverLetterData>;
    /**
     * Update an existing cover letter
     */
    updateCoverLetter(id: string, data: Partial<CoverLetterData>): Promise<CoverLetterData | null>;
    /**
     * Delete a cover letter by ID
     */
    deleteCoverLetter(id: string): Promise<boolean>;
}
export declare const coverLetterService: CoverLetterService;
