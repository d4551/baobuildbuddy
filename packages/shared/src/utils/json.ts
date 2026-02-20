import type { z } from "zod";

/**
 * Primitive JSON value.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Object JSON value.
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Array JSON value.
 */
export type JsonArray = JsonValue[];

/**
 * JSON value.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

type ParseSuccess<T extends JsonValue> = {
  ok: true;
  value: T;
  index: number;
};

type ParseFailure = {
  ok: false;
  index: number;
};

type ParseResult<T extends JsonValue> = ParseSuccess<T> | ParseFailure;

const ESCAPE_MAP: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

const isWhitespace = (char: string | undefined): boolean =>
  char === " " || char === "\n" || char === "\r" || char === "\t";

const isDigit = (char: string | undefined): boolean =>
  typeof char === "string" && char >= "0" && char <= "9";

const isHexDigit = (char: string): boolean =>
  (char >= "0" && char <= "9") || (char >= "a" && char <= "f") || (char >= "A" && char <= "F");

function skipWhitespace(input: string, index: number): number {
  let cursor = index;
  while (cursor < input.length && isWhitespace(input[cursor])) {
    cursor += 1;
  }
  return cursor;
}

function parseString(input: string, startIndex: number): ParseResult<string> {
  if (input[startIndex] !== '"') {
    return { ok: false, index: startIndex };
  }

  let cursor = startIndex + 1;
  let value = "";

  while (cursor < input.length) {
    const char = input[cursor];
    if (!char) {
      return { ok: false, index: cursor };
    }

    if (char === '"') {
      return { ok: true, value, index: cursor + 1 };
    }

    if (char === "\\") {
      const escaped = input[cursor + 1];
      if (!escaped) {
        return { ok: false, index: cursor };
      }

      if (escaped === "u") {
        const unicode = input.slice(cursor + 2, cursor + 6);
        if (unicode.length !== 4 || !unicode.split("").every(isHexDigit)) {
          return { ok: false, index: cursor };
        }
        value += String.fromCodePoint(Number.parseInt(unicode, 16));
        cursor += 6;
        continue;
      }

      const replacement = ESCAPE_MAP[escaped];
      if (replacement === undefined) {
        return { ok: false, index: cursor };
      }
      value += replacement;
      cursor += 2;
      continue;
    }

    if (char <= "\u001F") {
      return { ok: false, index: cursor };
    }

    value += char;
    cursor += 1;
  }

  return { ok: false, index: cursor };
}

function parseLiteral<T extends JsonPrimitive>(
  input: string,
  startIndex: number,
  literal: string,
  value: T,
): ParseResult<T> {
  if (input.slice(startIndex, startIndex + literal.length) !== literal) {
    return { ok: false, index: startIndex };
  }
  return { ok: true, value, index: startIndex + literal.length };
}

function parseNumber(input: string, startIndex: number): ParseResult<number> {
  let cursor = startIndex;

  if (input[cursor] === "-") {
    cursor += 1;
  }

  const integerStart = cursor;
  if (input[cursor] === "0") {
    cursor += 1;
  } else {
    if (!isDigit(input[cursor])) {
      return { ok: false, index: startIndex };
    }
    while (isDigit(input[cursor])) {
      cursor += 1;
    }
  }

  if (cursor === integerStart) {
    return { ok: false, index: startIndex };
  }

  if (input[cursor] === ".") {
    cursor += 1;
    if (!isDigit(input[cursor])) {
      return { ok: false, index: startIndex };
    }
    while (isDigit(input[cursor])) {
      cursor += 1;
    }
  }

  const exponentToken = input[cursor];
  if (exponentToken === "e" || exponentToken === "E") {
    cursor += 1;
    const signToken = input[cursor];
    if (signToken === "+" || signToken === "-") {
      cursor += 1;
    }
    if (!isDigit(input[cursor])) {
      return { ok: false, index: startIndex };
    }
    while (isDigit(input[cursor])) {
      cursor += 1;
    }
  }

  const parsedValue = Number(input.slice(startIndex, cursor));
  if (!Number.isFinite(parsedValue)) {
    return { ok: false, index: startIndex };
  }

  return { ok: true, value: parsedValue, index: cursor };
}

function parseArray(input: string, startIndex: number): ParseResult<JsonArray> {
  if (input[startIndex] !== "[") {
    return { ok: false, index: startIndex };
  }

  let cursor = skipWhitespace(input, startIndex + 1);
  const values: JsonArray = [];

  if (input[cursor] === "]") {
    return { ok: true, value: values, index: cursor + 1 };
  }

  while (cursor < input.length) {
    const item = parseValue(input, cursor);
    if (!item.ok) {
      return { ok: false, index: item.index };
    }
    values.push(item.value);

    cursor = skipWhitespace(input, item.index);
    const separator = input[cursor];
    if (separator === ",") {
      cursor = skipWhitespace(input, cursor + 1);
      continue;
    }
    if (separator === "]") {
      return { ok: true, value: values, index: cursor + 1 };
    }
    return { ok: false, index: cursor };
  }

  return { ok: false, index: cursor };
}

function parseObject(input: string, startIndex: number): ParseResult<JsonObject> {
  if (input[startIndex] !== "{") {
    return { ok: false, index: startIndex };
  }

  let cursor = skipWhitespace(input, startIndex + 1);
  const output: JsonObject = {};

  if (input[cursor] === "}") {
    return { ok: true, value: output, index: cursor + 1 };
  }

  while (cursor < input.length) {
    const keyResult = parseString(input, cursor);
    if (!keyResult.ok) {
      return { ok: false, index: keyResult.index };
    }

    cursor = skipWhitespace(input, keyResult.index);
    if (input[cursor] !== ":") {
      return { ok: false, index: cursor };
    }

    cursor = skipWhitespace(input, cursor + 1);
    const valueResult = parseValue(input, cursor);
    if (!valueResult.ok) {
      return { ok: false, index: valueResult.index };
    }

    output[keyResult.value] = valueResult.value;
    cursor = skipWhitespace(input, valueResult.index);

    const separator = input[cursor];
    if (separator === ",") {
      cursor = skipWhitespace(input, cursor + 1);
      continue;
    }
    if (separator === "}") {
      return { ok: true, value: output, index: cursor + 1 };
    }
    return { ok: false, index: cursor };
  }

  return { ok: false, index: cursor };
}

function parseValue(input: string, startIndex: number): ParseResult<JsonValue> {
  const cursor = skipWhitespace(input, startIndex);
  const token = input[cursor];

  if (!token) {
    return { ok: false, index: cursor };
  }

  if (token === '"') {
    return parseString(input, cursor);
  }
  if (token === "{") {
    return parseObject(input, cursor);
  }
  if (token === "[") {
    return parseArray(input, cursor);
  }
  if (token === "t") {
    return parseLiteral(input, cursor, "true", true);
  }
  if (token === "f") {
    return parseLiteral(input, cursor, "false", false);
  }
  if (token === "n") {
    return parseLiteral(input, cursor, "null", null);
  }
  if (token === "-" || isDigit(token)) {
    return parseNumber(input, cursor);
  }

  return { ok: false, index: cursor };
}

function parseJsonValue(json: string): JsonValue | null {
  const valueResult = parseValue(json, 0);
  if (!valueResult.ok) {
    return null;
  }

  const trailingIndex = skipWhitespace(json, valueResult.index);
  if (trailingIndex !== json.length) {
    return null;
  }

  return valueResult.value;
}

/**
 * Safely parses JSON without throwing. Returns null on invalid input.
 */
export function safeParseJson(json: string): JsonValue | null {
  if (typeof json !== "string" || json.trim().length === 0) {
    return null;
  }
  return parseJsonValue(json);
}

/**
 * Parses JSON and validates with a Zod schema. Returns null on parse or validation failure.
 */
export function parseJson<T>(json: string, schema: z.ZodType<T>): T | null {
  const parsed = safeParseJson(json);
  if (parsed === null) return null;
  const result = schema.safeParse(parsed);
  return result.success ? result.data : null;
}
