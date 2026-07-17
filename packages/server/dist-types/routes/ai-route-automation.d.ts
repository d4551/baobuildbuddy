export declare const handleAutomationActionRoute: (body: {
    action: string;
    jobUrl: string;
    resumeId: string;
    coverLetterId?: string;
    jobId?: string;
}) => Promise<{
    status: 200;
    body: {
        runId: string;
        status: string;
        message: string;
    };
} | {
    status: 400;
    body: {
        error: string;
    };
} | {
    status: 404 | 409 | 422 | 500;
    body: {
        error: string;
    };
}>;
