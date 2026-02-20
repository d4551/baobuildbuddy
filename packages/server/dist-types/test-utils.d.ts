export interface ApiResponseEnvelope<T> {
    status: number;
    body: T;
}
export interface AppRequestHandler {
    handle(request: Request): Response | Promise<Response>;
}
export declare function createTestDbPath(prefix: string): string;
export declare function requestJson<T>(app: AppRequestHandler, method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponseEnvelope<T>>;
