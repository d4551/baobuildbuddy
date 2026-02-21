/**
 * Supported runtime language codes.
 */
export const APP_LANGUAGE_CODES = ["en-US", "es-ES", "fr-FR", "ja-JP"] as const;

/**
 * Language code union derived from `APP_LANGUAGE_CODES`.
 */
export type AppLanguageCode = (typeof APP_LANGUAGE_CODES)[number];

/**
 * Default language code used for app settings and preference fallbacks.
 */
export const DEFAULT_APP_LANGUAGE: AppLanguageCode = "en-US";

/**
 * Select-option model for language preference inputs.
 */
export const APP_LANGUAGE_OPTIONS: ReadonlyArray<{ readonly value: AppLanguageCode }> =
  APP_LANGUAGE_CODES.map((value) => ({ value }));

/**
 * Supported browser ids for automation defaults.
 */
export const AUTOMATION_BROWSER_OPTIONS = ["chrome", "chromium", "edge"] as const;

/**
 * Browser option union derived from `AUTOMATION_BROWSER_OPTIONS`.
 */
export type AutomationBrowserOption = (typeof AUTOMATION_BROWSER_OPTIONS)[number];

/**
 * Supported speech provider ids for STT/TTS runtime routing.
 */
export const SPEECH_PROVIDER_OPTIONS = [
  "browser",
  "openai",
  "huggingface",
  "local",
  "custom",
] as const;

/**
 * Speech provider id union derived from `SPEECH_PROVIDER_OPTIONS`.
 */
export type SpeechProviderOption = (typeof SPEECH_PROVIDER_OPTIONS)[number];

/**
 * Default speech locale used when user preferences are missing.
 */
export const DEFAULT_SPEECH_LOCALE = "en-US";

/**
 * Default provider/model values for speech recognition and synthesis.
 */
export const DEFAULT_SPEECH_SETTINGS = {
  locale: DEFAULT_SPEECH_LOCALE,
  stt: {
    provider: "browser",
    model: "gpt-4o-mini-transcribe",
    endpoint: "",
  },
  tts: {
    provider: "browser",
    model: "gpt-4o-mini-tts",
    endpoint: "",
    voice: "alloy",
    format: "mp3",
  },
} as const satisfies {
  locale: string;
  stt: {
    provider: SpeechProviderOption;
    model: string;
    endpoint: string;
  };
  tts: {
    provider: SpeechProviderOption;
    model: string;
    endpoint: string;
    voice: string;
    format: "mp3" | "wav";
  };
};

/**
 * Curated speech model options by provider for chat/interview selectors.
 */
export const SPEECH_MODEL_OPTIONS = {
  stt: {
    browser: ["browser-default"],
    openai: ["gpt-4o-mini-transcribe", "gpt-4o-transcribe"],
    huggingface: ["openai/whisper-large-v3-turbo"],
    local: ["whisper-large-v3-turbo", "whisper-small", "distil-whisper-large-v3"],
    custom: ["custom-stt-model"],
  },
  tts: {
    browser: ["browser-default"],
    openai: ["gpt-4o-mini-tts", "gpt-4o-audio-preview"],
    huggingface: ["suno/bark", "hexgrad/Kokoro-82M"],
    local: ["kokoro", "piper", "xtts-v2"],
    custom: ["custom-tts-model"],
  },
} as const satisfies {
  stt: Record<SpeechProviderOption, readonly string[]>;
  tts: Record<SpeechProviderOption, readonly string[]>;
};
