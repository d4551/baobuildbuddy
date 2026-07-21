import { type JsonValue, safeParseJson } from "@bao/shared/utils/json";

type ParseScriptInputSuccess<T> = {
  ok: true;
  value: T;
};

type ParseScriptInputFailure = {
  ok: false;
  message: string;
};

/**
 * Structural schema surface used by automation scripts.
 * Avoids ZodType generic deep-instantiation on large envelopes.
 */
type ScriptInputSchema<T> = {
  safeParse: (
    data: JsonValue,
  ) =>
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: ReadonlyArray<{ path: ReadonlyArray<string | number | symbol> }> };
      };
};

/**
 * Reads and validates stdin JSON against a supplied Zod schema.
 *
 * @param schema Runtime schema for the script payload.
 * @returns Parsed payload or a deterministic validation failure.
 */
export const parseScriptInput = async <T>(
  schema: ScriptInputSchema<T>,
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
export const writeJsonResult = <TPayload>(payload: TPayload): void => {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
};
