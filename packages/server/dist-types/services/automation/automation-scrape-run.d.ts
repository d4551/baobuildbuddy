import { type AutomationScrapeTarget, type RpaCapabilityAuditReport } from "@bao/shared/constants/automation";
import type { AutomationRunStatus } from "@bao/shared/constants/automation";
import type { ScraperOperationResult } from "@bao/shared/types/jobs";
import type { CreateProgressEvent } from "./automation-service-contracts";
/**
 * A run that collected nothing because the target was misconfigured is a failure,
 * not a success.
 *
 * This used to be hardcoded to `success` with `exitCode: 0`, so a scrape that
 * returned `scraped: 0` alongside `errors: ["Missing enabled hitmarker portal
 * fallbackUrl."]` was indistinguishable in the run history from a scrape that
 * genuinely worked. Partial runs — some records collected despite errors — stay
 * successful so a single flaky portal page does not discard the rest of the harvest;
 * the errors remain in `output.errors` either way.
 */
export declare const resolveScrapeRunOutcome: (result: ScraperOperationResult) => {
    status: Extract<AutomationRunStatus, "success" | "error">;
    error: string | null;
    exitCode: number;
};
export declare const executeScrapeRun: (runId: string, target: AutomationScrapeTarget, createProgressEvent: CreateProgressEvent) => Promise<void>;
export declare const getRpaCapabilityAudit: () => Promise<RpaCapabilityAuditReport>;
