import type { BaoImportData } from "./data-service-contracts";
export declare const importResumesSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importCoverLettersSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importPortfolioProjectsSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importInterviewSessionsSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importSkillMappingsSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importChatHistorySection: (data: BaoImportData, imported: Record<string, number>) => Promise<void>;
