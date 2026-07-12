import type { RouteSetState } from "../types/route-state";
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
    error?: undefined;
    runId: string;
    status: string;
    message: string;
}>;
