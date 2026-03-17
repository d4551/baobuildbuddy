export declare const config: {
    port: number;
    host: string;
    dbPath: string;
    logLevel: string;
    corsOrigins: string[];
    /** When true, skip API key auth (local dev only) */
    disableAuth: boolean;
    /** When true, expose deterministic automation verification helpers for packaged-runtime checks. */
    readonly enableAutomationVerification: boolean;
    /** When true, allow localhost/private automation URLs for deterministic local verification flows. */
    readonly allowAutomationPrivateHosts: boolean;
    automationScriptTimeoutMs: number;
    automationStdioBufferLimit: number;
    smartFieldMapperRetries: number;
    smartFieldMapperRetryDelayMs: number;
    smartFieldMapperFetchTimeoutMs: number;
    smartFieldMapperMaxFormHtmlChars: number;
    smartFieldMapperUserAgent: string;
};
