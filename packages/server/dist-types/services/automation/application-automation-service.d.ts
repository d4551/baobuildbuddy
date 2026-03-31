import type { AutomationScrapeTarget, RpaCapabilityAuditReport } from "@bao/shared/constants/automation";
import type { EmailResponseRequest, EmailResponseResult } from "@bao/shared/schemas/automation-email.schema";
import type { RpaRunEvent } from "@bao/shared/schemas/rpa-events.schema";
import { type JobApplyPayload } from "./automation-run-inputs";
/**
 * Contract-driven job application automation workflow service.
 */
export declare class ApplicationAutomationService {
    private readonly progressEvents;
    private readonly runCreator;
    private readonly scheduler;
    private readonly scheduledRuns;
    constructor();
    /**
     * Load a single automation run row.
     */
    private readRunRow;
    createScheduledJobApplyRun(payload: JobApplyPayload, runAt: string): Promise<{
        runId: string;
        scheduledFor: string;
    }>;
    createScheduledEmailResponseRun(payload: EmailResponseRequest, runAt: string): Promise<{
        runId: string;
        scheduledFor: string;
    }>;
    createScheduledScrapeRun(target: AutomationScrapeTarget, runAt: string): Promise<{
        runId: string;
        scheduledFor: string;
    }>;
    createScrapeRun(target: AutomationScrapeTarget): Promise<string>;
    /**
     * Execute a scrape run immediately and persist the final run outcome.
     */
    runScrape(target: AutomationScrapeTarget): Promise<string>;
    /**
     * Build an up-to-date audit report for the full RPA capability surface.
     */
    getRpaCapabilityAudit(): Promise<RpaCapabilityAuditReport>;
    private executeScheduledRun;
    /**
     * Run an AI-assisted email response and persist output as an automation run.
     */
    runEmailResponse(payload: EmailResponseRequest): Promise<EmailResponseResult>;
    /**
     * Run full job-application automation for an existing run.
     */
    runJobApply(runId: string, payload: JobApplyPayload, onProgress?: (event: RpaRunEvent) => void): Promise<void>;
    createJobApplyRun(payload: JobApplyPayload, options?: {
        includeActionInPayload?: boolean;
    }): Promise<string>;
}
export declare const applicationAutomationService: ApplicationAutomationService;
