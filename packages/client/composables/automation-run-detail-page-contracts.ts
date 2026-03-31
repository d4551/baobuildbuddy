export type TimelineStatus = "pending" | "running" | "success" | "error";

export interface TimelineEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly stage: string;
  readonly status: TimelineStatus;
  readonly message: string;
}
