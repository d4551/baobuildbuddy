import { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES, type AutomationScrapeTarget, type EmailResponseRequest, type RpaRunExecutionEnvelope } from "@bao/shared";
declare const AUTOMATION_STATUS_PENDING: "pending", AUTOMATION_STATUS_SUCCESS: "success", AUTOMATION_STATUS_ERROR: "error";
export type AutomationJsonObject = NonNullable<RpaRunExecutionEnvelope["input"]>;
export type JobApplyRequestBody = {
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
    customAnswers?: Record<string, string>;
};
export type RunScrapeRequestBody = {
    target: AutomationScrapeTarget;
};
export type ScheduleJobApplyRequestBody = JobApplyRequestBody & {
    runAt: string;
};
export type ScheduleEmailResponseRequestBody = EmailResponseRequest & {
    runAt: string;
};
export type ScheduleScrapeRequestBody = {
    target: AutomationScrapeTarget;
    runAt: string;
};
export declare const RUN_ID_PATTERN: RegExp;
export declare const AUTOMATION_TYPE_SCHEMA: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"scrape">, import("@sinclair/typebox").TLiteral<"job_apply">, import("@sinclair/typebox").TLiteral<"email">]>;
export declare const AUTOMATION_STATUS_SCHEMA: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"pending">, import("@sinclair/typebox").TLiteral<"running">, import("@sinclair/typebox").TLiteral<"success">, import("@sinclair/typebox").TLiteral<"error">]>;
export declare const EMAIL_RESPONSE_TONE_SCHEMA: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"professional">, import("@sinclair/typebox").TLiteral<"friendly">, import("@sinclair/typebox").TLiteral<"concise">]>;
export declare const SCRAPE_TARGET_SCHEMA: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"studios">, import("@sinclair/typebox").TLiteral<"jobs_hitmarker">, import("@sinclair/typebox").TLiteral<"jobs_grackle">, import("@sinclair/typebox").TLiteral<"jobs_workwithindies">, import("@sinclair/typebox").TLiteral<"jobs_remotegamejobs">, import("@sinclair/typebox").TLiteral<"jobs_gamesjobsdirect">, import("@sinclair/typebox").TLiteral<"jobs_pocketgamer">]>;
export declare const automationRunEnvelopeBodySchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    type: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"scrape">, import("@sinclair/typebox").TLiteral<"job_apply">, import("@sinclair/typebox").TLiteral<"email">]>;
    status: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"pending">, import("@sinclair/typebox").TLiteral<"running">, import("@sinclair/typebox").TLiteral<"success">, import("@sinclair/typebox").TLiteral<"error">]>;
    jobId: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
    userId: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
    input: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TNull]>;
    output: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>, import("@sinclair/typebox").TNull]>, import("@sinclair/typebox").TNull]>;
    screenshots: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>, import("@sinclair/typebox").TNull]>;
    error: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TObject<{
        code: import("@sinclair/typebox").TString;
        message: import("@sinclair/typebox").TString;
        source: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    }>, import("@sinclair/typebox").TNull]>;
    progress: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>;
    currentStep: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>;
    totalSteps: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>;
    startedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
    completedAt: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TString, import("@sinclair/typebox").TNull]>;
    createdAt: import("@sinclair/typebox").TString;
    updatedAt: import("@sinclair/typebox").TString;
    exitCode: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>;
    timedOut: import("@sinclair/typebox").TBoolean;
    aborted: import("@sinclair/typebox").TBoolean;
    executionMs: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TNumber, import("@sinclair/typebox").TNull]>;
}>;
export declare const routeErrorBodySchema: import("@sinclair/typebox").TObject<{
    error: import("@sinclair/typebox").TObject<{
        code: import("@sinclair/typebox").TString;
        message: import("@sinclair/typebox").TString;
        details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
    }>;
}>;
export declare const capabilityAuditEntryBodySchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    category: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"job_apply">, import("@sinclair/typebox").TLiteral<"scrape">]>;
    name: import("@sinclair/typebox").TString;
    target: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"studios">, import("@sinclair/typebox").TLiteral<"jobs_hitmarker">, import("@sinclair/typebox").TLiteral<"jobs_grackle">, import("@sinclair/typebox").TLiteral<"jobs_workwithindies">, import("@sinclair/typebox").TLiteral<"jobs_remotegamejobs">, import("@sinclair/typebox").TLiteral<"jobs_gamesjobsdirect">, import("@sinclair/typebox").TLiteral<"jobs_pocketgamer">]>, import("@sinclair/typebox").TNull]>;
    implemented: import("@sinclair/typebox").TBoolean;
    configured: import("@sinclair/typebox").TBoolean;
    enabled: import("@sinclair/typebox").TBoolean;
    manualRunAvailable: import("@sinclair/typebox").TBoolean;
    scheduledRunAvailable: import("@sinclair/typebox").TBoolean;
    runHistoryAvailable: import("@sinclair/typebox").TBoolean;
    liveUpdatesAvailable: import("@sinclair/typebox").TBoolean;
    issues: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
}>;
export declare const capabilityAuditReportBodySchema: import("@sinclair/typebox").TObject<{
    generatedAt: import("@sinclair/typebox").TString;
    summary: import("@sinclair/typebox").TObject<{
        total: import("@sinclair/typebox").TNumber;
        configured: import("@sinclair/typebox").TNumber;
        manualRunAvailable: import("@sinclair/typebox").TNumber;
        scheduledRunAvailable: import("@sinclair/typebox").TNumber;
        runHistoryAvailable: import("@sinclair/typebox").TNumber;
        liveUpdatesAvailable: import("@sinclair/typebox").TNumber;
    }>;
    capabilities: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        category: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"job_apply">, import("@sinclair/typebox").TLiteral<"scrape">]>;
        name: import("@sinclair/typebox").TString;
        target: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"studios">, import("@sinclair/typebox").TLiteral<"jobs_hitmarker">, import("@sinclair/typebox").TLiteral<"jobs_grackle">, import("@sinclair/typebox").TLiteral<"jobs_workwithindies">, import("@sinclair/typebox").TLiteral<"jobs_remotegamejobs">, import("@sinclair/typebox").TLiteral<"jobs_gamesjobsdirect">, import("@sinclair/typebox").TLiteral<"jobs_pocketgamer">]>, import("@sinclair/typebox").TNull]>;
        implemented: import("@sinclair/typebox").TBoolean;
        configured: import("@sinclair/typebox").TBoolean;
        enabled: import("@sinclair/typebox").TBoolean;
        manualRunAvailable: import("@sinclair/typebox").TBoolean;
        scheduledRunAvailable: import("@sinclair/typebox").TBoolean;
        runHistoryAvailable: import("@sinclair/typebox").TBoolean;
        liveUpdatesAvailable: import("@sinclair/typebox").TBoolean;
        issues: import("@sinclair/typebox").TArray<import("@sinclair/typebox").TString>;
    }>>;
}>;
export declare const automationRouteErrorResponses: {
    400: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TObject<{
            code: import("@sinclair/typebox").TString;
            message: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        }>;
    }>;
    404: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TObject<{
            code: import("@sinclair/typebox").TString;
            message: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        }>;
    }>;
    409: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TObject<{
            code: import("@sinclair/typebox").TString;
            message: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        }>;
    }>;
    422: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TObject<{
            code: import("@sinclair/typebox").TString;
            message: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        }>;
    }>;
    500: import("@sinclair/typebox").TObject<{
        error: import("@sinclair/typebox").TObject<{
            code: import("@sinclair/typebox").TString;
            message: import("@sinclair/typebox").TString;
            details: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TUnknown>>;
        }>;
    }>;
};
export declare const jobApplyBodySchema: import("@sinclair/typebox").TObject<{
    jobUrl: import("@sinclair/typebox").TString;
    resumeId: import("@sinclair/typebox").TString;
    coverLetterId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    jobId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    customAnswers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
}>;
export declare const scheduledJobApplyBodySchema: import("@sinclair/typebox").TObject<{
    jobUrl: import("@sinclair/typebox").TString;
    resumeId: import("@sinclair/typebox").TString;
    coverLetterId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    jobId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    customAnswers: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TRecord<import("@sinclair/typebox").TString, import("@sinclair/typebox").TString>>;
    runAt: import("@sinclair/typebox").TString;
}>;
export declare const emailResponseBodySchema: import("@sinclair/typebox").TObject<{
    subject: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
    sender: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    tone: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"professional">, import("@sinclair/typebox").TLiteral<"friendly">, import("@sinclair/typebox").TLiteral<"concise">]>>;
    recipientEmail: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    deliverAfterGeneration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
}>;
export declare const scheduledEmailResponseBodySchema: import("@sinclair/typebox").TObject<{
    subject: import("@sinclair/typebox").TString;
    message: import("@sinclair/typebox").TString;
    sender: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    tone: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"professional">, import("@sinclair/typebox").TLiteral<"friendly">, import("@sinclair/typebox").TLiteral<"concise">]>>;
    recipientEmail: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    deliverAfterGeneration: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    runAt: import("@sinclair/typebox").TString;
}>;
export declare const scrapeBodySchema: import("@sinclair/typebox").TObject<{
    target: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"studios">, import("@sinclair/typebox").TLiteral<"jobs_hitmarker">, import("@sinclair/typebox").TLiteral<"jobs_grackle">, import("@sinclair/typebox").TLiteral<"jobs_workwithindies">, import("@sinclair/typebox").TLiteral<"jobs_remotegamejobs">, import("@sinclair/typebox").TLiteral<"jobs_gamesjobsdirect">, import("@sinclair/typebox").TLiteral<"jobs_pocketgamer">]>;
}>;
export declare const scheduledScrapeBodySchema: import("@sinclair/typebox").TObject<{
    target: import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"studios">, import("@sinclair/typebox").TLiteral<"jobs_hitmarker">, import("@sinclair/typebox").TLiteral<"jobs_grackle">, import("@sinclair/typebox").TLiteral<"jobs_workwithindies">, import("@sinclair/typebox").TLiteral<"jobs_remotegamejobs">, import("@sinclair/typebox").TLiteral<"jobs_gamesjobsdirect">, import("@sinclair/typebox").TLiteral<"jobs_pocketgamer">]>;
    runAt: import("@sinclair/typebox").TString;
}>;
export declare const automationRunQuerySchema: import("@sinclair/typebox").TObject<{
    type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"scrape">, import("@sinclair/typebox").TLiteral<"job_apply">, import("@sinclair/typebox").TLiteral<"email">]>>;
    status: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TUnion<[import("@sinclair/typebox").TLiteral<"pending">, import("@sinclair/typebox").TLiteral<"running">, import("@sinclair/typebox").TLiteral<"success">, import("@sinclair/typebox").TLiteral<"error">]>>;
}>;
export declare const automationRunIdParamsSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
}>;
export { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES, AUTOMATION_STATUS_ERROR, AUTOMATION_STATUS_PENDING, AUTOMATION_STATUS_SUCCESS, };
