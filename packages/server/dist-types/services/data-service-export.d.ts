import type { BaoExportData } from "./data-service-contracts";
/**
 * Export all user data as JSON.
 * API keys are redacted for security.
 */
export declare const exportAllData: () => Promise<BaoExportData>;
