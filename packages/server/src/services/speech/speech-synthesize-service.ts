import {
  API_ERROR_SPEECH_SYNTHESIZE,
  API_ERROR_SPEECH_TTS_EMPTY_TEXT,
  API_ERROR_SPEECH_TTS_ENDPOINT_INVALID,
  API_ERROR_SPEECH_TTS_NOT_CONFIGURED,
} from "@bao/shared/constants/api-errors";
import {
  DEFAULT_LOCAL_TTS_ENDPOINT,
  DEFAULT_LOCAL_TTS_VOICE,
  type SpeechProviderOption,
} from "@bao/shared/constants/settings";
import { settle } from "@bao/shared/utils/promise";
import { validateLocalAiEndpoint } from "@bao/shared/utils/local-ai-endpoint";
import { loadAutomationSettings } from "../automation/automation-settings-support";

const TRAILING_SLASH_PATTERN = /\/$/u;
const MAX_TTS_CHARS = 2_000;

export type SpeechSynthesizeInput = {
  readonly text: string;
  readonly voice?: string;
};

export type SpeechSynthesizeResult =
  | {
      readonly ok: true;
      readonly audioBase64: string;
      readonly mimeType: "audio/wav";
      readonly provider: SpeechProviderOption;
      readonly model: string;
      readonly voice: string;
      readonly bytes: number;
    }
  | { readonly ok: false; readonly error: string; readonly status: 400 | 422 | 502 };

const resolveSpeechUrl = (
  endpoint: string,
): { readonly ok: true; readonly url: string } | { readonly ok: false; readonly error: string } => {
  const trimmed = endpoint.trim().length > 0 ? endpoint.trim() : DEFAULT_LOCAL_TTS_ENDPOINT;
  const validated = validateLocalAiEndpoint(trimmed);
  if (!validated.ok) {
    return { ok: false, error: API_ERROR_SPEECH_TTS_ENDPOINT_INVALID };
  }
  const base = validated.endpoint.replace(TRAILING_SLASH_PATTERN, "");
  const withV1 = base.endsWith("/v1") ? base : `${base}/v1`;
  return { ok: true, url: `${withV1}/audio/speech` };
};

/**
 * Synthesize speech via local Kokoro OpenAI-compatible TTS (on-device neural).
 * Cloud OpenAI/HF TTS paths are intentionally not used.
 */
export const synthesizeSpeechAudio = async (
  input: SpeechSynthesizeInput,
): Promise<SpeechSynthesizeResult> => {
  const text = input.text.trim();
  if (text.length === 0) {
    return { ok: false, error: API_ERROR_SPEECH_TTS_EMPTY_TEXT, status: 400 };
  }
  if (text.length > MAX_TTS_CHARS) {
    return { ok: false, error: API_ERROR_SPEECH_TTS_EMPTY_TEXT, status: 400 };
  }

  const automation = await loadAutomationSettings();
  const provider = automation.speech.tts.provider;
  if (provider !== "local" && provider !== "custom") {
    return { ok: false, error: API_ERROR_SPEECH_TTS_NOT_CONFIGURED, status: 422 };
  }

  const endpointResolved = resolveSpeechUrl(automation.speech.tts.endpoint);
  if (!endpointResolved.ok) {
    return { ok: false, error: endpointResolved.error, status: 422 };
  }

  const voice =
    (input.voice && input.voice.trim().length > 0
      ? input.voice.trim()
      : automation.speech.tts.voice.trim()) || DEFAULT_LOCAL_TTS_VOICE;
  const model = automation.speech.tts.model.trim() || "kokoro";

  const requestResult = await settle(
    fetch(endpointResolved.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: "wav",
        speed: 1.0,
      }),
    }),
  );
  if (requestResult.status === "rejected") {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  if (!requestResult.value.ok) {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  const bytesResult = await settle(requestResult.value.arrayBuffer());
  if (bytesResult.status === "rejected") {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  const bytes = new Uint8Array(bytesResult.value);
  if (bytes.byteLength < 44) {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  // RIFF header check — refuse empty/non-wav false greens
  const header = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  if (header !== "RIFF") {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }

  return {
    ok: true,
    audioBase64: Buffer.from(bytes).toString("base64"),
    mimeType: "audio/wav",
    provider,
    model,
    voice,
    bytes: bytes.byteLength,
  };
};
