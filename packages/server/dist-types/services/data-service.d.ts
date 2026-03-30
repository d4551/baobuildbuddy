export { DATA_EXPORT_VERSION, type BaoExportData, type ImportResult } from "./data-service-contracts";
import type { BaoExportData, ImportResult } from "./data-service-contracts";
export declare class DataService {
    exportAll(): Promise<BaoExportData>;
    importAll(data: BaoExportData): Promise<ImportResult>;
}
export declare const dataService: DataService;
