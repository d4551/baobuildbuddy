import { DEFAULT_SPEECH_SETTINGS } from "@bao/shared/constants/settings";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import { describe, expect, it } from "vitest";
import {
  buildNextSpeechConfigFromProfile,
  createDefaultSpeechModelProfileState,
  isSpeechModelProfileDirty,
  mapPersistedSpeechToProfileState,
  type SpeechModelProfileState,
} from "./speech-model-profile-state";

const baseProfile = (): SpeechModelProfileState => createDefaultSpeechModelProfileState();

describe("speech-model-profile-state", () => {
  it("defaults endpoints from DEFAULT_SPEECH_SETTINGS", () => {
    const profile = createDefaultSpeechModelProfileState();
    expect(profile.sttEndpoint).toBe(DEFAULT_SPEECH_SETTINGS.stt.endpoint);
    expect(profile.ttsEndpoint).toBe(DEFAULT_SPEECH_SETTINGS.tts.endpoint);
  });

  it("maps persisted speech including endpoints", () => {
    const persisted = {
      ...DEFAULT_AUTOMATION_SETTINGS.speech,
      stt: {
        ...DEFAULT_AUTOMATION_SETTINGS.speech.stt,
        endpoint: "http://127.0.0.1:9090/v1",
      },
      tts: {
        ...DEFAULT_AUTOMATION_SETTINGS.speech.tts,
        endpoint: "http://127.0.0.1:9091/v1",
      },
    };
    expect(mapPersistedSpeechToProfileState(persisted)).toMatchObject({
      sttEndpoint: "http://127.0.0.1:9090/v1",
      ttsEndpoint: "http://127.0.0.1:9091/v1",
    });
  });

  it("detects dirty endpoint edits after trim", () => {
    const persisted = baseProfile();
    const dirtyStt = { ...persisted, sttEndpoint: " http://127.0.0.1:9001/v1 " };
    expect(isSpeechModelProfileDirty(dirtyStt, persisted)).toBe(true);

    const whitespaceOnly = { ...persisted, sttEndpoint: `  ${persisted.sttEndpoint}  ` };
    expect(isSpeechModelProfileDirty(whitespaceOnly, persisted)).toBe(false);
  });

  it("buildNextSpeechConfigFromProfile persists endpoints and preserves voice/format", () => {
    const existing = DEFAULT_AUTOMATION_SETTINGS.speech;
    const profile: SpeechModelProfileState = {
      ...baseProfile(),
      sttEndpoint: "http://127.0.0.1:8099/v1",
      ttsEndpoint: "http://127.0.0.1:8889/v1",
    };
    const next = buildNextSpeechConfigFromProfile(existing, profile, "en-US");
    expect(next.stt.endpoint).toBe("http://127.0.0.1:8099/v1");
    expect(next.tts.endpoint).toBe("http://127.0.0.1:8889/v1");
    expect(next.tts.voice).toBe(existing.tts.voice);
    expect(next.tts.format).toBe(existing.tts.format);
    expect(next.locale).toBe(existing.locale);
  });

  it("buildNextSpeechConfigFromProfile fills blank endpoints from defaults", () => {
    const existing = DEFAULT_AUTOMATION_SETTINGS.speech;
    const profile: SpeechModelProfileState = {
      ...baseProfile(),
      sttEndpoint: "  ",
      ttsEndpoint: "",
    };
    const next = buildNextSpeechConfigFromProfile(existing, profile, "en-US");
    expect(next.stt.endpoint).toBe(DEFAULT_SPEECH_SETTINGS.stt.endpoint);
    expect(next.tts.endpoint).toBe(DEFAULT_SPEECH_SETTINGS.tts.endpoint);
  });
});
