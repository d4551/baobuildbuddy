import type { VoiceSettings } from "@bao/shared";

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
    if (import.meta.server) return;

    const SpeechRecognitionCtor =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognitionCtor) {
      recognition = new (SpeechRecognitionCtor as new () => SpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = settings?.value?.language ?? "en-US";

      recognition.onresult = (event: Event) => {
        const e = event as SpeechRecognitionEvent;
        let final = "";
        let interim = "";
        let conf = 0;
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          const chunk = result[0].transcript;
          const c = result[0].confidence ?? 0;
          if (result.isFinal) {
            final += chunk;
            conf = Math.max(conf, c);
          } else {
            interim += chunk;
          }
        }
        if (final) transcript.value += final;
        interimTranscript.value = interim;
        if (conf > 0) confidence.value = conf;
      };

      recognition.onerror = (ev: Event) => {
        const err = ev as SpeechRecognitionErrorEvent;
        error.value = `${err.error}: ${err.message || ""}`;
      };

      recognition.onend = () => {
        isListening.value = false;
      };
    }
  });

  const fullTranscript = computed(() => {
    const t = transcript.value + (interimTranscript.value ? ` ${interimTranscript.value}` : "");
    return t.trim();
  });

  const isSupported = computed(() => {
    if (import.meta.server) return false;
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    return !!SR;
  });

  function startListening(lang?: string) {
    if (!recognition) {
      error.value = "Speech recognition not supported in this browser";
      return false;
    }
    error.value = null;
    transcript.value = "";
    interimTranscript.value = "";
    confidence.value = 0;
    recognition.lang = lang ?? settings?.value?.language ?? "en-US";
    try {
      recognition.start();
      isListening.value = true;
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to start";
      return false;
    }
  }

  function stopListening() {
    if (recognition) recognition.stop();
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
