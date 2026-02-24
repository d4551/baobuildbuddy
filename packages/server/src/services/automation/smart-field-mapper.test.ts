import { afterEach, describe, expect, test } from "bun:test";
import type { FieldMapperAIClient } from "./smart-field-mapper";
import { smartFieldMapper } from "./smart-field-mapper";

const originalFetch = globalThis.fetch;
const TEST_FIELD_EMAIL = "email";
const TEST_JOB_URL = "https://example.com/job";

const createFetchMock = (body: string, status: number): typeof fetch =>
  Object.assign(
    () =>
      Promise.resolve(
        new Response(body, {
          status,
        }),
      ),
    {
      preconnect: originalFetch.preconnect,
    },
  );

const createSequencedFetchMock = (
  responses: Array<{ body: string; status: number }>,
): typeof fetch => {
  let index = 0;
  return Object.assign(
    () => {
      const response = responses[Math.min(index, responses.length - 1)];
      index += 1;
      return Promise.resolve(
        new Response(response.body, {
          status: response.status,
        }),
      );
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

const createSelector = (fieldName: string): string =>
  ["input", "[name", '="', fieldName, '"]'].join("");

const createSelectorResponse = (fieldName: string): string =>
  JSON.stringify({
    [fieldName]: [createSelector(fieldName)],
  });

const EMAIL_SELECTOR = createSelector(TEST_FIELD_EMAIL);

describe("smartFieldMapper", () => {
  test("returns empty mapping when page fetch status is not successful", async () => {
    globalThis.fetch = createFetchMock("upstream unavailable", 503);

    const aiClient: FieldMapperAIClient = {
      generate: () => Promise.resolve(createAiResponse("{}")),
    };

    const result = await smartFieldMapper.analyze(TEST_JOB_URL, [TEST_FIELD_EMAIL], aiClient);
    expect(result).toEqual({});
  });

  test("returns empty mapping for invalid AI selector JSON", async () => {
    globalThis.fetch = createFetchMock("<form><input name='email' /></form>", 200);

    const aiClient: FieldMapperAIClient = {
      generate: () => Promise.resolve(createAiResponse("not-json")),
    };

    const result = await smartFieldMapper.analyze(TEST_JOB_URL, [TEST_FIELD_EMAIL], aiClient);
    expect(result).toEqual({});
  });

  test("retries AI generation and returns validated selectors on second attempt", async () => {
    globalThis.fetch = createFetchMock("<form><input name='email' /></form>", 200);

    let callCount = 0;
    const aiClient: FieldMapperAIClient = {
      generate: () => {
        callCount += 1;
        if (callCount === 1) {
          return Promise.resolve(createAiResponse("", "temporary failure"));
        }
        return Promise.resolve(createAiResponse(createSelectorResponse(TEST_FIELD_EMAIL)));
      },
    };

    const result = await smartFieldMapper.analyze(TEST_JOB_URL, [TEST_FIELD_EMAIL], aiClient);
    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(result.email?.[0]).toBe(EMAIL_SELECTOR);
  });

  test("retries page fetch for transient status codes before AI analysis", async () => {
    globalThis.fetch = createSequencedFetchMock([
      { body: "service unavailable", status: 503 },
      { body: "<form><input name='email' /></form>", status: 200 },
    ]);

    const aiClient: FieldMapperAIClient = {
      generate: () => Promise.resolve(createAiResponse(createSelectorResponse(TEST_FIELD_EMAIL))),
    };

    const result = await smartFieldMapper.analyze(TEST_JOB_URL, [TEST_FIELD_EMAIL], aiClient);
    expect(result.email?.[0]).toBe(EMAIL_SELECTOR);
  });
});
