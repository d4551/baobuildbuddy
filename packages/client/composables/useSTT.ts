import type { SpeechProviderOption } from "@bao/shared/constants/settings";
import type { VoiceSettings } from "@bao/shared/types/interview";
import { settle } from "@bao/shared/utils/promise";
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

type SttRuntime = {
  transcript: Ref<string>;
  interimTranscript: Ref<string>;
  isListening: Ref<boolean>;
  confidence: Ref<number>;
  error: Ref<string | null>;
  settings?: Ref<VoiceSettings | undefined>;
  getRecognition: () => SpeechRecognition | null;
  setRecognition: (value: SpeechRecognition | null) => void;
  getRecorder: () => MicrophoneRecorder | null;
  setRecorder: (value: MicrophoneRecorder | null) => void;
  getUseServerStt: () => boolean;
  setUseServerStt: (value: boolean) => void;
  sttProvider: Ref<SpeechProviderOption>;
};

async function startServerListening(runtime: SttRuntime): Promise<void> {
  const settled = await settle(createMicrophoneRecorder());
  if (settled.status === "rejected") {
    runtime.error.value = settled.reason.message || "Failed to start microphone";
    runtime.isListening.value = false;
    return;
  }
  runtime.setRecorder(settled.value);
  settled.value.start();
  runtime.isListening.value = true;
}

function startBrowserListening(runtime: SttRuntime, locale?: string): boolean {
  const recognition = runtime.getRecognition();
  if (!recognition) {
    runtime.error.value = "Speech recognition not supported in this browser";
    return false;
  }
  if (runtime.isListening.value) {
    return true;
  }
  recognition.lang = resolveSpeechLocale(locale ?? runtime.settings?.value?.language);
  recognition.start();
  runtime.isListening.value = true;
  return true;
}

function startListening(runtime: SttRuntime, locale?: string): boolean {
  runtime.error.value = null;
  runtime.transcript.value = "";
  runtime.interimTranscript.value = "";
  runtime.confidence.value = 0;
  runtime.setUseServerStt(runtime.sttProvider.value !== "browser");

  if (runtime.getUseServerStt()) {
    if (runtime.isListening.value) {
      return true;
    }
    settle(startServerListening(runtime)).then(() => undefined, () => undefined);
    return true;
  }

  return startBrowserListening(runtime, locale);
}

async function finalizeServerStop(
  runtime: SttRuntime,
  recorder: MicrophoneRecorder,
): Promise<void> {
  const stopSettled = await settle(recorder.stop());
  if (stopSettled.status === "rejected") {
    runtime.error.value = stopSettled.reason.message || "Failed to transcribe audio";
    runtime.isListening.value = false;
    return;
  }
  const transcriptSettled = await settle(transcribeAudioViaServer(stopSettled.value));
  if (transcriptSettled.status === "rejected") {
    runtime.error.value = transcriptSettled.reason.message || "Failed to transcribe audio";
    runtime.isListening.value = false;
    return;
  }
  const result = transcriptSettled.value;
  if (result.ok) {
    runtime.transcript.value = result.text;
    runtime.interimTranscript.value = "";
    runtime.confidence.value = 1;
  } else {
    runtime.error.value = result.error;
  }
  runtime.isListening.value = false;
}

function stopListening(runtime: SttRuntime): void {
  if (runtime.getUseServerStt()) {
    const activeRecorder = runtime.getRecorder();
    runtime.setRecorder(null);
    if (!activeRecorder) {
      runtime.isListening.value = false;
      return;
    }
    settle(finalizeServerStop(runtime, activeRecorder)).then(() => undefined, () => undefined);
    return;
  }
  runtime.getRecognition()?.stop();
  runtime.isListening.value = false;
}

function bindBrowserRecognition(runtime: SttRuntime): void {
  runtime.setUseServerStt(runtime.sttProvider.value !== "browser");
  if (runtime.getUseServerStt()) {
    return;
  }
  const recognition = createRecognitionInstance(runtime.settings);
  runtime.setRecognition(recognition);
  if (!recognition) {
    return;
  }
  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const update = processRecognitionResults(event);
    if (update.finalTranscript.length > 0) {
      runtime.transcript.value += update.finalTranscript;
    }
    runtime.interimTranscript.value = update.interimTranscript;
    if (update.confidence > 0) {
      runtime.confidence.value = update.confidence;
    }
  };
  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    runtime.error.value = `${event.error}: ${event.message ?? ""}`;
  };
  recognition.onend = () => {
    runtime.isListening.value = false;
  };
}

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

  const runtime: SttRuntime = {
    transcript,
    interimTranscript,
    isListening,
    confidence,
    error,
    settings,
    getRecognition: () => recognition,
    setRecognition: (value) => {
      recognition = value;
    },
    getRecorder: () => recorder,
    setRecorder: (value) => {
      recorder = value;
    },
    getUseServerStt: () => useServerStt,
    setUseServerStt: (value) => {
      useServerStt = value;
    },
    sttProvider,
  };

  onMounted(() => {
    bindBrowserRecognition(runtime);
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

  return {
    startListening: (locale?: string) => startListening(runtime, locale),
    stopListening: () => stopListening(runtime),
    transcript: readonly(transcript),
    interimTranscript: readonly(interimTranscript),
    fullTranscript,
    isListening: readonly(isListening),
    confidence: readonly(confidence),
    error: readonly(error),
    isSupported: readonly(isSupported),
  };
}
