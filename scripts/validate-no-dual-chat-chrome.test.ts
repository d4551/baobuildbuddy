import { describe, expect, it } from "bun:test";
import { collectDualChatChromeViolations } from "./validate-no-dual-chat-chrome";

describe("validate-no-dual-chat-chrome", () => {
  it("passes for current dock + desktop-gated floating chat layout", async () => {
    const violations = await collectDualChatChromeViolations();
    expect(violations).toEqual([]);
  });
});
