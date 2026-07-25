import type { SpeechProviderOption } from "@bao/shared/constants/settings";
import { ON_DEVICE_TTS_PROVIDER_OPTIONS } from "@bao/shared/constants/settings";

/**
 * Resolves TTS provider. Product path is local Kokoro; browser Web Speech is fallback.
 * Cloud OpenAI/HF TTS is ignored (normalized to local).
 */
export const resolveSpeechTtsProvider = (
  value: string | null | undefined,
): SpeechProviderOption => {
  if (value === "browser") {
    return "browser";
  }
  if (value === "local" || value === "custom") {
    return "local";
  }
  // Ignore cloud TTS selections — force local Kokoro.
  if (value === "openai" || value === "huggingface") {
    return "local";
  }
  return "local";
};

/** Local Kokoro neural path (server → OpenAI-compatible Kokoro). */
export const shouldUseLocalKokoroTts = (provider: SpeechProviderOption): boolean =>
  resolveSpeechTtsProvider(provider) === "local";

export const isBrowserSpeechTts = (provider: SpeechProviderOption): boolean =>
  resolveSpeechTtsProvider(provider) === "browser";

export const listOnDeviceTtsProviders = (): readonly SpeechProviderOption[] =>
  ON_DEVICE_TTS_PROVIDER_OPTIONS;
