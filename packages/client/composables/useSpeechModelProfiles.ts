import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_SPEECH_SETTINGS,
  SPEECH_MODEL_OPTIONS,
  SPEECH_PROVIDER_OPTIONS,
  type SpeechProviderOption,
} from "@bao/shared";
import type { Ref } from "vue";
import { computed, reactive, ref, watch } from "vue";
import { settlePromise } from "./async-flow";
import { useSettings } from "./useSettings";

type SpeechModelProfileKind = "stt" | "tts";

/**
 * Reactive editable speech profile model used by chat surfaces.
 */
export interface SpeechModelProfileState {
  sttProvider: SpeechProviderOption;
  sttModel: string;
  ttsProvider: SpeechProviderOption;
  ttsModel: string;
}

/**
 * Result envelope for saving speech model profile preferences.
 */
export type SpeechModelProfileSaveResult =
  | { readonly ok: true; readonly saved: boolean }
  | { readonly ok: false; readonly saved: false; readonly error: Error };

/**
 * Options for speech model profile state management.
 */
export interface UseSpeechModelProfilesOptions {
  readonly locale: Ref<string>;
}

const resolveProviderModels = (
  kind: SpeechModelProfileKind,
  provider: SpeechProviderOption,
): readonly string[] => SPEECH_MODEL_OPTIONS[kind][provider];

const resolveDefaultModel = (kind: SpeechModelProfileKind, provider: SpeechProviderOption): string => {
  const configuredModels = resolveProviderModels(kind, provider);
  if (configuredModels.length === 0) {
    return kind === "stt" ? DEFAULT_SPEECH_SETTINGS.stt.model : DEFAULT_SPEECH_SETTINGS.tts.model;
  }
  return configuredModels[0] ?? "";
};

/**
 * Provides a single source of truth for persisted speech provider/model profile state.
 *
 * @param options Locale ref used as fallback speech locale when persisting settings.
 * @returns Reactive speech config, model options, dirty/saving flags, and save/load actions.
 */
export function useSpeechModelProfiles(options: UseSpeechModelProfilesOptions) {
  const { settings, fetchSettings, updateSettings } = useSettings();
  const speechConfigSaving = ref(false);
  const speechConfig = reactive<SpeechModelProfileState>({
    sttProvider: DEFAULT_SPEECH_SETTINGS.stt.provider,
    sttModel: DEFAULT_SPEECH_SETTINGS.stt.model,
    ttsProvider: DEFAULT_SPEECH_SETTINGS.tts.provider,
    ttsModel: DEFAULT_SPEECH_SETTINGS.tts.model,
  });

  const sttModelOptions = computed(() =>
    resolveProviderModels("stt", speechConfig.sttProvider),
  );
  const ttsModelOptions = computed(() =>
    resolveProviderModels("tts", speechConfig.ttsProvider),
  );
  const persistedSpeechConfig = computed<SpeechModelProfileState>(() => {
    const persistedSpeech =
      settings.value?.automationSettings?.speech ?? DEFAULT_AUTOMATION_SETTINGS.speech;
    return {
      sttProvider: persistedSpeech.stt.provider,
      sttModel: persistedSpeech.stt.model,
      ttsProvider: persistedSpeech.tts.provider,
      ttsModel: persistedSpeech.tts.model,
    };
  });
  const isSpeechConfigDirty = computed(
    () =>
      speechConfig.sttProvider !== persistedSpeechConfig.value.sttProvider ||
      speechConfig.sttModel.trim() !== persistedSpeechConfig.value.sttModel ||
      speechConfig.ttsProvider !== persistedSpeechConfig.value.ttsProvider ||
      speechConfig.ttsModel.trim() !== persistedSpeechConfig.value.ttsModel,
  );

  watch(
    settings,
    (currentSettings) => {
      const persistedSpeech =
        currentSettings?.automationSettings?.speech ?? DEFAULT_AUTOMATION_SETTINGS.speech;
      speechConfig.sttProvider = persistedSpeech.stt.provider;
      speechConfig.sttModel = persistedSpeech.stt.model;
      speechConfig.ttsProvider = persistedSpeech.tts.provider;
      speechConfig.ttsModel = persistedSpeech.tts.model;
    },
    { immediate: true },
  );

  watch(
    () => speechConfig.sttProvider,
    (provider) => {
      const optionsForProvider = resolveProviderModels("stt", provider);
      if (optionsForProvider.includes(speechConfig.sttModel)) {
        return;
      }
      speechConfig.sttModel = resolveDefaultModel("stt", provider);
    },
  );

  watch(
    () => speechConfig.ttsProvider,
    (provider) => {
      const optionsForProvider = resolveProviderModels("tts", provider);
      if (optionsForProvider.includes(speechConfig.ttsModel)) {
        return;
      }
      speechConfig.ttsModel = resolveDefaultModel("tts", provider);
    },
  );

  async function ensureSpeechConfigLoaded(): Promise<void> {
    if (settings.value) {
      return;
    }
    await fetchSettings();
  }

  async function saveSpeechConfig(
    fallbackMessage: string,
  ): Promise<SpeechModelProfileSaveResult> {
    if (!isSpeechConfigDirty.value || speechConfigSaving.value) {
      return { ok: true, saved: false };
    }

    const existingAutomationSettings =
      settings.value?.automationSettings ?? DEFAULT_AUTOMATION_SETTINGS;
    const sttModel = speechConfig.sttModel.trim();
    const ttsModel = speechConfig.ttsModel.trim();
    const nextSpeechConfig = {
      ...existingAutomationSettings.speech,
      locale: existingAutomationSettings.speech.locale || options.locale.value,
      stt: {
        ...existingAutomationSettings.speech.stt,
        provider: speechConfig.sttProvider,
        model:
          sttModel.length > 0 ? sttModel : resolveDefaultModel("stt", speechConfig.sttProvider),
      },
      tts: {
        ...existingAutomationSettings.speech.tts,
        provider: speechConfig.ttsProvider,
        model:
          ttsModel.length > 0 ? ttsModel : resolveDefaultModel("tts", speechConfig.ttsProvider),
      },
    };

    speechConfigSaving.value = true;
    const saveSpeechResult = await settlePromise(
      updateSettings({
        automationSettings: {
          speech: nextSpeechConfig,
        },
      }),
      fallbackMessage,
    );
    speechConfigSaving.value = false;

    if (!saveSpeechResult.ok) {
      return {
        ok: false,
        saved: false,
        error: saveSpeechResult.error,
      };
    }

    return {
      ok: true,
      saved: true,
    };
  }

  return {
    speechProviderOptions: SPEECH_PROVIDER_OPTIONS,
    speechConfig,
    sttModelOptions,
    ttsModelOptions,
    speechConfigSaving,
    isSpeechConfigDirty,
    ensureSpeechConfigLoaded,
    saveSpeechConfig,
  };
}
