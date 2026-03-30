import type {
  AutomationScrapeTarget,
  Job,
  RpaCapabilityAuditEntry,
  RpaRunExecutionEnvelope,
} from "@bao/shared";

export type AutomationScraperRunState = "idle" | "running" | "success" | "error";

export type ScrapePendingAction =
  | `${AutomationScrapeTarget}-run`
  | `${AutomationScrapeTarget}-schedule`;

export type TargetRecord<TValue> = Record<AutomationScrapeTarget, TValue>;

export type ScrapeCapabilityCard = RpaCapabilityAuditEntry & {
  readonly category: "scrape";
  readonly target: AutomationScrapeTarget;
};

export interface AutomationScraperSummaryStat {
  readonly titleKey: string;
  readonly value: number | string;
  readonly valueClass?: string;
  readonly descKey: string;
}

export type AutomationInterviewJob = Job;
export type AutomationRunEnvelope = RpaRunExecutionEnvelope;
