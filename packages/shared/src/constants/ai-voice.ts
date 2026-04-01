/**
 * Default BCP 47 locale used by browser voice APIs when no UI locale is provided.
 */
export const AI_CHAT_VOICE_DEFAULT_LOCALE = "en-US";

/**
 * Default auto-read preference for assistant replies in chat surfaces.
 */
export const AI_CHAT_VOICE_AUTO_SPEAK_DEFAULT = false;

/**
 * Persisted voice identifier used for AI chat text-to-speech playback.
 * Empty string keeps browser/system default voice selection.
 */
export const AI_CHAT_VOICE_DEFAULT_ID = "";

export const AI_CHAT_VOICE_ERROR_CODES = {
  unsupportedRecognition: "unsupportedRecognition",
  unsupportedSynthesis: "unsupportedSynthesis",
  startFailed: "startFailed",
  noSpeech: "noSpeech",
  aborted: "aborted",
  audioCapture: "audioCapture",
  network: "network",
  notAllowed: "notAllowed",
  serviceNotAllowed: "serviceNotAllowed",
  badGrammar: "badGrammar",
  languageNotSupported: "languageNotSupported",
  canceled: "canceled",
  interrupted: "interrupted",
  audioBusy: "audioBusy",
  audioHardware: "audioHardware",
  synthesisUnavailable: "synthesisUnavailable",
  synthesisFailed: "synthesisFailed",
  languageUnavailable: "languageUnavailable",
  voiceUnavailable: "voiceUnavailable",
  textTooLong: "textTooLong",
  invalidArgument: "invalidArgument",
  unknown: "unknown",
} as const;

export type AIChatVoiceErrorCode =
  (typeof AI_CHAT_VOICE_ERROR_CODES)[keyof typeof AI_CHAT_VOICE_ERROR_CODES];

export const AI_CHAT_VOICE_ERROR_MESSAGE_KEYS: Readonly<Record<AIChatVoiceErrorCode, string>> = {
  unsupportedRecognition: "aiChatCommon.voice.errors.unsupportedRecognition",
  unsupportedSynthesis: "aiChatCommon.voice.errors.unsupportedSynthesis",
  startFailed: "aiChatCommon.voice.errors.startFailed",
  noSpeech: "aiChatCommon.voice.errors.noSpeech",
  aborted: "aiChatCommon.voice.errors.aborted",
  audioCapture: "aiChatCommon.voice.errors.audioCapture",
  network: "aiChatCommon.voice.errors.network",
  notAllowed: "aiChatCommon.voice.errors.notAllowed",
  serviceNotAllowed: "aiChatCommon.voice.errors.serviceNotAllowed",
  badGrammar: "aiChatCommon.voice.errors.badGrammar",
  languageNotSupported: "aiChatCommon.voice.errors.languageNotSupported",
  canceled: "aiChatCommon.voice.errors.canceled",
  interrupted: "aiChatCommon.voice.errors.interrupted",
  audioBusy: "aiChatCommon.voice.errors.audioBusy",
  audioHardware: "aiChatCommon.voice.errors.audioHardware",
  synthesisUnavailable: "aiChatCommon.voice.errors.synthesisUnavailable",
  synthesisFailed: "aiChatCommon.voice.errors.synthesisFailed",
  languageUnavailable: "aiChatCommon.voice.errors.languageUnavailable",
  voiceUnavailable: "aiChatCommon.voice.errors.voiceUnavailable",
  textTooLong: "aiChatCommon.voice.errors.textTooLong",
  invalidArgument: "aiChatCommon.voice.errors.invalidArgument",
  unknown: "aiChatCommon.voice.errors.unknown",
};

export const AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP = {
  "no-speech": AI_CHAT_VOICE_ERROR_CODES.noSpeech,
  aborted: AI_CHAT_VOICE_ERROR_CODES.aborted,
  "audio-capture": AI_CHAT_VOICE_ERROR_CODES.audioCapture,
  network: AI_CHAT_VOICE_ERROR_CODES.network,
  "not-allowed": AI_CHAT_VOICE_ERROR_CODES.notAllowed,
  "service-not-allowed": AI_CHAT_VOICE_ERROR_CODES.serviceNotAllowed,
  "bad-grammar": AI_CHAT_VOICE_ERROR_CODES.badGrammar,
  "language-not-supported": AI_CHAT_VOICE_ERROR_CODES.languageNotSupported,
} as const;

export const AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP = {
  canceled: AI_CHAT_VOICE_ERROR_CODES.canceled,
  interrupted: AI_CHAT_VOICE_ERROR_CODES.interrupted,
  "audio-busy": AI_CHAT_VOICE_ERROR_CODES.audioBusy,
  "audio-hardware": AI_CHAT_VOICE_ERROR_CODES.audioHardware,
  network: AI_CHAT_VOICE_ERROR_CODES.network,
  "synthesis-unavailable": AI_CHAT_VOICE_ERROR_CODES.synthesisUnavailable,
  "synthesis-failed": AI_CHAT_VOICE_ERROR_CODES.synthesisFailed,
  "language-unavailable": AI_CHAT_VOICE_ERROR_CODES.languageUnavailable,
  "voice-unavailable": AI_CHAT_VOICE_ERROR_CODES.voiceUnavailable,
  "text-too-long": AI_CHAT_VOICE_ERROR_CODES.textTooLong,
  "invalid-argument": AI_CHAT_VOICE_ERROR_CODES.invalidArgument,
} as const;
