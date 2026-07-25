import {
  AI_CHAT_VOICE_ERROR_CODES,
  type AIChatVoiceErrorCode,
} from "@bao/shared/constants/ai-voice";
import type { SpeechProviderOption } from "@bao/shared/constants/settings";
import { settle } from "@bao/shared/utils/promise";
import type { Ref } from "vue";
import { resolveSpeechLocale } from "../utils/speech";
import {
  createMicrophoneRecorder,
  type ServerSttRequestOptions,
  transcribeAudioViaServer,
} from "./speech-server-stt";
import { shouldUseServerStt } from "./speech-stt-provider";

type MicrophoneRecorder = Awaited<ReturnType<typeof createMicrophoneRecorder>>;

export interface SpeechListeningState {
  isListening: Ref<boolean>;
  transcript: Ref<string>;
  interimTranscript: Ref<string>;
  error: Ref<AIChatVoiceErrorCode | null>;
  recognition: Ref<SpeechRecognition | null>;
}

function resetListeningTranscript(state: SpeechListeningState): void {
  state.error.value = null;
  state.transcript.value = "";
  state.interimTranscript.value = "";
}

function startServerListening(
  state: SpeechListeningState,
  setRecorder: (recorder: MicrophoneRecorder | null) => void,
): boolean {
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
      setRecorder(settled.value);
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

function startBrowserListening(state: SpeechListeningState, locale?: string): boolean {
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
}

async function transcribeStoppedRecording(
  state: SpeechListeningState,
  blob: Blob,
  getServerSttOptions: () => ServerSttRequestOptions,
): Promise<void> {
  const transcriptSettled = await settle(transcribeAudioViaServer(blob, getServerSttOptions()));
  if (transcriptSettled.status === "rejected") {
    state.error.value = AI_CHAT_VOICE_ERROR_CODES.network;
    return;
  }
  const result = transcriptSettled.value;
  if (result.ok) {
    state.transcript.value = result.text;
    state.interimTranscript.value = "";
    return;
  }
  state.error.value = AI_CHAT_VOICE_ERROR_CODES.network;
}

function stopServerListening(
  state: SpeechListeningState,
  recorder: MicrophoneRecorder | null,
  clearRecorder: () => void,
  getServerSttOptions: () => ServerSttRequestOptions,
): void {
  clearRecorder();
  if (!recorder) {
    state.isListening.value = false;
    return;
  }
  settle(recorder.stop())
    .then(
      async (stopSettled) => {
        if (stopSettled.status === "rejected") {
          state.error.value = AI_CHAT_VOICE_ERROR_CODES.network;
          return;
        }
        await transcribeStoppedRecording(state, stopSettled.value, getServerSttOptions);
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
}

function stopBrowserListening(state: SpeechListeningState): void {
  if (state.recognition.value) {
    state.recognition.value.stop();
  }
  state.isListening.value = false;
}

export const createStartListeningAction = (
  state: SpeechListeningState,
  getProvider: () => SpeechProviderOption,
  getServerSttOptions: () => ServerSttRequestOptions,
) => {
  let recorder: MicrophoneRecorder | null = null;

  const startListening = (locale?: string): boolean => {
    resetListeningTranscript(state);
    if (shouldUseServerStt(getProvider())) {
      return startServerListening(state, (next) => {
        recorder = next;
      });
    }
    return startBrowserListening(state, locale);
  };

  const stopListening = (): void => {
    if (shouldUseServerStt(getProvider())) {
      const active = recorder;
      stopServerListening(
        state,
        active,
        () => {
          recorder = null;
        },
        getServerSttOptions,
      );
      return;
    }
    stopBrowserListening(state);
  };

  return { startListening, stopListening };
};
