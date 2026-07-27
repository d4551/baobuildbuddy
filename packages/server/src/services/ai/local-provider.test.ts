import { afterAll, beforeAll, expect, test } from "bun:test";
import { LocalProvider } from "./local-provider";

const RESPONSE_REASONING =
  "Thank you for the update. I appreciate the opportunity and would be glad to discuss next steps.";

let baseUrl = "";
let stopServer: (() => Promise<void>) | null = null;

beforeAll(() => {
  const startedServer = Bun.serve({
    port: 0,
    fetch(request) {
      const url = new URL(request.url);
      if (url.pathname === "/v1/chat/completions") {
        return Response.json({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 1_775_045_200,
          model: "local-test-model",
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: {
                role: "assistant",
                content: "",
                reasoning: RESPONSE_REASONING,
              },
            },
          ],
          usage: {
            prompt_tokens: 12,
            completion_tokens: 18,
            total_tokens: 30,
          },
        });
      }

      if (url.pathname === "/v1/models") {
        return Response.json({
          object: "list",
          data: [{ id: "local-test-model", object: "model" }],
        });
      }

      return new Response("Not Found", { status: 404 });
    },
  });
  baseUrl = `http://127.0.0.1:${startedServer.port}/v1`;
  stopServer = () => startedServer.stop(true);
});

afterAll(async () => {
  await stopServer?.();
});

test("generate falls back to reasoning for email responses when content is empty", async () => {
  const provider = new LocalProvider(baseUrl, "local-test-model");

  const response = await provider.generate("Draft an interview follow-up", {
    purpose: "emailResponse",
  });

  expect(response.content).toBe(RESPONSE_REASONING);
  expect(response.provider).toBe("local");
  expect(response.model).toBe("local-test-model");
  expect(response.usage).toEqual({
    inputTokens: 12,
    outputTokens: 18,
  });
});

/**
 * Routing fills the per-request model from `preferredModel`, a cross-provider
 * preference seeded with a default name. When that name is not installed locally
 * the endpoint 404s and the call failed with "All providers failed to generate",
 * even though a working model was configured under `localModelName`.
 */
test("generate ignores a per-request model the local server does not serve", async () => {
  const provider = new LocalProvider(baseUrl, "local-test-model");

  const response = await provider.generate("Draft an interview follow-up", {
    purpose: "emailResponse",
    model: "llama3.2",
  });

  expect(response.model).toBe("local-test-model");
  expect(response.error).toBeUndefined();
});

test("generate honours a per-request model the local server does serve", async () => {
  const provider = new LocalProvider(baseUrl, "local-test-model");

  const response = await provider.generate("Draft an interview follow-up", {
    purpose: "emailResponse",
    model: "local-test-model",
  });

  expect(response.model).toBe("local-test-model");
  expect(response.error).toBeUndefined();
});
