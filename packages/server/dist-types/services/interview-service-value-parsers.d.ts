export declare const toPersistedRecord: (value: object) => Record<string, unknown>;
export declare function parseNumber(value: unknown, fallback: number, min: number, max: number): number;
export declare function parseBoolean(value: unknown, fallback: boolean): boolean;
export declare function parseString(value: unknown, fallback: string): string;
export declare function parseStringArray(value: unknown): string[];
export declare function extractJSON(text: string): string;
export declare function safeParseJSON(payload: unknown): unknown;
