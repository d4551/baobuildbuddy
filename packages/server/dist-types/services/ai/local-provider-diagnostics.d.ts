import type { AIProviderDiagnostic } from "@bao/shared/types/ai";
export declare const LOCAL_PROVIDER_ERROR_CODE: AIProviderDiagnostic["code"];
export declare function inspectLocalProviderEndpoint(baseUrl: string, selectedModel?: string): Promise<AIProviderDiagnostic>;
export declare function detectFirstLocalProviderModel(baseUrl: string): Promise<string | null>;
/**
 * Model ids the local server actually serves. Used to reject a per-request model
 * the endpoint does not have installed before it turns into a 404.
 */
export declare function listLocalProviderModelIds(baseUrl: string): Promise<readonly string[]>;
export declare function detectLocalProviderServers(): Promise<Array<{
    id?: string;
    baseUrl: string;
    name: string;
    available: boolean;
    availableModels?: readonly string[];
    diagnosticCode?: AIProviderDiagnostic["code"];
    message?: string;
}>>;
