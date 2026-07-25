export type TimelineStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface TimelineEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly stage: string;
  readonly status: TimelineStatus;
  readonly message: string;
}
