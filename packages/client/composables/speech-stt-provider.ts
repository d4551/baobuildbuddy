import {
  DEFAULT_SPEECH_SETTINGS,
  type SpeechProviderOption,
} from "@bao/shared/constants/settings";

const STT_PROVIDERS = new Set<SpeechProviderOption>([
  "local",
  "openai",
  "huggingface",
  "custom",
  "browser",
]);

/**
 * Resolves STT provider. Empty/unknown → product default (local Whisper),
 * never silent browser fallback (that skipped Whisper).
 */
export const resolveSpeechSttProvider = (
  value: string | null | undefined,
): SpeechProviderOption => {
  if (typeof value === "string" && STT_PROVIDERS.has(value as SpeechProviderOption)) {
    return value as SpeechProviderOption;
  }
  return DEFAULT_SPEECH_SETTINGS.stt.provider;
};

export const shouldUseServerStt = (provider: SpeechProviderOption): boolean =>
  provider !== "browser";
