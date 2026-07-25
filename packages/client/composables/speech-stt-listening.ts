import {
  AI_CHAT_VOICE_ERROR_CODES,
  type AIChatVoiceErrorCode,
} from "@bao/shared/constants/ai-voice";
import { settle } from "@bao/shared/utils/promise";
import type { Ref } from "vue";
import { resolveSpeechLocale } from "../utils/speech";
import {
  createMicrophoneRecorder,
  type ServerSttRequestOptions,
  transcribeAudioViaServer,
} from "./speech-server-stt";
import { resolveSpeechSttProvider, shouldUseServerStt } from "./speech-stt-provider";

type MicrophoneRecorder = Awaited<ReturnType<typeof createMicrophoneRecorder>>;

export interface SpeechListeningState {
  isListening: Ref<boolean>;
  transcript: Ref<string>;
  interimTranscript: Ref<string>;
  error: Ref<AIChatVoiceErrorCode | null>;
  recognition: Ref<SpeechRecognition | null>;
}

export const createStartListeningAction = (
  state: SpeechListeningState,
  getProvider: () => ReturnType<typeof resolveSpeechSttProvider>,
  getServerSttOptions: () => ServerSttRequestOptions,
) => {
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
            const transcriptSettled = await settle(
              transcribeAudioViaServer(stopSettled.value, getServerSttOptions()),
            );
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
