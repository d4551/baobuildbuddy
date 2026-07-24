export declare const isProductionRuntime: () => boolean;
export declare const isTestRuntime: boolean;
export declare const isBunExecutablePath: (execPath?: string) => boolean;
export declare const shouldUsePrettyLogTransport: (nodeEnv?: string | undefined, execPath?: string, testMode?: string | undefined) => boolean;
export declare const isAuthDisabled: () => boolean;
/**
 * Resolves the current server runtime configuration from environment variables.
 */
export declare function readConfig(): {
    disableAuth: boolean;
    authSetupToken: string | null;
    encryptionKey: string | null;
    automationScriptTimeoutMs: number;
    automationStdioBufferLimit: number;
    smartFieldMapperRetries: number;
    smartFieldMapperRetryDelayMs: number;
    smartFieldMapperFetchTimeoutMs: number;
    smartFieldMapperMaxFormHtmlChars: number;
    smartFieldMapperUserAgent: string;
    port: number;
    host: string;
    dbPath: string;
    logLevel: string;
    corsOrigins: string[];
    localModelEndpoint: string | null;
    localModelName: string | null;
    enableAutomationVerification: boolean;
    allowAutomationPrivateHosts: boolean;
};
/**
 * Stable server runtime configuration for the current process.
 */
export type ServerConfig = ReturnType<typeof readConfig>;
/**
 * Cached runtime configuration for the active process.
 */
export declare const config: ServerConfig;
