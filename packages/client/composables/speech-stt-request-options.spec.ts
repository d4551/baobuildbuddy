import { DEFAULT_SPEECH_SETTINGS } from "@bao/shared/constants/settings";
import { describe, expect, it } from "vitest";
import { createServerSttRequestOptions } from "./speech-stt-request-options";

describe("createServerSttRequestOptions", () => {
  it("fills provider/model/endpoint from defaults when settings empty", () => {
    expect(createServerSttRequestOptions({ value: null })).toEqual({
      provider: DEFAULT_SPEECH_SETTINGS.stt.provider,
      model: DEFAULT_SPEECH_SETTINGS.stt.model,
      endpoint: DEFAULT_SPEECH_SETTINGS.stt.endpoint,
    });
  });

  it("passes through persisted STT routing fields", () => {
    expect(
      createServerSttRequestOptions({
        value: {
          automationSettings: {
            speech: {
              stt: {
                provider: "openai",
                model: "gpt-4o-mini-transcribe",
                endpoint: "https://api.openai.com/v1",
              },
            },
          },
        },
      }),
    ).toEqual({
      provider: "openai",
      model: "gpt-4o-mini-transcribe",
      endpoint: "https://api.openai.com/v1",
    });
  });

  it("fills blank model/endpoint from defaults while keeping provider", () => {
    expect(
      createServerSttRequestOptions({
        value: {
          automationSettings: {
            speech: {
              stt: {
                provider: "local",
                model: "  ",
                endpoint: "",
              },
            },
          },
        },
      }),
    ).toEqual({
      provider: "local",
      model: DEFAULT_SPEECH_SETTINGS.stt.model,
      endpoint: DEFAULT_SPEECH_SETTINGS.stt.endpoint,
    });
  });
});
