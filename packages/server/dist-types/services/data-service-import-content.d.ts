import type { BaoExportData } from "./data-service-contracts";
export declare const importResumesSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importCoverLettersSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importPortfolioProjectsSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importInterviewSessionsSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importSkillMappingsSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importChatHistorySection: (data: BaoExportData, imported: Record<string, number>) => Promise<void>;
