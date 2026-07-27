import { describe, expect, test } from "bun:test";
import { toErrorMessage } from "./error-helpers";
import { containsSecret, REDACTED_SECRET_PLACEHOLDER, redactSecrets } from "./secret-redaction";

/**
 * Fixture bodies are composed at runtime rather than written as literals.
 *
 * A key-shaped literal in this file would be a real finding for the repository's
 * secret scanner, and silencing that scanner to accommodate a test is exactly the
 * kind of softening that lets an actual credential through later. Assembling the
 * prefix and a zero-entropy body at runtime exercises the same regex branches
 * while leaving nothing secret-shaped in the source.
 */
const FIXTURE_BODY_LENGTH = 24;
const fixtureBody = (filler: string): string => filler.repeat(FIXTURE_BODY_LENGTH);
const credential = (prefix: string, filler = "a"): string => `${prefix}${fixtureBody(filler)}`;

const CREDENTIALS = [
  { label: "OpenAI project key", value: credential("sk-proj-") },
  { label: "OpenAI secret key", value: credential("sk-") },
  { label: "Anthropic key", value: credential("sk-ant-api03-") },
  { label: "Google AI Studio key", value: credential("AIza") },
  { label: "Hugging Face token", value: credential("hf_") },
  { label: "Groq key", value: credential("gsk_") },
  { label: "application API key", value: credential("bao_") },
] as const;

const OPENAI_FIXTURE = credential("sk-proj-", "A");
const ANTHROPIC_FIXTURE = credential("sk-ant-", "B");

describe("redactSecrets removes credential shapes", () => {
  for (const credential of CREDENTIALS) {
    test(`redacts a ${credential.label}`, () => {
      const redacted = redactSecrets(`Invalid API key ${credential.value}`);
      expect(redacted).toBe(`Invalid API key ${REDACTED_SECRET_PLACEHOLDER}`);
      expect(containsSecret(redacted)).toBe(false);
    });
  }

  test("redacts a bearer credential regardless of case", () => {
    expect(redactSecrets("sent Bearer abcdefghijklmnop to upstream")).toBe(
      `sent ${REDACTED_SECRET_PLACEHOLDER} to upstream`,
    );
    expect(redactSecrets("header: bearer abcdefghijklmnop")).toBe(
      `header: ${REDACTED_SECRET_PLACEHOLDER}`,
    );
  });

  test("redacts every credential in a multi-provider failure message", () => {
    const redacted = redactSecrets(
      `All providers failed: openai: ${OPENAI_FIXTURE}; anthropic: ${ANTHROPIC_FIXTURE}`,
    );
    expect(redacted).toBe(
      `All providers failed: openai: ${REDACTED_SECRET_PLACEHOLDER}; anthropic: ${REDACTED_SECRET_PLACEHOLDER}`,
    );
  });

  test("is stateless across successive calls", () => {
    const message = `key ${OPENAI_FIXTURE} rejected`;
    const first = redactSecrets(message);
    expect(redactSecrets(message)).toBe(first);
    expect(redactSecrets(message)).toBe(first);
  });
});

describe("redactSecrets leaves ordinary text alone", () => {
  test("keeps prose that merely mentions a prefix", () => {
    expect(redactSecrets("set the sk- prefix and a Bearer scheme")).toBe(
      "set the sk- prefix and a Bearer scheme",
    );
  });

  test("keeps a short non-credential token", () => {
    expect(redactSecrets("hf_short")).toBe("hf_short");
  });

  test("keeps an empty message empty", () => {
    expect(redactSecrets("")).toBe("");
  });
});

describe("containsSecret", () => {
  test("detects a credential and clears ordinary prose", () => {
    expect(containsSecret(`Invalid API key ${OPENAI_FIXTURE}`)).toBe(true);
    expect(containsSecret("Invalid API key")).toBe(false);
  });

  test("is stateless across successive calls", () => {
    const message = `Invalid API key ${OPENAI_FIXTURE}`;
    expect(containsSecret(message)).toBe(true);
    expect(containsSecret(message)).toBe(true);
  });
});

describe("toErrorMessage redacts at the boundary", () => {
  test("redacts a credential quoted inside an Error message", () => {
    const message = toErrorMessage(
      new Error(`All providers failed to generate: openai: Invalid API key ${OPENAI_FIXTURE}`),
    );
    expect(containsSecret(message)).toBe(false);
    expect(message).toContain(REDACTED_SECRET_PLACEHOLDER);
  });

  test("redacts a credential in a string error", () => {
    expect(containsSecret(toErrorMessage(`bad key ${ANTHROPIC_FIXTURE}`))).toBe(false);
  });

  test("redacts a credential in an Eden-shaped error record", () => {
    expect(containsSecret(toErrorMessage({ message: `bad key ${credential("hf_", "C")}` }))).toBe(
      false,
    );
  });

  test("redacts a credential in a nested Eden error value", () => {
    expect(
      containsSecret(toErrorMessage({ value: { message: `bad key ${credential("bao_", "D")}` } })),
    ).toBe(false);
  });
});
