import type { RouteSetState } from "./ai-route-contracts";
export declare const handleAutomationActionRoute: (body: {
    action: string;
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
}, set: RouteSetState) => Promise<{
    error: string;
    runId?: undefined;
    status?: undefined;
    message?: undefined;
} | {
    runId: string;
    status: string;
    message: string;
    error?: undefined;
}>;
