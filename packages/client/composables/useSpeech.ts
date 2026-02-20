/**
 * Web Speech API composable for local TTS and STT (no external services).
 * Uses browser-native SpeechSynthesis and SpeechRecognition.
 */
export function useSpeech() {
  const isListening = ref(false);
  const isSpeaking = ref(false);
  const transcript = ref("");
  const interimTranscript = ref("");
  const error = ref<string | null>(null);
  const voices = ref<SpeechSynthesisVoice[]>([]);

  let recognition: SpeechRecognition | null = null;
  let synthesis: SpeechSynthesis | null = null;

  function loadVoices() {
    if (import.meta.server) return;
    const v = speechSynthesis.getVoices();
    voices.value = v;
    return v;
  }

  onMounted(() => {
    if (import.meta.server) return;
    synthesis = speechSynthesis;
    synthesis.onvoiceschanged = loadVoices;
    loadVoices();

    const SpeechRecognitionCtor =
      typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (SpeechRecognitionCtor) {
      recognition = new (SpeechRecognitionCtor as new () => SpeechRecognition)();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event: Event) => {
        const e = event as SpeechRecognitionEvent;
        let final = "";
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          const firstAlternative = result?.[0];
          if (!firstAlternative) {
            continue;
          }
          const chunk = firstAlternative.transcript;
          if (result.isFinal) {
            final += chunk;
          } else {
            interim += chunk;
          }
        }
        if (final) transcript.value += final;
        interimTranscript.value = interim;
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

  function speak(
    text: string,
    opts?: {
      rate?: number;
      pitch?: number;
      volume?: number;
      voice?: SpeechSynthesisVoice;
      lang?: string;
    },
  ) {
    if (import.meta.server || !synthesis) return;

    synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = opts?.rate ?? 1;
    utterance.pitch = opts?.pitch ?? 1;
    utterance.volume = opts?.volume ?? 1;
    utterance.lang = opts?.lang ?? "en-US";
    if (opts?.voice) utterance.voice = opts.voice;

    utterance.onstart = () => {
      isSpeaking.value = true;
      error.value = null;
    };
    utterance.onend = () => {
      isSpeaking.value = false;
    };
    utterance.onerror = (e) => {
      error.value = e.error;
      isSpeaking.value = false;
    };

    synthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (synthesis) synthesis.cancel();
    isSpeaking.value = false;
  }

  function startListening(lang = "en-US") {
    if (!recognition) {
      error.value = "Speech recognition not supported in this browser";
      return false;
    }
    error.value = null;
    transcript.value = "";
    interimTranscript.value = "";
    recognition.lang = lang;
    recognition.start();
    isListening.value = true;
    return true;
  }

  function stopListening() {
    if (recognition) recognition.stop();
    isListening.value = false;
  }

  const fullTranscript = computed(() => {
    const t = transcript.value + (interimTranscript.value ? ` ${interimTranscript.value}` : "");
    return t.trim();
  });

  const isSupported = computed(() => {
    if (import.meta.server) return false;
    const SR =
      typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    return !!SR && !!speechSynthesis;
  });

  return {
    isListening: readonly(isListening),
    isSpeaking: readonly(isSpeaking),
    transcript: readonly(transcript),
    interimTranscript: readonly(interimTranscript),
    fullTranscript,
    error: readonly(error),
    voices: readonly(voices),
    isSupported: readonly(isSupported),
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    loadVoices,
  };
}
