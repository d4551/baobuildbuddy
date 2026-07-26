import type { BaoExportData, BaoImportData, ImportResult } from "./data-service-contracts";
import { exportAllData } from "./data-service-export";
import { importAllData } from "./data-service-import";

export class DataService {
  async exportAll(): Promise<BaoExportData> {
    return exportAllData();
  }

  async importAll(data: BaoImportData): Promise<ImportResult> {
    return importAllData(data);
  }
}

export const dataService = new DataService();
