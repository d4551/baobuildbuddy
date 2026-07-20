import type { VoiceSettings } from "@bao/shared/types/interview";
import type { SpeechProviderOption } from "@bao/shared/constants/settings";
import type { Ref } from "vue";
import { computed, onMounted, readonly, ref } from "#imports";
import { resolveSpeechLocale, resolveSpeechRecognitionConstructor } from "~/utils/speech";
import { createMicrophoneRecorder, transcribeAudioViaServer } from "./speech-server-stt";
import { useSettings } from "./useSettings";

interface RecognitionUpdate {
  finalTranscript: string;
  interimTranscript: string;
  confidence: number;
}

type MicrophoneRecorder = Awaited<ReturnType<typeof createMicrophoneRecorder>>;

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

const resolveConfiguredSttProvider = (
  settingsSpeechProvider: string | undefined,
): SpeechProviderOption => {
  if (
    settingsSpeechProvider === "local" ||
    settingsSpeechProvider === "openai" ||
    settingsSpeechProvider === "huggingface" ||
    settingsSpeechProvider === "custom" ||
    settingsSpeechProvider === "browser"
  ) {
    return settingsSpeechProvider;
  }
  return "browser";
};

/**
 * Speech-to-text composable.
 * Uses Whisper/server STT when automationSettings.speech.stt.provider is not browser;
 * otherwise falls back to Web Speech API.
 */
export function useSTT(settings?: Ref<VoiceSettings | undefined>) {
  const { settings: appSettings } = useSettings();
  const transcript = ref("");
  const interimTranscript = ref("");
  const isListening = ref(false);
  const confidence = ref(0);
  const error = ref<string | null>(null);
  let recognition: SpeechRecognition | null = null;
  let recorder: MicrophoneRecorder | null = null;
  let useServerStt = false;

  const sttProvider = computed(() =>
    resolveConfiguredSttProvider(appSettings.value?.automationSettings?.speech?.stt?.provider),
  );

  onMounted(() => {
    useServerStt = sttProvider.value !== "browser";
    if (useServerStt) {
      return;
    }
    recognition = createRecognitionInstance(settings);
    if (!recognition) {
      return;
    }
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const update = processRecognitionResults(event);
      if (update.finalTranscript.length > 0) {
        transcript.value += update.finalTranscript;
      }
      interimTranscript.value = update.interimTranscript;
      if (update.confidence > 0) {
        confidence.value = update.confidence;
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      error.value = `${event.error}: ${event.message ?? ""}`;
    };
    recognition.onend = () => {
      isListening.value = false;
    };
  });

  const fullTranscript = computed(() =>
    toFullTranscript(transcript.value, interimTranscript.value),
  );
  const isSupported = computed(
    () =>
      sttProvider.value !== "browser" ||
      resolveSpeechRecognitionConstructor() !== null ||
      typeof navigator !== "undefined",
  );

  const startListening = (locale?: string): boolean => {
    error.value = null;
    transcript.value = "";
    interimTranscript.value = "";
    confidence.value = 0;
    useServerStt = sttProvider.value !== "browser";

    if (useServerStt) {
      if (isListening.value) {
        return true;
      }
      createMicrophoneRecorder()
        .then((created) => {
          recorder = created;
          created.start();
          isListening.value = true;
        })
        .catch((startError: unknown) => {
          error.value =
            startError instanceof Error ? startError.message : "Failed to start microphone";
          isListening.value = false;
        });
      return true;
    }

    if (!recognition) {
      error.value = "Speech recognition not supported in this browser";
      return false;
    }
    if (isListening.value) {
      return true;
    }
    recognition.lang = resolveSpeechLocale(locale ?? settings?.value?.language);
    recognition.start();
    isListening.value = true;
    return true;
  };

  const stopListening = (): void => {
    if (useServerStt) {
      const activeRecorder = recorder;
      recorder = null;
      if (!activeRecorder) {
        isListening.value = false;
        return;
      }
      activeRecorder
        .stop()
        .then((blob) => transcribeAudioViaServer(blob))
        .then((result) => {
          if (result.ok) {
            transcript.value = result.text;
            interimTranscript.value = "";
            confidence.value = 1;
          } else {
            error.value = result.error;
          }
        })
        .catch((stopError: unknown) => {
          error.value =
            stopError instanceof Error ? stopError.message : "Failed to transcribe audio";
        })
        .finally(() => {
          isListening.value = false;
        });
      return;
    }
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
