const NUM_10000 = 10_000;
const NUM_120 = 120;
const NUM_120000 = 120_000;
const NUM_240 = 240;
const NUM_3 = 3;
const NUM_36 = 36;
const NUM_8 = 8;

/**
 * Live LLM + Whisper probes and settings seed for product demo.
 */
import {
  FAKE_AUDIO_WAV,
  LOCAL_ENDPOINT,
  RE_BAO_DEMO_DETERMINISTIC,
  RE_BUILD_DETERMINISTIC_CONTENT,
  RE_DETERMINISTIC_AI,
  SERVER_BASE,
  WHISPER_ENDPOINT,
} from "./browser-record-product-demo-shared";
import { writeOutput } from "./utils/cli-output";
import { resolveProofEnv } from "./utils/proof-script-env";

export type LiveModelProbe = {
  endpoint: string;
  modelId: string;
  sample: string;
};

export type LiveWhisperProbe = {
  endpoint: string;
  text: string;
};

const joinEndpoint = (base: string, path: string): string =>
  new URL(path, base.endsWith("/") ? base : `${base}/`).href;

const resolveLiveModelId = async (): Promise<string> => {
  const modelsUrl = joinEndpoint(LOCAL_ENDPOINT, "models");
  const modelsResponse = await fetch(modelsUrl, { signal: AbortSignal.timeout(NUM_10000) });
  if (!modelsResponse.ok) {
    throw new Error(`Live AI probe failed: GET ${modelsUrl} → ${String(modelsResponse.status)}`);
  }
  const modelsJson = (await modelsResponse.json()) as {
    data?: Array<{ id?: string }>;
  };
  const modelId =
    resolveProofEnv("LOCAL_MODEL_NAME")?.trim() ||
    resolveProofEnv("PRODUCT_DEMO_MODEL")?.trim() ||
    modelsJson.data?.find((entry) => typeof entry.id === "string" && entry.id.length > 0)?.id;
  if (!modelId) {
    throw new Error(`Live AI probe failed: no model id at ${modelsUrl}`);
  }
  return modelId;
};

export const assertLiveInference = async (): Promise<LiveModelProbe> => {
  const modelId = await resolveLiveModelId();
  const nonce = `BAO_LIVE_${Date.now().toString(NUM_36)}`;
  const chatResponse = await fetch(joinEndpoint(LOCAL_ENDPOINT, "chat/completions"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(NUM_120000),
    body: JSON.stringify({
      model: modelId,
      temperature: 0.2,
      max_tokens: 48,
      messages: [
        {
          role: "user",
          content: `Reply with one short sentence that includes the token ${nonce}.`,
        },
      ],
    }),
  });
  if (!chatResponse.ok) {
    const body = await chatResponse.text();
    throw new Error(
      `Live AI probe failed: chat/completions → ${String(chatResponse.status)} ${body.slice(0, NUM_240)}`,
    );
  }
  const chatJson = (await chatResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const sample = chatJson.choices?.[0]?.message?.content?.trim() ?? "";
  if (sample.length < NUM_3) {
    throw new Error("Live AI probe failed: empty completion (refusing mock/empty provider).");
  }
  const banned = [RE_BAO_DEMO_DETERMINISTIC, RE_BUILD_DETERMINISTIC_CONTENT, RE_DETERMINISTIC_AI];
  if (banned.some((pattern) => pattern.test(sample))) {
    throw new Error("Live AI probe failed: response looks like a mock/deterministic stub.");
  }
  await writeOutput(
    `live AI ok endpoint=${LOCAL_ENDPOINT} model=${modelId} sample=${sample.slice(0, NUM_120)}`,
  );
  return { endpoint: LOCAL_ENDPOINT, modelId, sample };
};

export const assertLiveWhisper = async (): Promise<LiveWhisperProbe> => {
  const wavFile = Bun.file(FAKE_AUDIO_WAV);
  if (!(await wavFile.exists())) {
    throw new Error(`Whisper fixture missing: ${FAKE_AUDIO_WAV}`);
  }
  const form = new FormData();
  form.append(
    "file",
    new File([await wavFile.arrayBuffer()], "interview-answer.wav", { type: "audio/wav" }),
  );
  form.append("model", "whisper-tiny");
  const response = await fetch(joinEndpoint(WHISPER_ENDPOINT, "audio/transcriptions"), {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(NUM_120000),
  });
  if (!response.ok) {
    throw new Error(`Live Whisper probe failed: ${String(response.status)}`);
  }
  const json = (await response.json()) as { text?: string };
  const text = json.text?.trim() ?? "";
  if (text.length < NUM_8) {
    throw new Error("Live Whisper probe failed: empty transcript");
  }
  await writeOutput(`live Whisper ok endpoint=${WHISPER_ENDPOINT} text=${text.slice(0, NUM_120)}`);
  return { endpoint: WHISPER_ENDPOINT, text };
};

export const seedSpeechAndAiSettings = async (modelId: string): Promise<void> => {
  const settingsResponse = await fetch(joinEndpoint(SERVER_BASE, "api/settings"));
  const settings = (await settingsResponse.json()) as {
    automationSettings?: {
      speech?: {
        locale?: string;
        stt?: { provider?: string; model?: string; endpoint?: string };
        tts?: Record<string, string>;
      };
    };
  };
  const speech = settings.automationSettings?.speech ?? {};
  await fetch(joinEndpoint(SERVER_BASE, "api/settings/api-keys"), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      localModelEndpoint: LOCAL_ENDPOINT,
      localModelName: modelId,
    }),
  });
  await fetch(joinEndpoint(SERVER_BASE, "api/settings"), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      preferredProvider: "local",
      preferredModel: modelId,
      automationSettings: {
        speech: {
          locale: speech.locale ?? "en-US",
          stt: {
            provider: "local",
            model: "whisper-tiny",
            endpoint: WHISPER_ENDPOINT,
          },
          tts: speech.tts ?? {
            provider: "browser",
            model: "browser-default",
            endpoint: "",
            voice: "default",
            format: "mp3",
          },
        },
      },
    }),
  });
  await writeOutput("seeded speech STT=local/whisper-tiny + local AI");
};
