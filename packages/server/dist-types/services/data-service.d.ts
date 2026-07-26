import type { BaoExportData, BaoImportData, ImportResult } from "./data-service-contracts";
export declare class DataService {
    exportAll(): Promise<BaoExportData>;
    importAll(data: BaoImportData): Promise<ImportResult>;
}
export declare const dataService: DataService;
