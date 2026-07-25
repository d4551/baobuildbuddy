import {
  API_ERROR_SPEECH_SYNTHESIZE,
  API_ERROR_SPEECH_TTS_EMPTY_TEXT,
  API_ERROR_SPEECH_TTS_ENDPOINT_INVALID,
  API_ERROR_SPEECH_TTS_NOT_CONFIGURED,
} from "@bao/shared/constants/api-errors";
import { COUNT_FORTY_FOUR, COUNT_TWO_THOUSAND, RATIO_ONE } from "@bao/shared/constants/numeric";
import {
  DEFAULT_LOCAL_TTS_ENDPOINT,
  DEFAULT_LOCAL_TTS_VOICE,
  type SpeechProviderOption,
} from "@bao/shared/constants/settings";
import { validateLocalAiEndpoint } from "@bao/shared/utils/local-ai-endpoint";
import { settle } from "@bao/shared/utils/promise";
import { loadAutomationSettings } from "../automation/automation-settings-support";

const TRAILING_SLASH_PATTERN = /\/$/u;
const MAX_TTS_CHARS = COUNT_TWO_THOUSAND;

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

const validateSynthesizeText = (
  text: string,
): SpeechSynthesizeResult | { readonly ok: true; readonly text: string } => {
  if (text.length === 0) {
    return { ok: false, error: API_ERROR_SPEECH_TTS_EMPTY_TEXT, status: 400 };
  }
  if (text.length > MAX_TTS_CHARS) {
    return { ok: false, error: API_ERROR_SPEECH_TTS_EMPTY_TEXT, status: 400 };
  }
  return { ok: true, text };
};

const parseRiffWavBytes = (
  bytes: Uint8Array,
): SpeechSynthesizeResult | { readonly ok: true; readonly bytes: Uint8Array } => {
  if (bytes.byteLength < COUNT_FORTY_FOUR) {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  // RIFF header check — refuse empty/non-wav false greens
  const b0 = bytes[0];
  const b1 = bytes[1];
  const b2 = bytes[2];
  const b3 = bytes[3];
  if (b0 === undefined || b1 === undefined || b2 === undefined || b3 === undefined) {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  const header = String.fromCharCode(b0, b1, b2, b3);
  if (header !== "RIFF") {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  return { ok: true, bytes };
};

const fetchSynthesizeAudioBytes = async (input: {
  readonly url: string;
  readonly model: string;
  readonly text: string;
  readonly voice: string;
}): Promise<SpeechSynthesizeResult | { readonly ok: true; readonly bytes: Uint8Array }> => {
  const requestResult = await settle(
    fetch(input.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: input.model,
        input: input.text,
        voice: input.voice,
        response_format: "wav",
        speed: RATIO_ONE,
      }),
    }),
  );
  if (requestResult.status === "rejected" || !requestResult.value.ok) {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  const bytesResult = await settle(requestResult.value.arrayBuffer());
  if (bytesResult.status === "rejected") {
    return { ok: false, error: API_ERROR_SPEECH_SYNTHESIZE, status: 502 };
  }
  return parseRiffWavBytes(new Uint8Array(bytesResult.value));
};

/**
 * Synthesize speech via local Kokoro OpenAI-compatible TTS (on-device neural).
 * Cloud OpenAI/HF TTS paths are intentionally not used.
 */
export const synthesizeSpeechAudio = async (
  input: SpeechSynthesizeInput,
): Promise<SpeechSynthesizeResult> => {
  const textResult = validateSynthesizeText(input.text.trim());
  if (!textResult.ok) {
    return textResult;
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

  const audioResult = await fetchSynthesizeAudioBytes({
    url: endpointResolved.url,
    model,
    text: textResult.text,
    voice,
  });
  if (!audioResult.ok) {
    return audioResult;
  }

  return {
    ok: true,
    audioBase64: Buffer.from(audioResult.bytes).toString("base64"),
    mimeType: "audio/wav",
    provider,
    model,
    voice,
    bytes: audioResult.bytes.byteLength,
  };
};
