import type { BaoImportData } from "./data-service-contracts";
export declare const importProfileSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importSettingsSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importGamificationSection: (data: BaoImportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
