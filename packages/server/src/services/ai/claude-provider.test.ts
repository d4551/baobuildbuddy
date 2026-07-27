import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { isRecord } from "@bao/shared/utils/type-guards";
import { ClaudeProvider } from "./claude-provider";

/**
 * These assert the request that actually goes on the wire.
 *
 * Anthropic removed `temperature` from Claude Opus 4.7 onward, and this provider
 * defaults to `claude-sonnet-5` — so unconditionally sending a default temperature
 * turned every Claude generation into a `400 invalid_request_error`. Asserting the
 * serialized body (rather than the helper in isolation) is what keeps the omission
 * wired through `messages.create` and `messages.stream`.
 */
const LEGACY_MODEL_TEMPERATURE = 0.42;
const originalFetch = globalThis.fetch;
const requestBodies: Array<Record<string, unknown>> = [];

const buildMessageResponse = (model: string): Response =>
  new Response(
    JSON.stringify({
      id: "msg_stub",
      type: "message",
      role: "assistant",
      model,
      content: [{ type: "text", text: "ok" }],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
    { status: HTTP_STATUS_OK, headers: { "content-type": "application/json" } },
  );

function recordingFetch(_input: URL | RequestInfo, init?: RequestInit): Promise<Response> {
  const rawBody = typeof init?.body === "string" ? init.body : "{}";
  const parsed: unknown = JSON.parse(rawBody);
  const body = isRecord(parsed) ? parsed : {};
  requestBodies.push(body);
  const model = typeof body.model === "string" ? body.model : "unknown";
  return Promise.resolve(buildMessageResponse(model));
}

recordingFetch.preconnect = globalThis.fetch.preconnect;
globalThis.fetch = recordingFetch;

afterAll(() => {
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  requestBodies.length = 0;
});

const lastRequestBody = (): Record<string, unknown> => {
  const body = requestBodies.at(-1);
  if (!body) {
    throw new Error("No Claude request was captured");
  }
  return body;
};

describe("ClaudeProvider sampling parameters", () => {
  test("omits temperature for the default (Claude 5) model", async () => {
    const provider = new ClaudeProvider("test-key");

    const response = await provider.generate("hello");

    expect(response.error).toBeUndefined();
    expect(Object.hasOwn(lastRequestBody(), "temperature")).toBe(false);
  });

  test("omits temperature even when the caller supplies one", async () => {
    const provider = new ClaudeProvider("test-key");

    await provider.generate("hello", { temperature: 0.9 });

    expect(Object.hasOwn(lastRequestBody(), "temperature")).toBe(false);
  });

  test("keeps temperature for models that still accept it", async () => {
    const provider = new ClaudeProvider("test-key", "claude-opus-4-6");

    await provider.generate("hello", { temperature: LEGACY_MODEL_TEMPERATURE });

    expect(lastRequestBody().temperature).toBe(LEGACY_MODEL_TEMPERATURE);
  });

  test("omits temperature when a per-request Claude 5 model overrides an older default", async () => {
    const provider = new ClaudeProvider("test-key", "claude-opus-4-6");

    await provider.generate("hello", {
      model: "claude-opus-5",
      temperature: LEGACY_MODEL_TEMPERATURE,
    });

    expect(Object.hasOwn(lastRequestBody(), "temperature")).toBe(false);
    expect(lastRequestBody().model).toBe("claude-opus-5");
  });
});
