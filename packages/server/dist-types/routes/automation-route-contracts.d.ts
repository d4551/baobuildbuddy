import { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES, type AutomationScrapeTarget } from "@bao/shared/constants/automation";
import type { EmailResponseRequest } from "@bao/shared/schemas/automation-email.schema";
import type { RpaRunExecutionEnvelope } from "@bao/shared/schemas/rpa-events.schema";
import Type, { type StaticParse } from "baobox";
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
export type RouteSetState = {
    status?: number | string;
};
export declare const RUN_ID_PATTERN: RegExp;
export declare const AUTOMATION_TYPE_SCHEMA: Type.TUnion<(Type.TLiteral<"scrape"> | Type.TLiteral<"job_apply"> | Type.TLiteral<"email">)[]>;
export declare const AUTOMATION_STATUS_SCHEMA: Type.TUnion<(Type.TLiteral<"pending"> | Type.TLiteral<"running"> | Type.TLiteral<"success"> | Type.TLiteral<"error">)[]>;
export declare const EMAIL_RESPONSE_TONE_SCHEMA: Type.TUnion<(Type.TLiteral<"professional"> | Type.TLiteral<"friendly"> | Type.TLiteral<"concise">)[]>;
export declare const SCRAPE_TARGET_SCHEMA: Type.TUnion<(Type.TLiteral<"studios"> | Type.TLiteral<"jobs_hitmarker"> | Type.TLiteral<"jobs_grackle"> | Type.TLiteral<"jobs_workwithindies"> | Type.TLiteral<"jobs_remotegamejobs"> | Type.TLiteral<"jobs_gamesjobsdirect"> | Type.TLiteral<"jobs_pocketgamer">)[]>;
export declare const automationRunEnvelopeBodySchema: Type.TObject<{
    readonly id: Type.TString;
    readonly type: Type.TUnion<(Type.TLiteral<"scrape"> | Type.TLiteral<"job_apply"> | Type.TLiteral<"email">)[]>;
    readonly status: Type.TUnion<(Type.TLiteral<"pending"> | Type.TLiteral<"running"> | Type.TLiteral<"success"> | Type.TLiteral<"error">)[]>;
    readonly jobId: Type.TUnion<(Type.TString | Type.TNull)[]>;
    readonly userId: Type.TUnion<(Type.TString | Type.TNull)[]>;
    readonly input: Type.TUnion<(Type.TNull | Type.TRecord<Type.TString, Type.TUnknown>)[]>;
    readonly output: Type.TUnion<(Type.TNull | Type.TUnion<(Type.TNull | Type.TRecord<Type.TString, Type.TUnknown>)[]>)[]>;
    readonly screenshots: Type.TUnion<(Type.TNull | Type.TArray<Type.TString>)[]>;
    readonly error: Type.TUnion<(Type.TString | Type.TNull | Type.TObject<{
        readonly code: Type.TString;
        readonly message: Type.TString;
        readonly source: Type.TString;
        readonly details: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    }, "code" | "source" | "message", "details">)[]>;
    readonly progress: Type.TUnion<(Type.TNumber | Type.TNull)[]>;
    readonly currentStep: Type.TUnion<(Type.TNumber | Type.TNull)[]>;
    readonly totalSteps: Type.TUnion<(Type.TNumber | Type.TNull)[]>;
    readonly startedAt: Type.TUnion<(Type.TString | Type.TNull)[]>;
    readonly completedAt: Type.TUnion<(Type.TString | Type.TNull)[]>;
    readonly createdAt: Type.TString;
    readonly updatedAt: Type.TString;
    readonly exitCode: Type.TUnion<(Type.TNumber | Type.TNull)[]>;
    readonly timedOut: Type.TBoolean;
    readonly aborted: Type.TBoolean;
    readonly executionMs: Type.TUnion<(Type.TNumber | Type.TNull)[]>;
}, "error" | "id" | "aborted" | "type" | "output" | "input" | "progress" | "screenshots" | "status" | "jobId" | "userId" | "currentStep" | "totalSteps" | "exitCode" | "timedOut" | "executionMs" | "startedAt" | "completedAt" | "createdAt" | "updatedAt", never>;
export declare const routeErrorBodySchema: Type.TObject<{
    readonly error: Type.TObject<{
        readonly code: Type.TString;
        readonly message: Type.TString;
        readonly details: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
    }, "code" | "message", "details">;
}, "error", never>;
export declare const capabilityAuditEntryBodySchema: Type.TObject<{
    readonly id: Type.TString;
    readonly category: Type.TUnion<(Type.TLiteral<"scrape"> | Type.TLiteral<"job_apply">)[]>;
    readonly name: Type.TString;
    readonly target: Type.TUnion<(Type.TNull | Type.TUnion<(Type.TLiteral<"studios"> | Type.TLiteral<"jobs_hitmarker"> | Type.TLiteral<"jobs_grackle"> | Type.TLiteral<"jobs_workwithindies"> | Type.TLiteral<"jobs_remotegamejobs"> | Type.TLiteral<"jobs_gamesjobsdirect"> | Type.TLiteral<"jobs_pocketgamer">)[]>)[]>;
    readonly implemented: Type.TBoolean;
    readonly configured: Type.TBoolean;
    readonly enabled: Type.TBoolean;
    readonly manualRunAvailable: Type.TBoolean;
    readonly scheduledRunAvailable: Type.TBoolean;
    readonly runHistoryAvailable: Type.TBoolean;
    readonly liveUpdatesAvailable: Type.TBoolean;
    readonly issues: Type.TArray<Type.TObject<{
        readonly code: Type.TUnion<Type.TLiteral<"provider_settings_unavailable" | "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing">[]>;
        readonly portalId: Type.TOptional<Type.TString>;
        readonly portalName: Type.TOptional<Type.TString>;
    }, "code", Type.InferOptionalKeys<{
        readonly code: Type.TUnion<Type.TLiteral<"provider_settings_unavailable" | "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing">[]>;
        readonly portalId: Type.TOptional<Type.TString>;
        readonly portalName: Type.TOptional<Type.TString>;
    }>>>;
}, "name" | "id" | "category" | "enabled" | "target" | "issues" | "configured" | "implemented" | "manualRunAvailable" | "scheduledRunAvailable" | "runHistoryAvailable" | "liveUpdatesAvailable", never>;
export declare const capabilityAuditReportBodySchema: Type.TObject<{
    readonly generatedAt: Type.TString;
    readonly summary: Type.TObject<{
        readonly total: Type.TNumber;
        readonly configured: Type.TNumber;
        readonly manualRunAvailable: Type.TNumber;
        readonly scheduledRunAvailable: Type.TNumber;
        readonly runHistoryAvailable: Type.TNumber;
        readonly liveUpdatesAvailable: Type.TNumber;
    }, "configured" | "manualRunAvailable" | "scheduledRunAvailable" | "runHistoryAvailable" | "liveUpdatesAvailable" | "total", never>;
    readonly capabilities: Type.TArray<Type.TObject<{
        readonly id: Type.TString;
        readonly category: Type.TUnion<(Type.TLiteral<"scrape"> | Type.TLiteral<"job_apply">)[]>;
        readonly name: Type.TString;
        readonly target: Type.TUnion<(Type.TNull | Type.TUnion<(Type.TLiteral<"studios"> | Type.TLiteral<"jobs_hitmarker"> | Type.TLiteral<"jobs_grackle"> | Type.TLiteral<"jobs_workwithindies"> | Type.TLiteral<"jobs_remotegamejobs"> | Type.TLiteral<"jobs_gamesjobsdirect"> | Type.TLiteral<"jobs_pocketgamer">)[]>)[]>;
        readonly implemented: Type.TBoolean;
        readonly configured: Type.TBoolean;
        readonly enabled: Type.TBoolean;
        readonly manualRunAvailable: Type.TBoolean;
        readonly scheduledRunAvailable: Type.TBoolean;
        readonly runHistoryAvailable: Type.TBoolean;
        readonly liveUpdatesAvailable: Type.TBoolean;
        readonly issues: Type.TArray<Type.TObject<{
            readonly code: Type.TUnion<Type.TLiteral<"provider_settings_unavailable" | "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing">[]>;
            readonly portalId: Type.TOptional<Type.TString>;
            readonly portalName: Type.TOptional<Type.TString>;
        }, "code", Type.InferOptionalKeys<{
            readonly code: Type.TUnion<Type.TLiteral<"provider_settings_unavailable" | "portal_configuration_missing" | "portal_disabled" | "portal_fallback_url_missing">[]>;
            readonly portalId: Type.TOptional<Type.TString>;
            readonly portalName: Type.TOptional<Type.TString>;
        }>>>;
    }, "name" | "id" | "category" | "enabled" | "target" | "issues" | "configured" | "implemented" | "manualRunAvailable" | "scheduledRunAvailable" | "runHistoryAvailable" | "liveUpdatesAvailable", never>>;
}, "summary" | "capabilities" | "generatedAt", never>;
export declare const automationRouteErrorResponses: {
    400: Type.TObject<{
        readonly error: Type.TObject<{
            readonly code: Type.TString;
            readonly message: Type.TString;
            readonly details: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
        }, "code" | "message", "details">;
    }, "error", never>;
    404: Type.TObject<{
        readonly error: Type.TObject<{
            readonly code: Type.TString;
            readonly message: Type.TString;
            readonly details: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
        }, "code" | "message", "details">;
    }, "error", never>;
    409: Type.TObject<{
        readonly error: Type.TObject<{
            readonly code: Type.TString;
            readonly message: Type.TString;
            readonly details: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
        }, "code" | "message", "details">;
    }, "error", never>;
    422: Type.TObject<{
        readonly error: Type.TObject<{
            readonly code: Type.TString;
            readonly message: Type.TString;
            readonly details: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
        }, "code" | "message", "details">;
    }, "error", never>;
    500: Type.TObject<{
        readonly error: Type.TObject<{
            readonly code: Type.TString;
            readonly message: Type.TString;
            readonly details: Type.TOptional<Type.TRecord<Type.TString, Type.TUnknown>>;
        }, "code" | "message", "details">;
    }, "error", never>;
};
export declare const jobApplyBodySchema: Type.TObject<{
    readonly jobUrl: Type.TString;
    readonly resumeId: Type.TString;
    readonly coverLetterId: Type.TOptional<Type.TString>;
    readonly jobId: Type.TOptional<Type.TString>;
    readonly customAnswers: Type.TOptional<Type.TRecord<Type.TString, Type.TString>>;
}, "resumeId" | "jobUrl", Type.InferOptionalKeys<{
    readonly jobUrl: Type.TString;
    readonly resumeId: Type.TString;
    readonly coverLetterId: Type.TOptional<Type.TString>;
    readonly jobId: Type.TOptional<Type.TString>;
    readonly customAnswers: Type.TOptional<Type.TRecord<Type.TString, Type.TString>>;
}>>;
export type JobApplyBody = StaticParse<typeof jobApplyBodySchema>;
export declare const scheduledJobApplyBodySchema: Type.TObject<{
    readonly jobUrl: Type.TString;
    readonly resumeId: Type.TString;
    readonly coverLetterId: Type.TOptional<Type.TString>;
    readonly jobId: Type.TOptional<Type.TString>;
    readonly customAnswers: Type.TOptional<Type.TRecord<Type.TString, Type.TString>>;
    readonly runAt: Type.TString;
}, "resumeId" | "jobUrl" | "runAt", Type.InferOptionalKeys<{
    readonly jobUrl: Type.TString;
    readonly resumeId: Type.TString;
    readonly coverLetterId: Type.TOptional<Type.TString>;
    readonly jobId: Type.TOptional<Type.TString>;
    readonly customAnswers: Type.TOptional<Type.TRecord<Type.TString, Type.TString>>;
    readonly runAt: Type.TString;
}>>;
export type ScheduledJobApplyBody = StaticParse<typeof scheduledJobApplyBodySchema>;
export declare const emailResponseBodySchema: Type.TObject<{
    readonly subject: Type.TString;
    readonly message: Type.TString;
    readonly sender: Type.TOptional<Type.TString>;
    readonly tone: Type.TOptional<Type.TUnion<(Type.TLiteral<"professional"> | Type.TLiteral<"friendly"> | Type.TLiteral<"concise">)[]>>;
    readonly recipientEmail: Type.TOptional<Type.TString>;
    readonly deliverAfterGeneration: Type.TOptional<Type.TBoolean>;
}, "message" | "subject", Type.InferOptionalKeys<{
    readonly subject: Type.TString;
    readonly message: Type.TString;
    readonly sender: Type.TOptional<Type.TString>;
    readonly tone: Type.TOptional<Type.TUnion<(Type.TLiteral<"professional"> | Type.TLiteral<"friendly"> | Type.TLiteral<"concise">)[]>>;
    readonly recipientEmail: Type.TOptional<Type.TString>;
    readonly deliverAfterGeneration: Type.TOptional<Type.TBoolean>;
}>>;
export type EmailResponseBody = StaticParse<typeof emailResponseBodySchema>;
export declare const scheduledEmailResponseBodySchema: Type.TObject<{
    readonly subject: Type.TString;
    readonly message: Type.TString;
    readonly sender: Type.TOptional<Type.TString>;
    readonly tone: Type.TOptional<Type.TUnion<(Type.TLiteral<"professional"> | Type.TLiteral<"friendly"> | Type.TLiteral<"concise">)[]>>;
    readonly recipientEmail: Type.TOptional<Type.TString>;
    readonly deliverAfterGeneration: Type.TOptional<Type.TBoolean>;
    readonly runAt: Type.TString;
}, "message" | "subject" | "runAt", Type.InferOptionalKeys<{
    readonly subject: Type.TString;
    readonly message: Type.TString;
    readonly sender: Type.TOptional<Type.TString>;
    readonly tone: Type.TOptional<Type.TUnion<(Type.TLiteral<"professional"> | Type.TLiteral<"friendly"> | Type.TLiteral<"concise">)[]>>;
    readonly recipientEmail: Type.TOptional<Type.TString>;
    readonly deliverAfterGeneration: Type.TOptional<Type.TBoolean>;
    readonly runAt: Type.TString;
}>>;
export type ScheduledEmailResponseBody = StaticParse<typeof scheduledEmailResponseBodySchema>;
export declare const scrapeBodySchema: Type.TObject<{
    readonly target: Type.TUnion<(Type.TLiteral<"studios"> | Type.TLiteral<"jobs_hitmarker"> | Type.TLiteral<"jobs_grackle"> | Type.TLiteral<"jobs_workwithindies"> | Type.TLiteral<"jobs_remotegamejobs"> | Type.TLiteral<"jobs_gamesjobsdirect"> | Type.TLiteral<"jobs_pocketgamer">)[]>;
}, "target", never>;
export type ScrapeBody = StaticParse<typeof scrapeBodySchema>;
export declare const scheduledScrapeBodySchema: Type.TObject<{
    readonly target: Type.TUnion<(Type.TLiteral<"studios"> | Type.TLiteral<"jobs_hitmarker"> | Type.TLiteral<"jobs_grackle"> | Type.TLiteral<"jobs_workwithindies"> | Type.TLiteral<"jobs_remotegamejobs"> | Type.TLiteral<"jobs_gamesjobsdirect"> | Type.TLiteral<"jobs_pocketgamer">)[]>;
    readonly runAt: Type.TString;
}, "target" | "runAt", never>;
export type ScheduledScrapeBody = StaticParse<typeof scheduledScrapeBodySchema>;
export declare const automationRunQuerySchema: Type.TObject<{
    readonly type: Type.TOptional<Type.TUnion<(Type.TLiteral<"scrape"> | Type.TLiteral<"job_apply"> | Type.TLiteral<"email">)[]>>;
    readonly status: Type.TOptional<Type.TUnion<(Type.TLiteral<"pending"> | Type.TLiteral<"running"> | Type.TLiteral<"success"> | Type.TLiteral<"error">)[]>>;
}, never, Type.InferOptionalKeys<{
    readonly type: Type.TOptional<Type.TUnion<(Type.TLiteral<"scrape"> | Type.TLiteral<"job_apply"> | Type.TLiteral<"email">)[]>>;
    readonly status: Type.TOptional<Type.TUnion<(Type.TLiteral<"pending"> | Type.TLiteral<"running"> | Type.TLiteral<"success"> | Type.TLiteral<"error">)[]>>;
}>>;
export type AutomationRunQuery = StaticParse<typeof automationRunQuerySchema>;
export declare const automationRunIdParamsSchema: Type.TObject<{
    readonly id: Type.TString;
}, "id", never>;
export type AutomationRunIdParams = StaticParse<typeof automationRunIdParamsSchema>;
export { AUTOMATION_RUN_STATUSES, AUTOMATION_RUN_TYPES, AUTOMATION_STATUS_ERROR, AUTOMATION_STATUS_PENDING, AUTOMATION_STATUS_SUCCESS, };
