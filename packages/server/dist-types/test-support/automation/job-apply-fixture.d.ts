import type { ResumeData } from "@bao/shared/types/resume";
/**
 * Submitted payload captured from the deterministic job-apply fixture.
 */
export interface SubmittedJobApplyFixturePayload {
    fields: Record<string, string>;
    resumeFileName: string | null;
}
/**
 * Options supported by the job-apply verification fixture server.
 */
export interface JobApplyFixtureServerOptions {
    submissionDelayMs?: number;
    includeCustomQuestionFields?: boolean;
}
/**
 * Handle returned by the deterministic job-apply fixture server.
 */
export interface JobApplyFixtureServerHandle {
    baseUrl: string;
    port: number;
    submissions: SubmittedJobApplyFixturePayload[];
    /**
     * Resolve once a submission has been recorded, or null if none arrives.
     *
     * The RPA script can resolve before this server's async request handler has
     * finished parsing the form body, so sampling `submissions[0]` immediately
     * after the run is a race. Callers await this instead.
     */
    waitForSubmission(timeoutMs: number): Promise<SubmittedJobApplyFixturePayload | null>;
    stop(): Promise<void>;
}
/**
 * Create a deterministic resume payload for verification and integration tests.
 *
 * @returns Valid resume payload accepted by the resume API.
 */
export declare function createVerificationResumePayload(): Omit<ResumeData, "id">;
/**
 * Build the selector map required by the lower-level job-apply script fixture test.
 *
 * @returns Selector map keyed by custom answer field.
 */
export declare function createJobApplyFixtureSelectorMap(): Record<string, string[]>;
/**
 * Start a deterministic job-apply fixture server for automation verification.
 *
 * @param options Server behavior options.
 * @returns Running fixture server handle.
 */
export declare function startJobApplyFixtureServer(options?: JobApplyFixtureServerOptions): JobApplyFixtureServerHandle;
