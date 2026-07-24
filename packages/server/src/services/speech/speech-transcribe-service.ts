import {
  API_ERROR_SPEECH_STT_ENDPOINT_INVALID,
  API_ERROR_SPEECH_STT_NOT_CONFIGURED,
  API_ERROR_SPEECH_TRANSCRIBE,
} from "@bao/shared/constants/api-errors";
import type { SpeechProviderOption } from "@bao/shared/constants/settings";
import { safeParseJson } from "@bao/shared/utils/json";
import { validateLocalAiEndpoint } from "@bao/shared/utils/local-ai-endpoint";
import { settle } from "@bao/shared/utils/promise";
import { isRecord } from "@bao/shared/utils/type-guards";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { DEFAULT_SETTINGS_ID, settings } from "../../db/schema/settings";
import { decryptProviderKeys } from "../../utils/settings-decrypt";
import { loadAutomationSettings } from "../automation/automation-settings-support";
const NUM_1024 = 1024;
const NUM_120000 = 120_000;
const NUM_180 = 180;
const NUM_8 = 8;

const MAX_AUDIO_BYTES = NUM_8 * NUM_1024 * NUM_1024;
const TRAILING_SLASH_RE = /\/$/u;

export type SpeechTranscribeInput = {
  readonly audioBase64: string;
  readonly mimeType: string;
  readonly filename?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly endpoint?: string;
};

export type SpeechTranscribeResult =
  | {
      readonly ok: true;
      readonly text: string;
      readonly provider: SpeechProviderOption;
      readonly model: string;
    }
  | { readonly ok: false; readonly error: string; readonly status: 400 | 422 | 502 };

const SERVER_STT_PROVIDERS = ["local", "openai", "huggingface", "custom"] as const satisfies readonly SpeechProviderOption[];

const resolveServerSttProvider = (value: string): SpeechProviderOption | null => {
  for (const option of SERVER_STT_PROVIDERS) {
    if (option === value) {
      return option;
    }
  }
  return null;
};

const BASE64_PAYLOAD_RE = /^[A-Za-z0-9+/]+=*$/;

const resolveTranscriptionFilename = (filename: string | undefined, mimeType: string): string => {
  const trimmed = filename?.trim();
  if (trimmed) {
    return trimmed;
  }
  if (mimeType.includes("wav")) {
    return "recording.wav";
  }
  if (mimeType.includes("mp3")) {
    return "recording.mp3";
  }
  return "recording.webm";
};

const decodeAudio = (audioBase64: string): Uint8Array | null => {
  const trimmed = audioBase64.trim();
  if (trimmed.length === 0 || !BASE64_PAYLOAD_RE.test(trimmed)) {
    return null;
  }
  return Uint8Array.from(Buffer.from(trimmed, "base64"));
};

const resolveUpstreamAuth = async (
  provider: SpeechProviderOption,
): Promise<{ readonly apiKey: string | null }> => {
  const rows = await db
    .select()
    .from(settings)
    .where(eq(settings.id, DEFAULT_SETTINGS_ID))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return { apiKey: null };
  }
  const decrypted = decryptProviderKeys(row);
  if (provider === "openai") {
    return { apiKey: decrypted.openaiApiKey ?? null };
  }
  if (provider === "huggingface") {
    return { apiKey: decrypted.huggingfaceToken ?? null };
  }
  return { apiKey: null };
};

const resolveTranscriptionUrl = (
  provider: SpeechProviderOption,
  endpoint: string,
): { readonly ok: true; readonly url: string } | { readonly ok: false; readonly error: string } => {
  const trimmed = endpoint.trim();
  if (provider === "openai") {
    const base =
      trimmed.length > 0 ? trimmed.replace(TRAILING_SLASH_RE, "") : "https://api.openai.com/v1";
    return { ok: true, url: `${base}/audio/transcriptions` };
  }
  if (provider === "huggingface") {
    if (trimmed.length === 0) {
      return { ok: false, error: API_ERROR_SPEECH_STT_ENDPOINT_INVALID };
    }
    return { ok: true, url: trimmed };
  }
  if (provider === "local" || provider === "custom") {
    const validated = validateLocalAiEndpoint(trimmed);
    if (!validated.ok) {
      return { ok: false, error: API_ERROR_SPEECH_STT_ENDPOINT_INVALID };
    }
    const base = validated.endpoint.replace(TRAILING_SLASH_RE, "");
    const withV1 = base.endsWith("/v1") ? base : `${base}/v1`;
    return { ok: true, url: `${withV1}/audio/transcriptions` };
  }
  return { ok: false, error: API_ERROR_SPEECH_STT_NOT_CONFIGURED };
};

const postOpenAiTranscription = async (input: {
  readonly url: string;
  readonly apiKey: string | null;
  readonly bytes: Uint8Array;
  readonly mimeType: string;
  readonly filename: string;
  readonly model: string;
}): Promise<
  { readonly ok: true; readonly text: string } | { readonly ok: false; readonly error: string }
> => {
  const form = new FormData();
  form.append(
    "file",
    new File([Buffer.from(input.bytes)], input.filename, { type: input.mimeType }),
  );
  form.append("model", input.model);
  const headers: Record<string, string> = {};
  if (input.apiKey) {
    headers.Authorization = `Bearer ${input.apiKey}`;
  }
  const responseResult = await settle(
    fetch(input.url, {
      method: "POST",
      headers,
      body: form,
      signal: AbortSignal.timeout(NUM_120000),
    }),
  );
  if (responseResult.status === "rejected") {
    return { ok: false, error: API_ERROR_SPEECH_TRANSCRIBE };
  }
  const response = responseResult.value;
  const bodyText = await response.text();
  if (!response.ok) {
    return { ok: false, error: `${API_ERROR_SPEECH_TRANSCRIBE}: ${bodyText.slice(0, NUM_180)}` };
  }
  const parsed = safeParseJson(bodyText);
  if (!isRecord(parsed) || typeof parsed.text !== "string") {
    return { ok: false, error: API_ERROR_SPEECH_TRANSCRIBE };
  }
  const text = parsed.text.trim();
  if (text.length === 0) {
    return { ok: false, error: API_ERROR_SPEECH_TRANSCRIBE };
  }
  return { ok: true, text };
};

export const transcribeSpeechAudio = async (
  input: SpeechTranscribeInput,
): Promise<SpeechTranscribeResult> => {
  const automation = await loadAutomationSettings();
  const provider = resolveServerSttProvider(
    input.provider?.trim() || automation.speech.stt.provider,
  );
  if (!provider) {
    return { ok: false, error: API_ERROR_SPEECH_STT_NOT_CONFIGURED, status: 422 };
  }
  const model = input.model?.trim() || automation.speech.stt.model;
  const endpoint = input.endpoint?.trim() || automation.speech.stt.endpoint;

  const bytes = decodeAudio(input.audioBase64);
  if (!bytes || bytes.byteLength === 0) {
    return { ok: false, error: "Audio payload is empty or invalid base64", status: 400 };
  }
  if (bytes.byteLength > MAX_AUDIO_BYTES) {
    return { ok: false, error: "Audio payload exceeds 8MB limit", status: 400 };
  }

  const urlResult = resolveTranscriptionUrl(provider, endpoint);
  if (!urlResult.ok) {
    return { ok: false, error: urlResult.error, status: 422 };
  }

  const auth = await resolveUpstreamAuth(provider);
  const filename = resolveTranscriptionFilename(input.filename, input.mimeType);

  const upstream = await postOpenAiTranscription({
    url: urlResult.url,
    apiKey: auth.apiKey,
    bytes,
    mimeType: input.mimeType || "audio/webm",
    filename,
    model,
  });
  if (!upstream.ok) {
    return { ok: false, error: upstream.error, status: 502 };
  }
  return { ok: true, text: upstream.text, provider, model };
};
