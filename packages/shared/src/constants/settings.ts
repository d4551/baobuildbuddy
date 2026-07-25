/**
 * Supported runtime language codes.
 */
export const APP_LANGUAGE_CODES = ["en-US", "es-ES", "fr-FR", "ja-JP"] as const;

/**
 * Language code union derived from `APP_LANGUAGE_CODES`.
 */
export type AppLanguageCode = (typeof APP_LANGUAGE_CODES)[number];

/**
 * Human-readable locale labels used for deterministic UI rendering.
 */
export const APP_LANGUAGE_LABELS = {
  "en-US": "English",
  "es-ES": "Español",
  "fr-FR": "Français",
  "ja-JP": "日本語",
} as const satisfies Record<AppLanguageCode, string>;

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
 * Supported SMTP transport security modes for outbound email delivery.
 */
export const EMAIL_TRANSPORT_SECURITY_OPTIONS = ["tls", "starttls", "plain"] as const;

/**
 * SMTP transport security mode union derived from `EMAIL_TRANSPORT_SECURITY_OPTIONS`.
 */
export type EmailTransportSecurityOption = (typeof EMAIL_TRANSPORT_SECURITY_OPTIONS)[number];

/**
 * Supported SMTP authentication modes.
 */
export const EMAIL_TRANSPORT_AUTH_MODE_OPTIONS = ["plain", "login"] as const;

/**
 * SMTP authentication mode union derived from `EMAIL_TRANSPORT_AUTH_MODE_OPTIONS`.
 */
export type EmailTransportAuthModeOption = (typeof EMAIL_TRANSPORT_AUTH_MODE_OPTIONS)[number];

/**
 * Default timeout applied to SMTP connections when the user has not configured a value.
 */
export const DEFAULT_EMAIL_TRANSPORT_CONNECTION_TIMEOUT_SECONDS = 15;

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
 * Curated speech model options by provider for chat/interview selectors.
 * Single source of truth — defaults and UI selectors both derive from this.
 */
export const SPEECH_MODEL_OPTIONS = {
  stt: {
    browser: ["browser-default"],
    openai: ["gpt-4o-mini-transcribe", "gpt-4o-transcribe"],
    huggingface: ["openai/whisper-large-v3-turbo"],
    local: ["whisper-tiny", "whisper-small", "whisper-large-v3-turbo", "distil-whisper-large-v3"],
    custom: ["custom-stt-model"],
  },
  tts: {
    browser: ["browser-default"],
    /** Cloud TTS ignored — local Kokoro is the product TTS path. */
    openai: ["kokoro"],
    huggingface: ["kokoro"],
    local: ["kokoro"],
    custom: ["kokoro"],
  },
} as const satisfies {
  stt: Record<SpeechProviderOption, readonly string[]>;
  tts: Record<SpeechProviderOption, readonly string[]>;
};

/** TTS providers that ship in-product (cloud OpenAI/HF TTS ignored). */
export const ON_DEVICE_TTS_PROVIDER_OPTIONS = ["browser", "local"] as const;

/** Local Whisper via OpenAI-compatible endpoint (scripts/whisper-openai-server.py). */
const DEFAULT_STT_PROVIDER: SpeechProviderOption = "local";
/** Local Kokoro ONNX via OpenAI-compatible endpoint — not browser speechSynthesis. */
const DEFAULT_TTS_PROVIDER: SpeechProviderOption = "local";

/** Default Kokoro OpenAI-compatible base (scripts/kokoro-openai-server.py). */
export const DEFAULT_LOCAL_TTS_ENDPOINT = "http://127.0.0.1:8880/v1";
export const DEFAULT_LOCAL_TTS_VOICE = "af_heart";
/** Default Whisper OpenAI-compatible base (scripts/whisper-openai-server.py). */
export const DEFAULT_LOCAL_STT_ENDPOINT = "http://127.0.0.1:8090/v1";

/**
 * Default provider/model values for speech recognition and synthesis.
 * Model values are derived from SPEECH_MODEL_OPTIONS — not hardcoded.
 */
export const DEFAULT_SPEECH_SETTINGS = {
  locale: DEFAULT_SPEECH_LOCALE,
  stt: {
    provider: DEFAULT_STT_PROVIDER,
    model: SPEECH_MODEL_OPTIONS.stt[DEFAULT_STT_PROVIDER][0],
    endpoint: DEFAULT_LOCAL_STT_ENDPOINT,
  },
  tts: {
    provider: DEFAULT_TTS_PROVIDER,
    model: SPEECH_MODEL_OPTIONS.tts[DEFAULT_TTS_PROVIDER][0],
    endpoint: DEFAULT_LOCAL_TTS_ENDPOINT,
    voice: DEFAULT_LOCAL_TTS_VOICE,
    format: "wav",
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
