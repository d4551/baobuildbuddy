import type { ResumeData } from "@bao/shared";
/**
 * Resume persistence service with validation and normalization from storage records.
 */
export declare class ResumeService {
    private toResumeData;
    /**
     * Get all resumes
     */
    getResumes(): Promise<ResumeData[]>;
    /**
     * Get a single resume by ID
     */
    getResume(id: string): Promise<ResumeData | null>;
    /**
     * Create a new resume
     */
    createResume(data: Omit<ResumeData, "id">): Promise<ResumeData>;
    /**
     * Update an existing resume
     */
    updateResume(id: string, data: Partial<ResumeData>): Promise<ResumeData | null>;
    /**
     * Delete a resume by ID
     */
    deleteResume(id: string): Promise<boolean>;
    /**
     * Set a resume as default, unmarking all others
     */
    setDefaultResume(id: string): Promise<ResumeData | null>;
    private normalizeTemplate;
    private normalizeTheme;
}
/**
 * Shared singleton instance for resume CRUD operations.
 */
export declare const resumeService: ResumeService;
