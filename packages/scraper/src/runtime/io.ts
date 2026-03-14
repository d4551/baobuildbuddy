import { safeParseJson } from "@bao/shared";
import type { ZodType } from "zod";

type ParseScriptInputSuccess<T> = {
  ok: true;
  value: T;
};

type ParseScriptInputFailure = {
  ok: false;
  message: string;
};

/**
 * Reads and validates stdin JSON against a supplied Zod schema.
 *
 * @param schema Runtime schema for the script payload.
 * @returns Parsed payload or a deterministic validation failure.
 */
export const parseScriptInput = async <T>(
  schema: ZodType<T>,
): Promise<ParseScriptInputSuccess<T> | ParseScriptInputFailure> => {
  const rawInput = await Bun.stdin.text();
  const normalizedInput = rawInput.trim().length > 0 ? rawInput : "{}";
  const parsedJson = safeParseJson(normalizedInput);

  if (parsedJson === null) {
    return {
      ok: false,
      message: "Automation script received invalid JSON input.",
    };
  }

  const parsedPayload = schema.safeParse(parsedJson);
  if (!parsedPayload.success) {
    const firstIssue = parsedPayload.error.issues[0];
    const issuePath = firstIssue?.path.join(".") || "root";
    return {
      ok: false,
      message: `Automation script payload is invalid at ${issuePath}.`,
    };
  }

  return {
    ok: true,
    value: parsedPayload.data,
  };
};

/**
 * Writes a plain JSON result payload to stdout for scraper-style scripts.
 *
 * @param payload JSON-serializable payload written to stdout.
 */
export const writeJsonResult = (payload: unknown): void => {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
};
