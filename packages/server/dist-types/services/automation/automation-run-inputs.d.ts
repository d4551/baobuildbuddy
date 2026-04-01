import { type AutomationScrapeTarget } from "@bao/shared/constants/automation";
import type { EmailResponseTone } from "@bao/shared/schemas/automation-email.schema";
export interface JobApplyPayload {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
    customAnswers?: Record<string, string>;
}
export interface JobApplyExecutionPayload {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
    customAnswers: Record<string, string>;
}
export interface EmailResponseExecutionPayload {
    subject: string;
    message: string;
    sender?: string;
    tone: EmailResponseTone;
    recipientEmail?: string;
    deliverAfterGeneration: boolean;
}
export interface ScheduledRunMetadata {
    runAt: string;
}
export interface ScrapeExecutionPayload {
    target: AutomationScrapeTarget;
}
export declare const buildAuditInput: (payload: JobApplyExecutionPayload, includeAction: boolean) => Record<string, unknown>;
export declare const parseScheduledRunMetadata: (input: Record<string, unknown> | null) => ScheduledRunMetadata | null;
export declare const parseScheduledJobApplyPayload: (input: Record<string, unknown> | null) => JobApplyPayload | null;
export declare const buildScheduledJobApplyInput: (payload: JobApplyExecutionPayload, scheduledFor: string) => Record<string, unknown>;
export declare const buildEmailResponseInput: (normalized: EmailResponseExecutionPayload, options: {
    includeAction: boolean;
    scheduledFor?: string;
}) => Record<string, unknown>;
export declare const parseScheduledEmailResponsePayload: (input: Record<string, unknown> | null, options: {
    defaultTone: EmailResponseTone;
    isEmailResponseTone: (value: string) => value is EmailResponseTone;
}) => EmailResponseExecutionPayload | null;
export declare const resolveScrapeAction: (target: AutomationScrapeTarget) => string;
export declare const normalizeScrapeTarget: (target: string) => AutomationScrapeTarget;
export declare const buildScrapeInput: (payload: ScrapeExecutionPayload, options: {
    includeAction: boolean;
    scheduledFor?: string;
}) => Record<string, unknown>;
export declare const parseScheduledScrapePayload: (input: Record<string, unknown> | null) => ScrapeExecutionPayload | null;
