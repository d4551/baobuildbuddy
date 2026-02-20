import type { VoiceSettings } from "@bao/shared";
import { resolveSpeechLocale, resolveSpeechRecognitionConstructor } from "~/utils/speech";

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

  onMounted(() => {
    const speechRecognitionCtor = resolveSpeechRecognitionConstructor();
    if (!speechRecognitionCtor) {
      return;
    }

    recognition = new speechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = resolveSpeechLocale(settings?.value?.language);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

      if (finalTranscript.length > 0) {
        transcript.value += finalTranscript;
      }
      interimTranscript.value = currentInterimTranscript;
      if (currentConfidence > 0) {
        confidence.value = currentConfidence;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      error.value = `${event.error}: ${event.message ?? ""}`;
    };

    recognition.onend = () => {
      isListening.value = false;
    };
  });

  const fullTranscript = computed(() => {
    const combinedTranscript =
      transcript.value + (interimTranscript.value ? ` ${interimTranscript.value}` : "");
    return combinedTranscript.trim();
  });

  const isSupported = computed(() => resolveSpeechRecognitionConstructor() !== null);

  function startListening(locale?: string): boolean {
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
  }

  function stopListening(): void {
    if (recognition) {
      recognition.stop();
    }
    isListening.value = false;
  }

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
