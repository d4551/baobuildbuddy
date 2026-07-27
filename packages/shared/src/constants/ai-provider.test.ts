import { describe, expect, test } from "bun:test";
import { claudeModelAcceptsSamplingParameters } from "./ai-provider";

/**
 * Anthropic removed `temperature` / `top_p` / `top_k` from Claude Opus 4.7 onward.
 * The server's Claude provider defaults to one of those models, so a regression
 * here means every Claude request comes back `400 invalid_request_error`.
 */
describe("claudeModelAcceptsSamplingParameters", () => {
  test.each([
    "claude-opus-5",
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-sonnet-5",
    "claude-fable-5",
    "claude-mythos-5",
  ])("omits sampling parameters for %s", (model) => {
    expect(claudeModelAcceptsSamplingParameters(model)).toBe(false);
  });

  test.each(["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-5"])(
    "keeps sampling parameters for %s",
    (model) => {
      expect(claudeModelAcceptsSamplingParameters(model)).toBe(true);
    },
  );

  test("normalizes surrounding whitespace and casing", () => {
    expect(claudeModelAcceptsSamplingParameters("  Claude-Opus-5  ")).toBe(false);
  });

  test("treats dated snapshots of a removed-sampling model as removed", () => {
    expect(claudeModelAcceptsSamplingParameters("claude-opus-5-20260115")).toBe(false);
  });

  test("defaults to accepting sampling parameters for unknown model ids", () => {
    expect(claudeModelAcceptsSamplingParameters("some-future-model")).toBe(true);
  });
});
