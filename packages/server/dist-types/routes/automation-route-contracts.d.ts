import { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES, type AutomationScrapeTarget } from "@bao/shared/constants/automation";
import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import type { Static } from "typebox";
import { routeErrorBodySchema } from "./route-error-envelope";
export { routeErrorBodySchema };
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
export declare const AUTOMATION_TYPE_SCHEMA: import("typebox").TUnion<[import("typebox").TLiteral<"scrape">, import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"email">]>;
export declare const AUTOMATION_STATUS_SCHEMA: import("typebox").TUnion<[import("typebox").TLiteral<"pending">, import("typebox").TLiteral<"running">, import("typebox").TLiteral<"success">, import("typebox").TLiteral<"error">]>;
export declare const EMAIL_RESPONSE_TONE_SCHEMA: import("typebox").TUnion<[import("typebox").TLiteral<"professional">, import("typebox").TLiteral<"friendly">, import("typebox").TLiteral<"concise">]>;
export declare const SCRAPE_TARGET_SCHEMA: import("typebox").TUnion<[import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"jobs_hitmarker">, import("typebox").TLiteral<"jobs_grackle">, import("typebox").TLiteral<"jobs_workwithindies">, import("typebox").TLiteral<"jobs_remotegamejobs">, import("typebox").TLiteral<"jobs_gamesjobsdirect">, import("typebox").TLiteral<"jobs_pocketgamer">]>;
export declare const automationRunEnvelopeBodySchema: import("typebox").TObject<{
    id: import("typebox").TString;
    type: import("typebox").TUnion<[import("typebox").TLiteral<"scrape">, import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"email">]>;
    status: import("typebox").TUnion<[import("typebox").TLiteral<"pending">, import("typebox").TLiteral<"running">, import("typebox").TLiteral<"success">, import("typebox").TLiteral<"error">]>;
    jobId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    userId: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    input: import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>;
    output: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TRecord<"^.*$", import("typebox").TUnknown>, import("typebox").TNull]>, import("typebox").TNull]>;
    screenshots: import("typebox").TUnion<[import("typebox").TArray<import("typebox").TString>, import("typebox").TNull]>;
    error: import("typebox").TUnion<[import("typebox").TString, import("typebox").TObject<{
        code: import("typebox").TString;
        message: import("typebox").TString;
        source: import("typebox").TString;
        details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
    }>, import("typebox").TNull]>;
    progress: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
    currentStep: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
    totalSteps: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
    startedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    completedAt: import("typebox").TUnion<[import("typebox").TString, import("typebox").TNull]>;
    createdAt: import("typebox").TString;
    updatedAt: import("typebox").TString;
    exitCode: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
    timedOut: import("typebox").TBoolean;
    aborted: import("typebox").TBoolean;
    executionMs: import("typebox").TUnion<[import("typebox").TNumber, import("typebox").TNull]>;
}>;
export declare const capabilityAuditEntryBodySchema: import("typebox").TObject<{
    id: import("typebox").TString;
    category: import("typebox").TUnion<[import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"scrape">]>;
    name: import("typebox").TString;
    target: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"jobs_hitmarker">, import("typebox").TLiteral<"jobs_grackle">, import("typebox").TLiteral<"jobs_workwithindies">, import("typebox").TLiteral<"jobs_remotegamejobs">, import("typebox").TLiteral<"jobs_gamesjobsdirect">, import("typebox").TLiteral<"jobs_pocketgamer">]>, import("typebox").TNull]>;
    implemented: import("typebox").TBoolean;
    configured: import("typebox").TBoolean;
    enabled: import("typebox").TBoolean;
    manualRunAvailable: import("typebox").TBoolean;
    scheduledRunAvailable: import("typebox").TBoolean;
    runHistoryAvailable: import("typebox").TBoolean;
    liveUpdatesAvailable: import("typebox").TBoolean;
    issues: import("typebox").TArray<import("typebox").TObject<{
        code: import("typebox").TUnion<import("typebox").TLiteral<"portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable">[]>;
        portalId: import("typebox").TOptional<import("typebox").TString>;
        portalName: import("typebox").TOptional<import("typebox").TString>;
    }>>;
}>;
export declare const capabilityAuditReportBodySchema: import("typebox").TObject<{
    generatedAt: import("typebox").TString;
    summary: import("typebox").TObject<{
        total: import("typebox").TNumber;
        configured: import("typebox").TNumber;
        manualRunAvailable: import("typebox").TNumber;
        scheduledRunAvailable: import("typebox").TNumber;
        runHistoryAvailable: import("typebox").TNumber;
        liveUpdatesAvailable: import("typebox").TNumber;
    }>;
    capabilities: import("typebox").TArray<import("typebox").TObject<{
        id: import("typebox").TString;
        category: import("typebox").TUnion<[import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"scrape">]>;
        name: import("typebox").TString;
        target: import("typebox").TUnion<[import("typebox").TUnion<[import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"jobs_hitmarker">, import("typebox").TLiteral<"jobs_grackle">, import("typebox").TLiteral<"jobs_workwithindies">, import("typebox").TLiteral<"jobs_remotegamejobs">, import("typebox").TLiteral<"jobs_gamesjobsdirect">, import("typebox").TLiteral<"jobs_pocketgamer">]>, import("typebox").TNull]>;
        implemented: import("typebox").TBoolean;
        configured: import("typebox").TBoolean;
        enabled: import("typebox").TBoolean;
        manualRunAvailable: import("typebox").TBoolean;
        scheduledRunAvailable: import("typebox").TBoolean;
        runHistoryAvailable: import("typebox").TBoolean;
        liveUpdatesAvailable: import("typebox").TBoolean;
        issues: import("typebox").TArray<import("typebox").TObject<{
            code: import("typebox").TUnion<import("typebox").TLiteral<"portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing" | "provider_settings_unavailable">[]>;
            portalId: import("typebox").TOptional<import("typebox").TString>;
            portalName: import("typebox").TOptional<import("typebox").TString>;
        }>>;
    }>>;
}>;
export declare const automationVerifyContextResponseSchema: import("typebox").TObject<{
    resumeId: import("typebox").TString;
}>;
export declare const automationEmailResponseBodySchema: import("typebox").TObject<{
    runId: import("typebox").TString;
    status: import("typebox").TLiteral<"success">;
    reply: import("typebox").TString;
    provider: import("typebox").TString;
    model: import("typebox").TString;
    delivered: import("typebox").TBoolean;
    recipientEmail: import("typebox").TOptional<import("typebox").TString>;
    deliveredAt: import("typebox").TOptional<import("typebox").TString>;
    messageId: import("typebox").TOptional<import("typebox").TString>;
}>;
export declare const automationRouteErrorResponses: {
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 409: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 422: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
};
export declare const automationVerifyContextResponses: {
    readonly 200: import("typebox").TUnknown;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const automationRunResponses: {
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 409: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 422: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 200: import("typebox").TUnknown;
};
export declare const automationEmailResponseResponses: {
    readonly 400: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 404: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 409: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 422: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 200: import("typebox").TUnknown;
};
export declare const automationCapabilitiesResponses: {
    readonly 200: import("typebox").TUnknown;
    readonly 500: import("typebox").TObject<{
        error: import("typebox").TObject<{
            code: import("typebox").TString;
            message: import("typebox").TString;
            details: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TUnknown>>;
        }>;
    }>;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const automationRunsListResponses: {
    readonly 200: import("typebox").TUnknown;
    readonly 429: import("typebox").TObject<{
        error: import("typebox").TString;
        code: import("typebox").TOptional<import("typebox").TString>;
        details: import("typebox").TOptional<import("typebox").TString>;
        fields: import("typebox").TOptional<import("typebox").TArray<import("typebox").TString>>;
        id: import("typebox").TOptional<import("typebox").TString>;
    }>;
};
export declare const jobApplyBodySchema: import("typebox").TObject<{
    jobUrl: import("typebox").TString;
    resumeId: import("typebox").TString;
    coverLetterId: import("typebox").TOptional<import("typebox").TString>;
    jobId: import("typebox").TOptional<import("typebox").TString>;
    customAnswers: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TString>>;
}>;
export type JobApplyBody = Static<typeof jobApplyBodySchema>;
export declare const scheduledJobApplyBodySchema: import("typebox").TObject<{
    jobUrl: import("typebox").TString;
    resumeId: import("typebox").TString;
    coverLetterId: import("typebox").TOptional<import("typebox").TString>;
    jobId: import("typebox").TOptional<import("typebox").TString>;
    customAnswers: import("typebox").TOptional<import("typebox").TRecord<"^.*$", import("typebox").TString>>;
    runAt: import("typebox").TString;
}>;
export type ScheduledJobApplyBody = Static<typeof scheduledJobApplyBodySchema>;
export declare const emailResponseBodySchema: import("typebox").TObject<{
    subject: import("typebox").TString;
    message: import("typebox").TString;
    sender: import("typebox").TOptional<import("typebox").TString>;
    tone: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"professional">, import("typebox").TLiteral<"friendly">, import("typebox").TLiteral<"concise">]>>;
    recipientEmail: import("typebox").TOptional<import("typebox").TString>;
    deliverAfterGeneration: import("typebox").TOptional<import("typebox").TBoolean>;
}>;
export type EmailResponseBody = Static<typeof emailResponseBodySchema>;
export declare const scheduledEmailResponseBodySchema: import("typebox").TObject<{
    subject: import("typebox").TString;
    message: import("typebox").TString;
    sender: import("typebox").TOptional<import("typebox").TString>;
    tone: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"professional">, import("typebox").TLiteral<"friendly">, import("typebox").TLiteral<"concise">]>>;
    recipientEmail: import("typebox").TOptional<import("typebox").TString>;
    deliverAfterGeneration: import("typebox").TOptional<import("typebox").TBoolean>;
    runAt: import("typebox").TString;
}>;
export type ScheduledEmailResponseBody = Static<typeof scheduledEmailResponseBodySchema>;
export declare const scrapeBodySchema: import("typebox").TObject<{
    target: import("typebox").TUnion<[import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"jobs_hitmarker">, import("typebox").TLiteral<"jobs_grackle">, import("typebox").TLiteral<"jobs_workwithindies">, import("typebox").TLiteral<"jobs_remotegamejobs">, import("typebox").TLiteral<"jobs_gamesjobsdirect">, import("typebox").TLiteral<"jobs_pocketgamer">]>;
}>;
export type ScrapeBody = Static<typeof scrapeBodySchema>;
export declare const scheduledScrapeBodySchema: import("typebox").TObject<{
    target: import("typebox").TUnion<[import("typebox").TLiteral<"studios">, import("typebox").TLiteral<"jobs_hitmarker">, import("typebox").TLiteral<"jobs_grackle">, import("typebox").TLiteral<"jobs_workwithindies">, import("typebox").TLiteral<"jobs_remotegamejobs">, import("typebox").TLiteral<"jobs_gamesjobsdirect">, import("typebox").TLiteral<"jobs_pocketgamer">]>;
    runAt: import("typebox").TString;
}>;
export type ScheduledScrapeBody = Static<typeof scheduledScrapeBodySchema>;
export declare const automationRunQuerySchema: import("typebox").TObject<{
    type: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"scrape">, import("typebox").TLiteral<"job_apply">, import("typebox").TLiteral<"email">]>>;
    status: import("typebox").TOptional<import("typebox").TUnion<[import("typebox").TLiteral<"pending">, import("typebox").TLiteral<"running">, import("typebox").TLiteral<"success">, import("typebox").TLiteral<"error">]>>;
}>;
export type AutomationRunQuery = Static<typeof automationRunQuerySchema>;
export declare const automationRunIdParamsSchema: import("typebox").TObject<{
    id: import("typebox").TString;
}>;
export type AutomationRunIdParams = Static<typeof automationRunIdParamsSchema>;
export { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES, AUTOMATION_STATUS_ERROR, AUTOMATION_STATUS_PENDING, AUTOMATION_STATUS_SUCCESS, };
