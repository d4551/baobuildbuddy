import { settle, toErrorMessage } from "@bao/shared";
import { sqlite } from "../db/client";
import { DATA_EXPORT_VERSION } from "./data-service-contracts";
import type { BaoExportData, ImportResult } from "./data-service-contracts";
import {
  importCoverLettersSection,
  importChatHistorySection,
  importInterviewSessionsSection,
  importPortfolioProjectsSection,
  importResumesSection,
  importSkillMappingsSection,
} from "./data-service-import-content";
import {
  importGamificationSection,
  importProfileSection,
  importSettingsSection,
} from "./data-service-import-foundation";

const executeImportTransaction = async (
  data: BaoExportData,
  imported: Record<string, number>,
  errors: string[],
): Promise<void> => {
  await importProfileSection(data, imported, errors);
  await importSettingsSection(data, imported, errors);
  await importResumesSection(data, imported, errors);
  await importCoverLettersSection(data, imported, errors);
  await importPortfolioProjectsSection(data, imported, errors);
  await importInterviewSessionsSection(data, imported, errors);
  await importGamificationSection(data, imported, errors);
  await importSkillMappingsSection(data, imported, errors);
  await importChatHistorySection(data, imported);
  sqlite.exec("COMMIT");
};

/**
 * Import data from a BaoBuildBuddy export JSON.
 * Uses a transaction for atomicity.
 */
export const importAllData = async (data: BaoExportData): Promise<ImportResult> => {
  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  const errors: string[] = [];

  if (data.version !== DATA_EXPORT_VERSION) {
    errors.push(`Unsupported export version: ${data.version}`);
    return { imported, skipped, errors };
  }

  sqlite.exec("BEGIN");
  const transactionResult = await settle(executeImportTransaction(data, imported, errors));
  if (transactionResult.status === "rejected") {
    sqlite.exec("ROLLBACK");
    errors.push(`Transaction failed: ${toErrorMessage(transactionResult.reason)}`);
  }

  return { imported, skipped, errors };
};
