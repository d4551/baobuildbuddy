import type { VoiceSettings } from "@bao/shared";
import { computed, onMounted, readonly, ref } from "#imports";
import type { Ref } from "vue";
import { resolveSpeechLocale, resolveSpeechRecognitionConstructor } from "~/utils/speech";

interface RecognitionUpdate {
  finalTranscript: string;
  interimTranscript: string;
  confidence: number;
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

function registerRecognitionCallbacks(
  recognition: SpeechRecognition,
  state: {
    transcript: ReturnType<typeof ref<string>>;
    interimTranscript: ReturnType<typeof ref<string>>;
    confidence: ReturnType<typeof ref<number>>;
    isListening: ReturnType<typeof ref<boolean>>;
    error: ReturnType<typeof ref<string | null>>;
  },
): void {
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const update = processRecognitionResults(event);
    if (update.finalTranscript.length > 0) {
      state.transcript.value += update.finalTranscript;
    }
    state.interimTranscript.value = update.interimTranscript;
    if (update.confidence > 0) {
      state.confidence.value = update.confidence;
    }
  };
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    state.error.value = `${event.error}: ${event.message ?? ""}`;
  };
  recognition.onend = () => {
    state.isListening.value = false;
  };
}

function toFullTranscript(transcript: string, interimTranscript: string): string {
  const combined = transcript + (interimTranscript ? ` ${interimTranscript}` : "");
  return combined.trim();
}

/**
 * Web Speech API Speech-to-Text composable.
 * Supports VoiceSettings: microphoneId (when available), language.
 */
export function useSTT(settings?: Ref<VoiceSettings | undefined>) {
  const transcript = ref("");
  const interimTranscript = ref("");
  const isListening = ref(false);
  const confidence = ref(0);
  const error = ref<string | null>(null);
  let recognition: SpeechRecognition | null = null;
  const state = { transcript, interimTranscript, confidence, isListening, error };

  onMounted(() => {
    recognition = createRecognitionInstance(settings);
    if (!recognition) {
      return;
    }
    registerRecognitionCallbacks(recognition, state);
  });

  const fullTranscript = computed(() =>
    toFullTranscript(transcript.value, interimTranscript.value),
  );
  const isSupported = computed(() => resolveSpeechRecognitionConstructor() !== null);

  const startListening = (locale?: string): boolean => {
    if (!recognition) {
      error.value = "Speech recognition not supported in this browser";
      return false;
    }
    if (isListening.value) {
      return true;
    }

    error.value = null;
    transcript.value = "";
    interimTranscript.value = "";
    confidence.value = 0;
    recognition.lang = resolveSpeechLocale(locale ?? settings?.value?.language);
    recognition.start();
    isListening.value = true;
    return true;
  };

  const stopListening = (): void => {
    recognition?.stop();
    isListening.value = false;
  };

  return {
    startListening,
    stopListening,
    transcript: readonly(transcript),
    interimTranscript: readonly(interimTranscript),
    fullTranscript,
    isListening: readonly(isListening),
    confidence: readonly(confidence),
    error: readonly(error),
    isSupported: readonly(isSupported),
  };
}
