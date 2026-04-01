export declare function withAiOperationTimeout<T>(operation: () => Promise<T>, timeoutMs?: number): Promise<T | null>;
