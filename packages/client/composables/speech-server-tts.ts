import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { settle } from "@bao/shared/utils/promise";
import { WAV_HEADER_MIN_BYTES } from "~/constants/numeric-ui";
import { requestApi, useClientApiRequestRuntime } from "./api-request";

export type ServerTtsResult =
  | {
      readonly ok: true;
      readonly audioBase64: string;
      readonly mimeType: string;
      readonly bytes: number;
      readonly provider: string;
      readonly model: string;
      readonly voice: string;
    }
  | { readonly ok: false; readonly error: string };

type SynthesizeResponse = {
  audioBase64: string;
  mimeType: string;
  bytes: number;
  provider: string;
  model: string;
  voice: string;
};

/**
 * Local Kokoro TTS via Bao server proxy (on-device neural, not browser speechSynthesis).
 */
export const synthesizeSpeechViaServer = async (input: {
  readonly text: string;
  readonly voice?: string;
}): Promise<ServerTtsResult> => {
  const text = input.text.trim();
  if (text.length === 0) {
    return { ok: false, error: "empty text" };
  }
  const runtime = useClientApiRequestRuntime();
  const result = await settle(
    requestApi<SynthesizeResponse>(runtime, API_ENDPOINTS.speechSynthesize, {
      method: "POST",
      body: {
        text,
        ...(input.voice ? { voice: input.voice } : {}),
      },
    }),
  );
  if (result.status === "rejected") {
    return { ok: false, error: result.reason.message };
  }
  const payload = result.value;
  if (!payload.audioBase64 || payload.bytes < WAV_HEADER_MIN_BYTES) {
    return { ok: false, error: "empty audio" };
  }
  return {
    ok: true,
    audioBase64: payload.audioBase64,
    mimeType: payload.mimeType,
    bytes: payload.bytes,
    provider: payload.provider,
    model: payload.model,
    voice: payload.voice,
  };
};

/** Play base64 WAV through HTMLAudioElement (local Kokoro output). */
export const playBase64Audio = async (audioBase64: string, mimeType: string): Promise<void> => {
  const binary = atob(audioBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  const playResult = await settle(audio.play());
  if (playResult.status === "rejected") {
    URL.revokeObjectURL(url);
    throw playResult.reason;
  }
  await new Promise<void>((resolve) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
  });
};
