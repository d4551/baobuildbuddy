import type { BaoExportData, ImportResult } from "./data-service-contracts";
import { exportAllData } from "./data-service-export";
import { importAllData } from "./data-service-import";

export class DataService {
  async exportAll(): Promise<BaoExportData> {
    return exportAllData();
  }

  async importAll(data: BaoExportData): Promise<ImportResult> {
    return importAllData(data);
  }
}

export const dataService = new DataService();
