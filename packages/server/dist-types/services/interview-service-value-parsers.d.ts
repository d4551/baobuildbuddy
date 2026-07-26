import { type JsonValue } from "@bao/shared/utils/json";
export declare const toPersistedRecord: (value: object) => Record<string, unknown>;
export declare function parseNumber(value: unknown, fallback: number, min: number, max: number): number;
export declare function parseBoolean(value: unknown, fallback: boolean): boolean;
export declare function parseString(value: unknown, fallback: string): string;
export declare function parseStringArray(value: unknown): string[];
export declare function extractJSON(text: string): string;
/**
 * Parses a model-authored payload (optionally fenced) into a typed JSON value.
 * Returns null when the payload is not parseable JSON.
 */
export declare function safeParseJSON(payload: string): JsonValue | null;
