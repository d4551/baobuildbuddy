import {
  ON_DEVICE_TTS_PROVIDER_OPTIONS,
  SPEECH_PROVIDER_OPTIONS,
} from "@bao/shared/constants/settings";
import { DEFAULT_AUTOMATION_SETTINGS } from "@bao/shared/types/settings-defaults";
import type { ComputedRef, Ref } from "vue";
import { computed, reactive, ref, watch } from "vue";
import { settlePromise } from "./async-flow";
import {
  buildNextSpeechConfigFromProfile,
  createDefaultSpeechModelProfileState,
  isSpeechModelProfileDirty,
  mapPersistedSpeechToProfileState,
  resolveDefaultSpeechModel,
  resolveProviderModels,
  type SpeechModelProfileState,
} from "./speech-model-profile-state";
import { useSettings } from "./useSettings";

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

interface SaveSpeechConfigActionOptions {
  settings: ReturnType<typeof useSettings>["settings"];
  updateSettings: ReturnType<typeof useSettings>["updateSettings"];
  isSpeechConfigDirty: ComputedRef<boolean>;
  speechConfigSaving: Ref<boolean>;
  speechConfig: SpeechModelProfileState;
  locale: Ref<string>;
}

const createSpeechConfigState = (): SpeechModelProfileState =>
  reactive<SpeechModelProfileState>(createDefaultSpeechModelProfileState());

const createPersistedSpeechConfig = (
  settings: ReturnType<typeof useSettings>["settings"],
): ComputedRef<SpeechModelProfileState> =>
  computed<SpeechModelProfileState>(() => {
    const persistedSpeech =
      settings.value?.automationSettings?.speech ?? DEFAULT_AUTOMATION_SETTINGS.speech;
    return mapPersistedSpeechToProfileState(persistedSpeech);
  });

const createSpeechConfigDirtyState = (
  speechConfig: SpeechModelProfileState,
  persistedSpeechConfig: ComputedRef<SpeechModelProfileState>,
): ComputedRef<boolean> =>
  computed(() => isSpeechModelProfileDirty(speechConfig, persistedSpeechConfig.value));

const syncSpeechConfigFromSettings = (
  settings: ReturnType<typeof useSettings>["settings"],
  speechConfig: SpeechModelProfileState,
) => {
  watch(
    settings,
    (currentSettings) => {
      const persistedSpeech =
        currentSettings?.automationSettings?.speech ?? DEFAULT_AUTOMATION_SETTINGS.speech;
      const mapped = mapPersistedSpeechToProfileState(persistedSpeech);
      speechConfig.sttProvider = mapped.sttProvider;
      speechConfig.sttModel = mapped.sttModel;
      speechConfig.sttEndpoint = mapped.sttEndpoint;
      speechConfig.ttsProvider = mapped.ttsProvider;
      speechConfig.ttsModel = mapped.ttsModel;
      speechConfig.ttsEndpoint = mapped.ttsEndpoint;
    },
    { immediate: true },
  );
};

const registerSttProviderWatcher = (speechConfig: SpeechModelProfileState) => {
  watch(
    () => speechConfig.sttProvider,
    (provider) => {
      const optionsForProvider = resolveProviderModels("stt", provider);
      if (optionsForProvider.includes(speechConfig.sttModel)) {
        return;
      }
      speechConfig.sttModel = resolveDefaultSpeechModel("stt", provider);
    },
  );
};

const registerTtsProviderWatcher = (speechConfig: SpeechModelProfileState) => {
  watch(
    () => speechConfig.ttsProvider,
    (provider) => {
      const optionsForProvider = resolveProviderModels("tts", provider);
      if (optionsForProvider.includes(speechConfig.ttsModel)) {
        return;
      }
      speechConfig.ttsModel = resolveDefaultSpeechModel("tts", provider);
    },
  );
};

const buildNextSpeechConfig = (
  settings: ReturnType<typeof useSettings>["settings"],
  speechConfig: SpeechModelProfileState,
  locale: string,
) => {
  const existingAutomationSettings =
    settings.value?.automationSettings ?? DEFAULT_AUTOMATION_SETTINGS;
  return buildNextSpeechConfigFromProfile(
    existingAutomationSettings.speech,
    speechConfig,
    locale,
  );
};

const createEnsureSpeechConfigLoadedAction =
  (
    settings: ReturnType<typeof useSettings>["settings"],
    fetchSettings: ReturnType<typeof useSettings>["fetchSettings"],
  ) =>
  async (): Promise<void> => {
    if (settings.value) {
      return;
    }
    await fetchSettings();
  };

const createSaveSpeechConfigAction =
  (options: SaveSpeechConfigActionOptions) =>
  async (fallbackMessage: string): Promise<SpeechModelProfileSaveResult> => {
    if (!options.isSpeechConfigDirty.value || options.speechConfigSaving.value) {
      return { ok: true, saved: false };
    }

    const nextSpeechConfig = buildNextSpeechConfig(
      options.settings,
      options.speechConfig,
      options.locale.value,
    );
    options.speechConfigSaving.value = true;
    const saveSpeechResult = await settlePromise(
      options.updateSettings({
        automationSettings: {
          speech: nextSpeechConfig,
        },
      }),
      fallbackMessage,
    );
    options.speechConfigSaving.value = false;

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
  const speechConfig = createSpeechConfigState();
  const sttModelOptions = computed(() => resolveProviderModels("stt", speechConfig.sttProvider));
  const ttsModelOptions = computed(() => resolveProviderModels("tts", speechConfig.ttsProvider));
  const persistedSpeechConfig = createPersistedSpeechConfig(settings);
  const isSpeechConfigDirty = createSpeechConfigDirtyState(speechConfig, persistedSpeechConfig);

  syncSpeechConfigFromSettings(settings, speechConfig);
  registerSttProviderWatcher(speechConfig);
  registerTtsProviderWatcher(speechConfig);

  return {
    speechProviderOptions: SPEECH_PROVIDER_OPTIONS,
    /** Cloud TTS ignored — UI only offers browser + local Kokoro. */
    ttsProviderOptions: ON_DEVICE_TTS_PROVIDER_OPTIONS,
    speechConfig,
    sttModelOptions,
    ttsModelOptions,
    speechConfigSaving,
    isSpeechConfigDirty,
    ensureSpeechConfigLoaded: createEnsureSpeechConfigLoadedAction(settings, fetchSettings),
    saveSpeechConfig: createSaveSpeechConfigAction({
      settings,
      updateSettings,
      isSpeechConfigDirty,
      speechConfigSaving,
      speechConfig,
      locale: options.locale,
    }),
  };
}
