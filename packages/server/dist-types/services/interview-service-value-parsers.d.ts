import { type JsonObject, type JsonValue } from "@bao/shared/utils/json";
export declare const toPersistedRecord: (value: object) => JsonObject;
export declare function parseNumber<T>(value: T, fallback: number, min: number, max: number): number;
export declare function parseBoolean<T>(value: T, fallback: boolean): boolean;
export declare function parseString<T>(value: T, fallback: string): string;
export declare function parseStringArray<T>(value: T): string[];
export declare function extractJSON(text: string): string;
/**
 * Parses a model-authored payload (optionally fenced) into a typed JSON value.
 * Returns null when the payload is not parseable JSON.
 */
export declare function safeParseJSON(payload: string): JsonValue | null;
