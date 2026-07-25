import type { SpeechProviderOption } from "@bao/shared/constants/settings";

/**
 * Resolves TTS provider. On-device = browser Web Speech (`speechSynthesis`).
 * Cloud providers are settings-only until a server TTS route ships — speak() stays on-device.
 */
export const resolveSpeechTtsProvider = (
  value: string | null | undefined,
): SpeechProviderOption => {
  if (
    value === "local" ||
    value === "openai" ||
    value === "huggingface" ||
    value === "custom" ||
    value === "browser"
  ) {
    return value;
  }
  return "browser";
};

/**
 * Speak() always uses on-device `speechSynthesis` today — no server TTS route.
 * Cloud TTS provider settings are profile metadata until a synth API ships.
 */
export const shouldUseOnDeviceTts = (_provider: SpeechProviderOption): boolean => true;

/** Explicit on-device STT/TTS provider id (Web Speech API). */
export const isOnDeviceSpeechProvider = (provider: SpeechProviderOption): boolean =>
  provider === "browser";