import {
  DEFAULT_SPEECH_SETTINGS,
  SPEECH_MODEL_OPTIONS,
  type SpeechProviderOption,
} from "@bao/shared/constants/settings";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";

type SpeechModelProfileKind = "stt" | "tts";

/**
 * Reactive editable speech profile model used by chat surfaces.
 */
export interface SpeechModelProfileState {
  sttProvider: SpeechProviderOption;
  sttModel: string;
  sttEndpoint: string;
  ttsProvider: SpeechProviderOption;
  ttsModel: string;
  ttsEndpoint: string;
}

type PersistedSpeechSettings = typeof DEFAULT_AUTOMATION_SETTINGS.speech;

const resolveProviderModels = (
  kind: SpeechModelProfileKind,
  provider: SpeechProviderOption,
): readonly string[] => SPEECH_MODEL_OPTIONS[kind][provider];

/** First configured model for a provider, else global STT/TTS default. */
export const resolveDefaultSpeechModel = (
  kind: SpeechModelProfileKind,
  provider: SpeechProviderOption,
): string => {
  const configuredModels = resolveProviderModels(kind, provider);
  if (configuredModels.length === 0) {
    return kind === "stt" ? DEFAULT_SPEECH_SETTINGS.stt.model : DEFAULT_SPEECH_SETTINGS.tts.model;
  }
  return configuredModels[0] ?? "";
};

/** Default editable speech profile from DEFAULT_SPEECH_SETTINGS. */
export const createDefaultSpeechModelProfileState = (): SpeechModelProfileState => {
  const sttProvider = DEFAULT_SPEECH_SETTINGS.stt.provider;
  const ttsProvider = DEFAULT_SPEECH_SETTINGS.tts.provider;
  return {
    sttProvider,
    sttModel: resolveDefaultSpeechModel("stt", sttProvider),
    sttEndpoint: DEFAULT_SPEECH_SETTINGS.stt.endpoint,
    ttsProvider,
    ttsModel: resolveDefaultSpeechModel("tts", ttsProvider),
    ttsEndpoint: DEFAULT_SPEECH_SETTINGS.tts.endpoint,
  };
};

/** Map persisted automation speech settings into editable profile state. */
export const mapPersistedSpeechToProfileState = (
  persistedSpeech: PersistedSpeechSettings,
): SpeechModelProfileState => ({
  sttProvider: persistedSpeech.stt.provider,
  sttModel: persistedSpeech.stt.model,
  sttEndpoint: persistedSpeech.stt.endpoint,
  ttsProvider: persistedSpeech.tts.provider,
  ttsModel: persistedSpeech.tts.model,
  ttsEndpoint: persistedSpeech.tts.endpoint,
});

/** True when editable profile differs from persisted (trimmed model/endpoint). */
export const isSpeechModelProfileDirty = (
  speechConfig: SpeechModelProfileState,
  persisted: SpeechModelProfileState,
): boolean =>
  speechConfig.sttProvider !== persisted.sttProvider ||
  speechConfig.sttModel.trim() !== persisted.sttModel ||
  speechConfig.sttEndpoint.trim() !== persisted.sttEndpoint ||
  speechConfig.ttsProvider !== persisted.ttsProvider ||
  speechConfig.ttsModel.trim() !== persisted.ttsModel ||
  speechConfig.ttsEndpoint.trim() !== persisted.ttsEndpoint;

const resolvePersistedModelOrDefault = (
  kind: SpeechModelProfileKind,
  provider: SpeechProviderOption,
  model: string,
): string => {
  const trimmed = model.trim();
  return trimmed.length > 0 ? trimmed : resolveDefaultSpeechModel(kind, provider);
};

const resolvePersistedEndpointOrDefault = (
  kind: SpeechModelProfileKind,
  endpoint: string,
): string => {
  const trimmed = endpoint.trim();
  if (trimmed.length > 0) {
    return trimmed;
  }
  return kind === "stt" ? DEFAULT_SPEECH_SETTINGS.stt.endpoint : DEFAULT_SPEECH_SETTINGS.tts.endpoint;
};

/**
 * Build next automation speech config from profile edits, preserving locale/voice/format.
 */
export const buildNextSpeechConfigFromProfile = (
  existingSpeech: PersistedSpeechSettings,
  speechConfig: SpeechModelProfileState,
  localeFallback: string,
): PersistedSpeechSettings => {
  const sttModel = resolvePersistedModelOrDefault("stt", speechConfig.sttProvider, speechConfig.sttModel);
  const ttsModel = resolvePersistedModelOrDefault("tts", speechConfig.ttsProvider, speechConfig.ttsModel);
  const sttEndpoint = resolvePersistedEndpointOrDefault("stt", speechConfig.sttEndpoint);
  const ttsEndpoint = resolvePersistedEndpointOrDefault("tts", speechConfig.ttsEndpoint);
  return {
    ...existingSpeech,
    locale: existingSpeech.locale || localeFallback,
    stt: {
      ...existingSpeech.stt,
      provider: speechConfig.sttProvider,
      model: sttModel,
      endpoint: sttEndpoint,
    },
    tts: {
      ...existingSpeech.tts,
      provider: speechConfig.ttsProvider,
      model: ttsModel,
      endpoint: ttsEndpoint,
    },
  };
};

export { resolveProviderModels };
