/**
 * Captured SMTP session details from the verification harness.
 */
export interface CapturedSmtpExchange {
    commands: string[];
    message: string;
    username?: string;
}
/**
 * SMTP harness capabilities and failure injection options.
 */
export interface SmtpHarnessOptions {
    capabilityLines?: readonly string[];
    closeOnCommand?: string;
}
/**
 * Running SMTP verification harness.
 */
export interface SmtpHarnessHandle {
    exchange: CapturedSmtpExchange;
    port: number;
    stop(): void;
}
/**
 * Create an in-process SMTP harness for deterministic integration testing.
 *
 * @param options Capability and disconnect behavior overrides.
 * @returns Running harness handle.
 */
export declare function createSmtpHarness(options?: SmtpHarnessOptions): SmtpHarnessHandle;
