import { AI_CHAT_VOICE_ERROR_CODES, AI_CHAT_VOICE_ERROR_MESSAGE_KEYS } from "@bao/shared/constants/ai-voice";
import type { VoiceSettings } from "@bao/shared/types/interview";
import type { Ref } from "vue";
import { computed, onMounted, onUnmounted, readonly, ref } from "#imports";
import { resolveSpeechLocale, resolveSpeechRecognitionConstructor } from "~/utils/speech";
import {
  createMicrophoneRecorder,
  type ServerSttRequestOptions,
  transcribeAudioViaServer,
} from "./speech-server-stt";
import { createServerSttRequestOptions } from "./speech-stt-request-options";
import { resolveSpeechSttProvider, shouldUseServerStt } from "./speech-stt-provider";
import { useSettings } from "./useSettings";

interface RecognitionUpdate {
  finalTranscript: string;
  interimTranscript: string;
  confidence: number;
}

type MicrophoneRecorder = Awaited<ReturnType<typeof createMicrophoneRecorder>>;

interface SttMutableState {
  transcript: Ref<string>;
  interimTranscript: Ref<string>;
  isListening: Ref<boolean>;
  confidence: Ref<number>;
  error: Ref<string | null>;
  recognition: SpeechRecognition | null;
  recorder: MicrophoneRecorder | null;
  useServerStt: boolean;
  /** Tracked mic lifecycle promise — observed so the chain is never floating. */
  micPromise: Promise<void> | null;
}

function isSpeechRecognitionEvent(event: Event): event is SpeechRecognitionEvent {
  return "resultIndex" in event && "results" in event;
}

function isSpeechRecognitionErrorEvent(event: Event): event is SpeechRecognitionErrorEvent {
  return "error" in event;
}

function processRecognitionResults(event: SpeechRecognitionEvent): RecognitionUpdate {
  let finalTranscript = "";
  let currentInterimTranscript = "";
  let currentConfidence = 0;

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const firstAlternative = result?.[0];
    if (!firstAlternative) {
      continue;
    }
    if (result.isFinal) {
      finalTranscript += firstAlternative.transcript;
      currentConfidence = Math.max(currentConfidence, firstAlternative.confidence ?? 0);
      continue;
    }
    currentInterimTranscript += firstAlternative.transcript;
  }

  return {
    finalTranscript,
    interimTranscript: currentInterimTranscript,
    confidence: currentConfidence,
  };
}

function createRecognitionInstance(
  settings?: Ref<VoiceSettings | undefined>,
): SpeechRecognition | null {
  const speechRecognitionCtor = resolveSpeechRecognitionConstructor();
  if (!speechRecognitionCtor) {
    return null;
  }

  const recognition = new speechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = resolveSpeechLocale(settings?.value?.language);
  return recognition;
}

function toFullTranscript(transcript: string, interimTranscript: string): string {
  const combined = transcript + (interimTranscript ? ` ${interimTranscript}` : "");
  return combined.trim();
}

function bindBrowserRecognitionHandlers(state: SttMutableState): void {
  const recognition = state.recognition;
  if (!recognition) {
    return;
  }
  recognition.addEventListener("result", (event: Event) => {
    if (!isSpeechRecognitionEvent(event)) {
      return;
    }
    const update = processRecognitionResults(event);
    if (update.finalTranscript.length > 0) {
      state.transcript.value += update.finalTranscript;
    }
    state.interimTranscript.value = update.interimTranscript;
    if (update.confidence > 0) {
      state.confidence.value = update.confidence;
    }
  });
  recognition.addEventListener("error", (event: Event) => {
    if (!isSpeechRecognitionErrorEvent(event)) {
      return;
    }
    state.error.value = `${event.error}: ${event.message ?? ""}`;
  });
  recognition.addEventListener("end", () => {
    state.isListening.value = false;
  });
}

function startServerSttListening(state: SttMutableState): boolean {
  if (state.isListening.value) {
    return true;
  }
  const micPromise = createMicrophoneRecorder()
    .then(
      (created) => {
        state.recorder = created;
        created.start();
        state.isListening.value = true;
      },
      () => {
        state.error.value = AI_CHAT_VOICE_ERROR_MESSAGE_KEYS[AI_CHAT_VOICE_ERROR_CODES.audioCapture];
        state.isListening.value = false;
      },
    )
    .then(
      () => undefined,
      (error: Error) => {
        state.error.value = error instanceof Error ? error.message : AI_CHAT_VOICE_ERROR_MESSAGE_KEYS[AI_CHAT_VOICE_ERROR_CODES.startFailed];
      },
    );
  state.micPromise = micPromise;
  return true;
}

function startBrowserSttListening(
  state: SttMutableState,
  locale: string | undefined,
  settings?: Ref<VoiceSettings | undefined>,
): boolean {
  if (!state.recognition) {
    state.error.value = AI_CHAT_VOICE_ERROR_MESSAGE_KEYS[AI_CHAT_VOICE_ERROR_CODES.unsupportedRecognition];
    return false;
  }
  if (state.isListening.value) {
    return true;
  }
  state.recognition.lang = resolveSpeechLocale(locale ?? settings?.value?.language);
  state.recognition.start();
  state.isListening.value = true;
  return true;
}

function startSttListening(
  state: SttMutableState,
  locale: string | undefined,
  settings: Ref<VoiceSettings | undefined> | undefined,
  provider: ReturnType<typeof resolveSpeechSttProvider>,
): boolean {
  state.error.value = null;
  state.transcript.value = "";
  state.interimTranscript.value = "";
  state.confidence.value = 0;
  state.useServerStt = shouldUseServerStt(provider);
  if (state.useServerStt) {
    return startServerSttListening(state);
  }
  return startBrowserSttListening(state, locale, settings);
}

function stopServerSttListening(
  state: SttMutableState,
  options: ServerSttRequestOptions,
): void {
  const activeRecorder = state.recorder;
  state.recorder = null;
  if (!activeRecorder) {
    state.isListening.value = false;
    return;
  }
  const micPromise = activeRecorder
    .stop()
    .then((blob) => transcribeAudioViaServer(blob, options))
    .then(
      (result) => {
        if (result.ok) {
          state.transcript.value = result.text;
          state.interimTranscript.value = "";
          state.confidence.value = 1;
        } else {
          state.error.value = result.error;
        }
      },
      () => {
        state.error.value = AI_CHAT_VOICE_ERROR_MESSAGE_KEYS[AI_CHAT_VOICE_ERROR_CODES.network];
      },
    )
    .then(() => {
      state.isListening.value = false;
    })
    .then(
      () => undefined,
      (error: Error) => {
        state.error.value = error instanceof Error ? error.message : AI_CHAT_VOICE_ERROR_MESSAGE_KEYS[AI_CHAT_VOICE_ERROR_CODES.network];
      },
    );
  state.micPromise = micPromise;
}

function stopSttListening(state: SttMutableState, options: ServerSttRequestOptions): void {
  if (state.useServerStt) {
    stopServerSttListening(state, options);
    return;
  }
  state.recognition?.stop();
  state.isListening.value = false;
}

/**
 * Speech-to-text composable.
 * Uses Whisper/server STT when automationSettings.speech.stt.provider is not browser;
 * otherwise falls back to Web Speech API.
 */
export function useSTT(settings?: Ref<VoiceSettings | undefined>) {
  const { settings: appSettings } = useSettings();
  const state: SttMutableState = {
    transcript: ref(""),
    interimTranscript: ref(""),
    isListening: ref(false),
    confidence: ref(0),
    error: ref<string | null>(null),
    recognition: null,
    recorder: null,
    useServerStt: false,
    micPromise: null,
  };

  const sttProvider = computed(() =>
    resolveSpeechSttProvider(appSettings.value?.automationSettings?.speech?.stt?.provider),
  );
  const getServerSttOptions = (): ServerSttRequestOptions =>
    createServerSttRequestOptions(appSettings);

  onMounted(() => {
    state.useServerStt = shouldUseServerStt(sttProvider.value);
    if (state.useServerStt) {
      return;
    }
    state.recognition = createRecognitionInstance(settings);
    bindBrowserRecognitionHandlers(state);
  });

  onUnmounted(() => {
    if (state.recognition) {
      state.recognition.stop();
      state.recognition = null;
    }
    state.recorder = null;
    state.isListening.value = false;
  });

  const fullTranscript = computed(() =>
    toFullTranscript(state.transcript.value, state.interimTranscript.value),
  );
  const isSupported = computed(
    () =>
      shouldUseServerStt(sttProvider.value) ||
      resolveSpeechRecognitionConstructor() !== null ||
      typeof navigator !== "undefined",
  );

  return {
    startListening: (locale?: string) =>
      startSttListening(state, locale, settings, sttProvider.value),
    stopListening: () => stopSttListening(state, getServerSttOptions()),
    transcript: readonly(state.transcript),
    interimTranscript: readonly(state.interimTranscript),
    fullTranscript,
    isListening: readonly(state.isListening),
    confidence: readonly(state.confidence),
    error: readonly(state.error),
    isSupported: readonly(isSupported),
  };
}
