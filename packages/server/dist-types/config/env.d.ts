export declare const isProductionRuntime: () => boolean;
export declare const isTestRuntime: boolean;
/**
 * Resolves the current server runtime configuration from environment variables.
 */
export declare function readConfig(): {
    smartFieldMapperRetries: number;
    smartFieldMapperRetryDelayMs: number;
    smartFieldMapperFetchTimeoutMs: number;
    smartFieldMapperMaxFormHtmlChars: number;
    smartFieldMapperUserAgent: string;
    automationScriptTimeoutMs: number;
    automationStdioBufferLimit: number;
    enableAutomationVerification: boolean;
    allowAutomationPrivateHosts: boolean;
    disableAuth: boolean;
    authSetupToken: string | null;
    port: number;
    host: string;
    dbPath: string;
    logLevel: string;
    corsOrigins: string[];
};
/**
 * Stable server runtime configuration for the current process.
 */
export type ServerConfig = ReturnType<typeof readConfig>;
/**
 * Cached runtime configuration for the active process.
 */
export declare const config: ServerConfig;
