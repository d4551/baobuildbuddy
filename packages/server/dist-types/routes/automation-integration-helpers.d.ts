import { type RpaRunEvent, type RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { EmailTransportSettings } from "@bao/shared/types/settings-contracts";
import { z } from "zod";
import { automationRuns } from "../db/schema/automation-runs";
export declare const WAIT_INTERVAL_MS = 1000;
export declare const RUN_TIMEOUT_MS = 45000;
export declare const SCHEDULE_LEAD_TIME_MS = 3000;
export declare const SMTP_USERNAME = "mailer@example.test";
export declare const SMTP_PASSWORD = "secret-password";
export declare const SMTP_FROM_NAME = "Bao Build Buddy";
export declare const CLEANUP_AUTOMATION_TYPES: readonly ["job_apply", "email", "scrape"];
export declare const setIntegrationBaseUrls: (httpBase: string, wsBase: string) => void;
export declare const waitForCondition: (condition: () => Promise<boolean> | boolean, timeoutMessage: string, deadline?: number) => Promise<void>;
export declare const waitForSubmissionCount: (getSubmissionCount: () => number, expectedCount: number) => Promise<void>;
declare const emailResponseBodySchema: z.ZodObject<{
    runId: z.ZodString;
    status: z.ZodLiteral<"success">;
    delivered: z.ZodBoolean;
    recipientEmail: z.ZodOptional<z.ZodString>;
    messageId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type EmailResponseBody = z.infer<typeof emailResponseBodySchema>;
export declare const requestJson: <T>(path: string, schema: z.ZodType<T>, init?: RequestInit) => Promise<{
    status: number;
    body: T | null;
}>;
export declare const requestExecutionEnvelope: (path: string, init?: RequestInit) => Promise<{
    status: number;
    body: RpaRunExecutionEnvelope;
}>;
export declare const requestEmailResponseBody: (path: string, init?: RequestInit) => Promise<{
    status: number;
    body: EmailResponseBody;
}>;
export declare const createResumeRecord: () => Promise<string>;
export declare const upsertDeterministicSettings: (overrides?: {
    emailTransportPassword?: string | null;
    emailTransportSettings?: EmailTransportSettings;
}) => Promise<void>;
export declare const readRunRowById: (runId: string) => Promise<typeof automationRuns.$inferSelect | null>;
export declare const waitForRunCompletion: (runId: string) => Promise<typeof automationRuns.$inferSelect>;
export declare const subscribeToRunEvents: (runId: string) => Promise<{
    events: RpaRunEvent[];
    close(): void;
    waitForTerminalEvent(): Promise<RpaRunEvent>;
}>;
export {};
