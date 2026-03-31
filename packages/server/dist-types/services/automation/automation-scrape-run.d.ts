import { type AutomationScrapeTarget, type RpaCapabilityAuditReport } from "@bao/shared/constants/automation";
import type { CreateProgressEvent } from "./automation-service-contracts";
export declare const executeScrapeRun: (runId: string, target: AutomationScrapeTarget, createProgressEvent: CreateProgressEvent) => Promise<void>;
export declare const getRpaCapabilityAudit: () => Promise<RpaCapabilityAuditReport>;
