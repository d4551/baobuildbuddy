import type { JsonValue } from "@bao/shared/utils/json";
export declare const DATA_EXPORT_VERSION: "1.0";
/**
 * Payload accepted by import. Version stays a plain string because import must
 * be able to receive — and reject — payloads from unsupported versions.
 */
export type BaoImportData = Omit<BaoExportData, "version"> & {
    version: string;
};
export interface BaoExportData {
    /** Literal so the export payload matches the declared response contract. */
    version: typeof DATA_EXPORT_VERSION;
    exportedAt: string;
    profile: JsonValue;
    settings: JsonValue;
    resumes: JsonValue[];
    coverLetters: JsonValue[];
    portfolio: JsonValue;
    portfolioProjects: JsonValue[];
    interviewSessions: JsonValue[];
    gamification: JsonValue;
    skillMappings: JsonValue[];
    savedJobs: JsonValue[];
    applications: JsonValue[];
    chatHistory: JsonValue[];
}
export interface ImportResult {
    imported: Record<string, number>;
    skipped: Record<string, number>;
    errors: string[];
}
