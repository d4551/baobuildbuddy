import { afterEach, describe, expect, test } from "bun:test";
import type { FieldMapperAIClient } from "./smart-field-mapper";
import { smartFieldMapper } from "./smart-field-mapper";

const originalFetch = globalThis.fetch;

const createFetchMock = (body: string, status: number): typeof fetch =>
  Object.assign(
    async (_input: string | URL | Request, _init?: RequestInit) =>
      new Response(body, {
        status,
      }),
    {
      preconnect: originalFetch.preconnect,
    },
  );

const createSequencedFetchMock = (
  responses: Array<{ body: string; status: number }>,
): typeof fetch => {
  let index = 0;
  return Object.assign(
    async (_input: string | URL | Request, _init?: RequestInit) => {
      const response = responses[Math.min(index, responses.length - 1)];
      index += 1;
      return new Response(response.body, {
        status: response.status,
      });
    },
    {
      preconnect: originalFetch.preconnect,
    },
  );
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const createAiResponse = (content: string, error?: string) => ({
  id: crypto.randomUUID(),
  provider: "local" as const,
  model: "test-model",
  content,
  ...(error ? { error } : {}),
});

describe("smartFieldMapper", () => {
  test("returns empty mapping when page fetch status is not successful", async () => {
    globalThis.fetch = createFetchMock("upstream unavailable", 503);

    const aiClient: FieldMapperAIClient = {
      generate: async () => createAiResponse("{}"),
    };

    const result = await smartFieldMapper.analyze("https://example.com/job", ["email"], aiClient);
    expect(result).toEqual({});
  });

  test("returns empty mapping for invalid AI selector JSON", async () => {
    globalThis.fetch = createFetchMock("<form><input name='email' /></form>", 200);

    const aiClient: FieldMapperAIClient = {
      generate: async () => createAiResponse("not-json"),
    };

    const result = await smartFieldMapper.analyze("https://example.com/job", ["email"], aiClient);
    expect(result).toEqual({});
  });

  test("retries AI generation and returns validated selectors on second attempt", async () => {
    globalThis.fetch = createFetchMock("<form><input name='email' /></form>", 200);

    let callCount = 0;
    const aiClient: FieldMapperAIClient = {
      generate: async () => {
        callCount += 1;
        if (callCount === 1) {
          return createAiResponse("", "temporary failure");
        }
        return createAiResponse('{"email":["input[name=\\"email\\"]"]}');
      },
    };

    const result = await smartFieldMapper.analyze("https://example.com/job", ["email"], aiClient);
    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(result.email?.[0]).toBe('input[name="email"]');
  });

  test("retries page fetch for transient status codes before AI analysis", async () => {
    globalThis.fetch = createSequencedFetchMock([
      { body: "service unavailable", status: 503 },
      { body: "<form><input name='email' /></form>", status: 200 },
    ]);

    const aiClient: FieldMapperAIClient = {
      generate: async () => createAiResponse('{"email":["input[name=\\"email\\"]"]}'),
    };

    const result = await smartFieldMapper.analyze("https://example.com/job", ["email"], aiClient);
    expect(result.email?.[0]).toBe('input[name="email"]');
  });
});
