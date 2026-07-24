import { afterEach, describe, expect, test } from "bun:test";
import type { FieldMapperAIClient } from "./smart-field-mapper";
import { smartFieldMapper } from "./smart-field-mapper";
import { HTTP_STATUS_OK, HTTP_STATUS_SERVICE_UNAVAILABLE } from "@bao/shared/constants/http";

const originalFetch = globalThis.fetch;
const TEST_FIELD_EMAIL = "email";
const TEST_JOB_URL = "https://example.com/job";
const TEST_ANALYSIS_CONTEXT = {
  resume: {
    personalInfo: {
      name: "Bao Builder",
      email: "bao@example.com",
      phone: "555-0100",
      portfolio: "https://portfolio.example.com",
    },
    summary: "Gameplay engineer with shipping experience on multiplayer titles.",
    skills: {
      technical: ["TypeScript", "Bun", "Playwright"],
      soft: ["Communication"],
      gaming: ["Live Ops"],
    },
  },
  existingAnswers: {},
} as const;

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
    selectorMap: {
      [fieldName]: [createSelector(fieldName)],
    },
    fieldAnswers: {
      portfolioLink: "https://portfolio.example.com",
    },
  });

const EMAIL_SELECTOR = createSelector(TEST_FIELD_EMAIL);
const EMPTY_ANALYSIS_RESULT = {
  selectorMap: {},
  fieldAnswers: {},
};

const analyzeEmailField = (aiClient: FieldMapperAIClient) =>
  smartFieldMapper.analyze(TEST_JOB_URL, [TEST_FIELD_EMAIL], TEST_ANALYSIS_CONTEXT, aiClient);

function registerFetchFailureCase(): void {
  test("returns empty mapping when page fetch status is not successful", async () => {
    globalThis.fetch = createFetchMock("upstream unavailable", HTTP_STATUS_SERVICE_UNAVAILABLE);

    const aiClient: FieldMapperAIClient = {
      generate: () => Promise.resolve(createAiResponse("{}")),
    };

    const result = await analyzeEmailField(aiClient);
    expect(result).toEqual(EMPTY_ANALYSIS_RESULT);
  });
}

function registerInvalidJsonCase(): void {
  test("returns empty mapping for invalid AI selector JSON", async () => {
    globalThis.fetch = createFetchMock("<form><input name='email' /></form>", HTTP_STATUS_OK);

    const aiClient: FieldMapperAIClient = {
      generate: () => Promise.resolve(createAiResponse("not-json")),
    };

    const result = await analyzeEmailField(aiClient);
    expect(result).toEqual(EMPTY_ANALYSIS_RESULT);
  });
}

function registerAiRetryCase(): void {
  test("retries AI generation and returns validated selectors on second attempt", async () => {
    globalThis.fetch = createFetchMock("<form><input name='email' /></form>", HTTP_STATUS_OK);

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

    const result = await analyzeEmailField(aiClient);
    expect(callCount).toBeGreaterThanOrEqual(2);
    expect(result.selectorMap.email?.[0]).toBe(EMAIL_SELECTOR);
    expect(result.fieldAnswers.portfolioLink).toBe("https://portfolio.example.com");
  });
}

function registerFetchRetryCase(): void {
  test("retries page fetch for transient status codes before AI analysis", async () => {
    globalThis.fetch = createSequencedFetchMock([
      { body: "service unavailable", status: 503 },
      { body: "<form><input name='email' /></form>", status: 200 },
    ]);

    const aiClient: FieldMapperAIClient = {
      generate: () => Promise.resolve(createAiResponse(createSelectorResponse(TEST_FIELD_EMAIL))),
    };

    const result = await analyzeEmailField(aiClient);
    expect(result.selectorMap.email?.[0]).toBe(EMAIL_SELECTOR);
  });
}

describe("smartFieldMapper", () => {
  registerFetchFailureCase();
  registerInvalidJsonCase();
  registerAiRetryCase();
  registerFetchRetryCase();
});
