import type { BaoImportData, ImportResult } from "./data-service-contracts";
/**
 * Import data from a BaoBuildBuddy export JSON.
 * Uses a transaction for atomicity.
 */
export declare const importAllData: (data: BaoImportData) => Promise<ImportResult>;
