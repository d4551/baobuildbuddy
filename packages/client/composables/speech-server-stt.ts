import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { settle } from "@bao/shared/utils/promise";
import { requestApi, useClientApiRequestRuntime } from "./api-request";

export type ServerSttResult =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: string };

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
};

/**
 * Records microphone audio until stop() is called, then returns the Blob.
 */
export const createMicrophoneRecorder = async (): Promise<{
  readonly start: () => void;
  readonly stop: () => Promise<Blob>;
}> => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  return {
    start: () => {
      chunks.length = 0;
      recorder.start();
    },
    stop: () =>
      new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          resolve(new Blob(chunks, { type: mimeType }));
        };
        recorder.onerror = () => {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          reject(new Error("MediaRecorder failed"));
        };
        if (recorder.state !== "inactive") {
          recorder.stop();
        } else {
          for (const track of stream.getTracks()) {
            track.stop();
          }
          resolve(new Blob(chunks, { type: mimeType }));
        }
      }),
  };
};

/**
 * Uploads recorded audio to the server Whisper/STT proxy.
 */
export const transcribeAudioViaServer = async (blob: Blob): Promise<ServerSttResult> => {
  if (blob.size === 0) {
    return { ok: false, error: "empty audio recording" };
  }
  const audioBase64 = await blobToBase64(blob);
  const runtime = useClientApiRequestRuntime();
  const result = await settle(
    requestApi<{ text: string }>(runtime, API_ENDPOINTS.speechTranscribe, {
      method: "POST",
      body: {
        audioBase64,
        mimeType: blob.type || "audio/webm",
        filename: blob.type.includes("wav") ? "recording.wav" : "recording.webm",
      },
    }),
  );
  if (result.status === "rejected") {
    return { ok: false, error: result.reason.message };
  }
  const text = result.value.text?.trim() ?? "";
  if (text.length === 0) {
    return { ok: false, error: "empty transcription" };
  }
  return { ok: true, text };
};
