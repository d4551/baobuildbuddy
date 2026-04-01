import type { FetchPageResult } from "./smart-field-mapper-contracts";
export declare const wait: (delayMs: number) => Promise<void>;
export declare const fetchPageWithRetry: (params: {
    url: string;
    attemptsRemaining: number;
    delayMs: number;
}) => Promise<FetchPageResult>;
