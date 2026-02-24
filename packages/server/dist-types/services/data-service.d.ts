export declare const DATA_EXPORT_VERSION: "1.0";
export interface BaoExportData {
    version: string;
    exportedAt: string;
    profile: unknown;
    settings: unknown;
    resumes: unknown[];
    coverLetters: unknown[];
    portfolio: unknown;
    portfolioProjects: unknown[];
    interviewSessions: unknown[];
    gamification: unknown;
    skillMappings: unknown[];
    savedJobs: unknown[];
    applications: unknown[];
    chatHistory: unknown[];
}
export interface ImportResult {
    imported: Record<string, number>;
    skipped: Record<string, number>;
    errors: string[];
}
export declare class DataService {
    /**
     * Export all user data as JSON
     * API keys are redacted for security
     */
    exportAll(): Promise<BaoExportData>;
    /**
     * Import data from a BaoBuildBuddy export JSON
     * Uses a transaction for atomicity
     */
    importAll(data: BaoExportData): Promise<ImportResult>;
}
export declare const dataService: DataService;
