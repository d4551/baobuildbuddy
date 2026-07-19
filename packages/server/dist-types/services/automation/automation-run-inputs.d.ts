import { type AutomationScrapeTarget } from "@bao/shared/constants/automation";
import type { EmailResponseTone } from "@bao/shared/schemas/automation-email.schema";
import type { JsonObject } from "@bao/shared/utils/json";
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
export declare const buildAuditInput: (payload: JobApplyExecutionPayload, includeAction: boolean) => JsonObject;
export declare const parseScheduledRunMetadata: (input: JsonObject | null) => ScheduledRunMetadata | null;
export declare const parseScheduledJobApplyPayload: (input: JsonObject | null) => JobApplyPayload | null;
export declare const buildScheduledJobApplyInput: (payload: JobApplyExecutionPayload, scheduledFor: string) => JsonObject;
export declare const buildEmailResponseInput: (normalized: EmailResponseExecutionPayload, options: {
    includeAction: boolean;
    scheduledFor?: string;
}) => JsonObject;
export declare const parseScheduledEmailResponsePayload: (input: JsonObject | null, options: {
    defaultTone: EmailResponseTone;
    isEmailResponseTone: (value: string) => value is EmailResponseTone;
}) => EmailResponseExecutionPayload | null;
export declare const resolveScrapeAction: (target: AutomationScrapeTarget) => string;
export declare const normalizeScrapeTarget: (target: string) => AutomationScrapeTarget;
export declare const buildScrapeInput: (payload: ScrapeExecutionPayload, options: {
    includeAction: boolean;
    scheduledFor?: string;
}) => JsonObject;
export declare const parseScheduledScrapePayload: (input: JsonObject | null) => ScrapeExecutionPayload | null;
