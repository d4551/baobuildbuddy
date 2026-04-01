import type { BaoExportData } from "./data-service-contracts";
export declare const importProfileSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importSettingsSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
export declare const importGamificationSection: (data: BaoExportData, imported: Record<string, number>, errors: string[]) => Promise<void>;
