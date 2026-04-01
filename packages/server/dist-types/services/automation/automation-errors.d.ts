export declare class AutomationConcurrencyLimitError extends Error {
    readonly runningRuns: number;
    readonly maxConcurrentRuns: number;
    constructor(runningRuns: number, maxConcurrentRuns: number);
}
export declare class AutomationDependencyMissingError extends Error {
    readonly resource: "resume" | "coverLetter";
    readonly resourceId: string;
    constructor(resource: "resume" | "coverLetter", resourceId: string);
}
export declare class AutomationValidationError extends Error {
}
export declare class AutomationRunNotFoundError extends Error {
    constructor(runId: string);
}
