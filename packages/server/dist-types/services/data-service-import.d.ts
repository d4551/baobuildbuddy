import type { BaoExportData, ImportResult } from "./data-service-contracts";
/**
 * Import data from a BaoBuildBuddy export JSON.
 * Uses a transaction for atomicity.
 */
export declare const importAllData: (data: BaoExportData) => Promise<ImportResult>;
