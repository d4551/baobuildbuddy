export declare const DATA_EXPORT_VERSION: "1.0";
export interface BaoExportData {
    version: typeof DATA_EXPORT_VERSION;
    exportedAt: string;
    profile: unknown | null;
    settings: unknown | null;
    resumes: unknown[];
    coverLetters: unknown[];
    portfolio: unknown | null;
    portfolioProjects: unknown[];
    interviewSessions: unknown[];
    gamification: unknown | null;
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
