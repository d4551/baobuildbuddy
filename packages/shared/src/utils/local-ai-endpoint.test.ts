import { describe, expect, test } from "bun:test";
import { validateLocalAiEndpoint } from "./local-ai-endpoint";

describe("local AI endpoint validation", () => {
  test("allows loopback Ollama-style endpoints", () => {
    expect(validateLocalAiEndpoint("http://localhost:11434/v1")).toEqual({
      ok: true,
      endpoint: "http://localhost:11434/v1",
    });
    expect(validateLocalAiEndpoint("http://127.0.0.1:1234")).toEqual({
      ok: true,
      endpoint: "http://127.0.0.1:1234/",
    });
  });

  test("denies non-loopback and credentialed URLs", () => {
    const credentialed = new URL("http://localhost:11434/v1");
    credentialed.username = "probe-user";
    credentialed.password = "x";
    expect(validateLocalAiEndpoint("http://169.254.169.254/latest").ok).toEqual(false);
    expect(validateLocalAiEndpoint("http://metadata.google.internal/").ok).toEqual(false);
    expect(validateLocalAiEndpoint("http://example.com/v1").ok).toEqual(false);
    expect(validateLocalAiEndpoint(credentialed.toString()).ok).toEqual(false);
    expect(validateLocalAiEndpoint("file:///tmp/not-a-model").ok).toEqual(false);
  });
});
