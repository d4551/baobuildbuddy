import { DEFAULT_SPEECH_SETTINGS } from "@bao/shared/constants/settings";
import { describe, expect, it } from "vitest";
import { resolveSpeechSttProvider, shouldUseServerStt } from "./speech-stt-provider";

describe("resolveSpeechSttProvider", () => {
  it("keeps explicit browser provider", () => {
    expect(resolveSpeechSttProvider("browser")).toBe("browser");
    expect(shouldUseServerStt("browser")).toBe(false);
  });

  it("keeps local / openai / huggingface / custom", () => {
    expect(resolveSpeechSttProvider("local")).toBe("local");
    expect(resolveSpeechSttProvider("openai")).toBe("openai");
    expect(resolveSpeechSttProvider("huggingface")).toBe("huggingface");
    expect(resolveSpeechSttProvider("custom")).toBe("custom");
    expect(shouldUseServerStt("local")).toBe(true);
  });

  it("defaults empty/unknown to local Whisper (not silent browser)", () => {
    expect(resolveSpeechSttProvider(undefined)).toBe(DEFAULT_SPEECH_SETTINGS.stt.provider);
    expect(resolveSpeechSttProvider(null)).toBe(DEFAULT_SPEECH_SETTINGS.stt.provider);
    expect(resolveSpeechSttProvider("")).toBe(DEFAULT_SPEECH_SETTINGS.stt.provider);
    expect(resolveSpeechSttProvider("garbage")).toBe(DEFAULT_SPEECH_SETTINGS.stt.provider);
    expect(DEFAULT_SPEECH_SETTINGS.stt.provider).toBe("local");
  });
});
