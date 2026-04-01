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
