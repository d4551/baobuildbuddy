import type { AutomationSettings, ErrorEnvelope, ResumeData, RpaRunEvent } from "@bao/shared";
import type { coverLetters } from "../../db/schema/schema-modules";
import type { automationRuns } from "../../db/schema/automation-runs";
import type { JobApplyExecutionPayload } from "./automation-run-inputs";
export interface EmailDeliveryDetails {
    delivered: boolean;
    recipientEmail?: string;
    deliveredAt?: string;
    messageId?: string;
}
export interface ProgressEventParams {
    runId: string;
    action: string;
    status: "pending" | "running" | "success" | "error";
    message?: string;
    step?: number;
    totalSteps?: number;
}
export type CreateProgressEvent = (params: ProgressEventParams) => RpaRunEvent;
export type BroadcastProgressEvent = (event: RpaRunEvent) => void;
export interface JobApplyRunPreparation {
    runId: string;
    automationSettings: AutomationSettings;
    normalized: JobApplyExecutionPayload;
    resume: ResumeData;
    coverLetter: typeof coverLetters.$inferSelect | null;
    selectorMap: Record<string, string[]>;
    resumeFilePath?: string;
    progressHandler: (event: RpaRunEvent) => void;
    runArtifactDir: string;
}
export interface JobApplyExecutionTracking {
    exitCode: number | null;
    timedOut: boolean;
    aborted: boolean;
    executionMs: number | null;
    errorEnvelope: ErrorEnvelope | null;
    terminalPersisted: boolean;
}
export interface AutofillAnalysisOptions {
    automationSettings: AutomationSettings;
    jobUrl: string;
    resume: ResumeData;
    coverLetter: typeof coverLetters.$inferSelect | null;
    existingAnswers: Record<string, string>;
}
export type AutomationRunRow = typeof automationRuns.$inferSelect;
