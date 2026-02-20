import {
  AI_CHAT_VOICE_ERROR_CODES,
  AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP,
  AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP,
  type AIChatVoiceErrorCode,
} from "@bao/shared";
import {
  resolveSpeechLocale,
  resolveSpeechRecognitionConstructor,
  resolveSpeechSynthesis,
} from "../utils/speech";

type RecognitionErrorName = keyof typeof AI_CHAT_VOICE_RECOGNITION_ERROR_CODE_MAP;
type SynthesisErrorName = keyof typeof AI_CHAT_VOICE_SYNTHESIS_ERROR_CODE_MAP;

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

/**
 * Web Speech API composable for local TTS and STT (no external services).
 * Uses browser-native SpeechSynthesis and SpeechRecognition.
 */
export function useSpeech() {
  const isListening = ref(false);
  const isSpeaking = ref(false);
  const transcript = ref("");
  const interimTranscript = ref("");
  const error = ref<AIChatVoiceErrorCode | null>(null);
  const voices = ref<SpeechSynthesisVoice[]>([]);

  let recognition: SpeechRecognition | null = null;
  const synthesisRef = ref<SpeechSynthesis | null>(null);

  function loadVoices(): SpeechSynthesisVoice[] {
    const resolvedSynthesis = synthesisRef.value ?? resolveSpeechSynthesis();
    if (!resolvedSynthesis) {
      voices.value = [];
      return [];
    }

    const availableVoices = resolvedSynthesis.getVoices();
    voices.value = availableVoices;
    return availableVoices;
  }

  onMounted(() => {
    synthesisRef.value = resolveSpeechSynthesis();
    if (synthesisRef.value) {
      synthesisRef.value.onvoiceschanged = () => {
        loadVoices();
      };
      loadVoices();
    }

    const speechRecognitionCtor = resolveSpeechRecognitionConstructor();
    if (!speechRecognitionCtor) {
      return;
    }

    recognition = new speechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = resolveSpeechLocale();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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
          continue;
        }

        currentInterimTranscript += firstAlternative.transcript;
      }

      if (finalTranscript.length > 0) {
        transcript.value += finalTranscript;
      }
      interimTranscript.value = currentInterimTranscript;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      error.value = resolveRecognitionErrorCode(event.error);
    };

    recognition.onend = () => {
      isListening.value = false;
    };
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
  ): void {
    const resolvedSynthesis = synthesisRef.value ?? resolveSpeechSynthesis();
    if (!resolvedSynthesis) {
      error.value = AI_CHAT_VOICE_ERROR_CODES.unsupportedSynthesis;
      return;
    }

    synthesisRef.value = resolvedSynthesis;
    resolvedSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = opts?.rate ?? 1;
    utterance.pitch = opts?.pitch ?? 1;
    utterance.volume = opts?.volume ?? 1;
    utterance.lang = resolveSpeechLocale(opts?.lang);
    if (opts?.voice) {
      utterance.voice = opts.voice;
    }

    utterance.onstart = () => {
      isSpeaking.value = true;
      error.value = null;
    };
    utterance.onend = () => {
      isSpeaking.value = false;
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      error.value = resolveSynthesisErrorCode(event.error);
      isSpeaking.value = false;
    };

    resolvedSynthesis.speak(utterance);
  }

  function stopSpeaking(): void {
    const resolvedSynthesis = synthesisRef.value ?? resolveSpeechSynthesis();
    if (resolvedSynthesis) {
      resolvedSynthesis.cancel();
      synthesisRef.value = resolvedSynthesis;
    }
    isSpeaking.value = false;
  }

  function startListening(locale?: string): boolean {
    if (!recognition) {
      error.value = AI_CHAT_VOICE_ERROR_CODES.unsupportedRecognition;
      return false;
    }

    if (isListening.value) {
      return true;
    }

    error.value = null;
    transcript.value = "";
    interimTranscript.value = "";
    recognition.lang = resolveSpeechLocale(locale);
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

  const fullTranscript = computed(() => {
    const combinedTranscript =
      transcript.value + (interimTranscript.value ? ` ${interimTranscript.value}` : "");
    return combinedTranscript.trim();
  });

  const supportsRecognition = computed(() => resolveSpeechRecognitionConstructor() !== null);
  const supportsSynthesis = computed(
    () => (synthesisRef.value ?? resolveSpeechSynthesis()) !== null,
  );
  const isSupported = computed(() => supportsRecognition.value || supportsSynthesis.value);

  return {
    isListening: readonly(isListening),
    isSpeaking: readonly(isSpeaking),
    transcript: readonly(transcript),
    interimTranscript: readonly(interimTranscript),
    fullTranscript,
    error: readonly(error),
    voices: readonly(voices),
    supportsRecognition: readonly(supportsRecognition),
    supportsSynthesis: readonly(supportsSynthesis),
    isSupported: readonly(isSupported),
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    loadVoices,
  };
}
