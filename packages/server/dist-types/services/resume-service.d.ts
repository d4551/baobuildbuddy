import type { ResumeData } from "@bao/shared";
export declare class ResumeService {
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
export declare const resumeService: ResumeService;
