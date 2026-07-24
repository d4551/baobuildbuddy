import {
  AI_CHAT_VOICE_ERROR_CODES,
  AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP,
  AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP,
  type AIChatVoiceErrorCode,
} from "@bao/shared/constants/ai-voice";
import { settle } from "@bao/shared/utils/promise";
import type { Ref } from "vue";
import {
  resolveSpeechLocale,
  resolveSpeechRecognitionConstructor,
  resolveSpeechSynthesis,
} from "../utils/speech";
import { createMicrophoneRecorder, transcribeAudioViaServer } from "./speech-server-stt";
import { resolveSpeechSttProvider, shouldUseServerStt } from "./speech-stt-provider";
import { useSettings } from "./useSettings";

type MicrophoneRecorder = Awaited<ReturnType<typeof createMicrophoneRecorder>>;

type RecognitionErrorName = keyof typeof AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP;
type SynthesisErrorName = keyof typeof AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP;

interface SpeechState {
  isListening: Ref<boolean>;
  isSpeaking: Ref<boolean>;
  transcript: Ref<string>;
  interimTranscript: Ref<string>;
  error: Ref<AIChatVoiceErrorCode | null>;
  voices: Ref<SpeechSynthesisVoice[]>;
  recognition: Ref<SpeechRecognition | null>;
  synthesis: Ref<SpeechSynthesis | null>;
}

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  lang?: string;
}

/**
 * Checks whether a raw recognition error name is mapped to a canonical code.
 *
 * @param value Raw browser recognition error.
 * @returns True when the error name is known.
 */
function isRecognitionErrorName(value: string): value is RecognitionErrorName {
  return Object.hasOwn(AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP, value);
}

/**
 * Checks whether a raw synthesis error name is mapped to a canonical code.
 *
 * @param value Raw browser synthesis error.
 * @returns True when the error name is known.
 */
function isSynthesisErrorName(value: string): value is SynthesisErrorName {
  return Object.hasOwn(AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP, value);
}

/**
 * Resolves a browser recognition error into canonical UI-facing code.
 *
 * @param value Raw browser recognition error.
 * @returns Canonical voice error code.
 */
function resolveRecognitionErrorCode(value: string): AIChatVoiceErrorCode {
  if (isRecognitionErrorName(value)) {
    return AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP[value];
  }
  return AI_CHAT_VOICE_ERROR_CODES.unknown;
}

/**
 * Resolves a browser synthesis error into canonical UI-facing code.
 *
 * @param value Raw browser synthesis error.
 * @returns Canonical voice error code.
 */
function resolveSynthesisErrorCode(value: string): AIChatVoiceErrorCode {
  if (isSynthesisErrorName(value)) {
    return AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP[value];
  }
  return AI_CHAT_VOICE_ERROR_CODES.unknown;
}

const createSpeechState = (): SpeechState => ({
  isListening: ref(false),
  isSpeaking: ref(false),
  transcript: ref(""),
  interimTranscript: ref(""),
  error: ref<AIChatVoiceErrorCode | null>(null),
  voices: ref<SpeechSynthesisVoice[]>([]),
  recognition: ref<SpeechRecognition | null>(null),
  synthesis: ref<SpeechSynthesis | null>(null),
});

const resolveSynthesis = (state: SpeechState): SpeechSynthesis | null => {
  const resolved = state.synthesis.value ?? resolveSpeechSynthesis();
  if (resolved) {
    state.synthesis.value = resolved;
  }
  return resolved;
};

const createLoadVoicesAction = (state: SpeechState) => (): SpeechSynthesisVoice[] => {
  const synthesis = resolveSynthesis(state);
  if (!synthesis) {
    state.voices.value = [];
    return [];
  }

  const availableVoices = synthesis.getVoices();
  state.voices.value = availableVoices;
  return availableVoices;
};

const createRecognitionResultHandler =
  (state: SpeechState) =>
  (event: SpeechRecognitionEvent): void => {
    let finalTranscript = "";
    let currentInterimTranscript = "";
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const firstAlternative = result?.[0];
      if (!firstAlternative) {
        continue;
      }
      if (result.isFinal) {
        finalTranscript += firstAlternative.transcript;
      } else {
        currentInterimTranscript += firstAlternative.transcript;
      }
    }

    if (finalTranscript.length > 0) {
      state.transcript.value += finalTranscript;
    }
    state.interimTranscript.value = currentInterimTranscript;
  };

const setupSpeechApis = (state: SpeechState, loadVoices: () => SpeechSynthesisVoice[]) => {
  onMounted(() => {
    state.synthesis.value = resolveSpeechSynthesis();
    if (state.synthesis.value) {
      state.synthesis.value.onvoiceschanged = () => {
        loadVoices();
      };
      loadVoices();
    }

    const speechRecognitionCtor = resolveSpeechRecognitionConstructor();
    if (!speechRecognitionCtor) {
      return;
    }

    const recognition = new speechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = resolveSpeechLocale();
    recognition.onresult = createRecognitionResultHandler(state);
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      state.error.value = resolveRecognitionErrorCode(event.error);
    };
    recognition.onend = () => {
      state.isListening.value = false;
    };
    state.recognition.value = recognition;
  });
};

const createSpeakAction =
  (state: SpeechState) =>
  (text: string, options?: SpeakOptions): void => {
    const synthesis = resolveSynthesis(state);
    if (!synthesis) {
      state.error.value = AI_CHAT_VOICE_ERROR_CODES.unsupportedSynthesis;
      return;
    }

    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate ?? 1;
    utterance.pitch = options?.pitch ?? 1;
    utterance.volume = options?.volume ?? 1;
    utterance.lang = resolveSpeechLocale(options?.lang);
    if (options?.voice) {
      utterance.voice = options.voice;
    }

    utterance.onstart = () => {
      state.isSpeaking.value = true;
      state.error.value = null;
    };
    utterance.onend = () => {
      state.isSpeaking.value = false;
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      state.error.value = resolveSynthesisErrorCode(event.error);
      state.isSpeaking.value = false;
    };
    synthesis.speak(utterance);
  };

const createStopSpeakingAction = (state: SpeechState) => (): void => {
  const synthesis = resolveSynthesis(state);
  if (synthesis) {
    synthesis.cancel();
  }
  state.isSpeaking.value = false;
};

const createStartListeningAction =
  (state: SpeechState, getProvider: () => ReturnType<typeof resolveSpeechSttProvider>) => {
    let recorder: MicrophoneRecorder | null = null;
    const startListening = (locale?: string): boolean => {
      state.error.value = null;
      state.transcript.value = "";
      state.interimTranscript.value = "";
      if (shouldUseServerStt(getProvider())) {
        if (state.isListening.value) {
          return true;
        }
        settle(createMicrophoneRecorder()).then(
          (settled) => {
            if (settled.status === "rejected") {
              state.error.value = AI_CHAT_VOICE_ERROR_CODES.audioCapture;
              state.isListening.value = false;
              return;
            }
            recorder = settled.value;
            settled.value.start();
            state.isListening.value = true;
          },
          () => {
            state.error.value = AI_CHAT_VOICE_ERROR_CODES.audioCapture;
            state.isListening.value = false;
          },
        );
        return true;
      }
      if (!state.recognition.value) {
        state.error.value = AI_CHAT_VOICE_ERROR_CODES.unsupportedRecognition;
        return false;
      }
      if (state.isListening.value) {
        return true;
      }
      state.recognition.value.lang = resolveSpeechLocale(locale);
      state.recognition.value.start();
      state.isListening.value = true;
      return true;
    };

    const stopListening = (): void => {
      if (shouldUseServerStt(getProvider())) {
        const active = recorder;
        recorder = null;
        if (!active) {
          state.isListening.value = false;
          return;
        }
        settle(active.stop())
          .then(
            async (stopSettled) => {
              if (stopSettled.status === "rejected") {
                state.error.value = AI_CHAT_VOICE_ERROR_CODES.network;
                return;
              }
              const transcriptSettled = await settle(transcribeAudioViaServer(stopSettled.value));
              if (transcriptSettled.status === "rejected") {
                state.error.value = AI_CHAT_VOICE_ERROR_CODES.network;
                return;
              }
              const result = transcriptSettled.value;
              if (result.ok) {
                state.transcript.value = result.text;
                state.interimTranscript.value = "";
              } else {
                state.error.value = AI_CHAT_VOICE_ERROR_CODES.network;
              }
            },
            () => {
              state.error.value = AI_CHAT_VOICE_ERROR_CODES.network;
            },
          )
          .then(
            () => {
              state.isListening.value = false;
            },
            () => {
              state.isListening.value = false;
            },
          );
        return;
      }
      if (state.recognition.value) {
        state.recognition.value.stop();
      }
      state.isListening.value = false;
    };

    return { startListening, stopListening };
  };

const createSpeechSupportState = (
  state: SpeechState,
  getProvider: () => ReturnType<typeof resolveSpeechSttProvider>,
) => {
  const fullTranscript = computed(() => {
    const interim = state.interimTranscript.value;
    const combinedTranscript = state.transcript.value + (interim ? ` ${interim}` : "");
    return combinedTranscript.trim();
  });
  const supportsRecognition = computed(
    () => shouldUseServerStt(getProvider()) || resolveSpeechRecognitionConstructor() !== null,
  );
  const supportsSynthesis = computed(
    () => (state.synthesis.value ?? resolveSpeechSynthesis()) !== null,
  );
  const isSupported = computed(() => supportsRecognition.value || supportsSynthesis.value);
  return {
    fullTranscript,
    supportsRecognition,
    supportsSynthesis,
    isSupported,
  };
};

/**
 * Web Speech API composable for local TTS and STT (no external services).
 * Uses browser-native SpeechSynthesis and SpeechRecognition.
 */
export function useSpeech() {
  const { settings: appSettings } = useSettings();
  const getProvider = () =>
    resolveSpeechSttProvider(appSettings.value?.automationSettings?.speech?.stt?.provider);
  const state = createSpeechState();
  const loadVoices = createLoadVoicesAction(state);
  setupSpeechApis(state, loadVoices);

  const speechSupport = createSpeechSupportState(state, getProvider);
  const listeningActions = createStartListeningAction(state, getProvider);
  const actions = {
    speak: createSpeakAction(state),
    stopSpeaking: createStopSpeakingAction(state),
    startListening: listeningActions.startListening,
    stopListening: listeningActions.stopListening,
    loadVoices,
  };

  return {
    isListening: readonly(state.isListening),
    isSpeaking: readonly(state.isSpeaking),
    transcript: readonly(state.transcript),
    interimTranscript: readonly(state.interimTranscript),
    error: readonly(state.error),
    voices: readonly(state.voices),
    ...speechSupport,
    ...actions,
  };
}
