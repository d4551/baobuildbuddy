/**
 * Shared live local-AI probe (Ollama OpenAI-compatible /v1).
 * Fail-closed: empty, missing model, or mock markers → throw.
 */
import { writeOutput } from "./cli-output";

const TRAILING_SLASH_PATTERN = /\/$/u;

const BANNED_AI_MARKERS: readonly RegExp[] = [
  /lorem ipsum/iu,
  /mock completion/iu,
  /deterministic stub/iu,
  /TODO:\s*generate/iu,
];

export type LiveAiProbeResult = {
  readonly endpoint: string;
  readonly modelId: string;
  readonly nonce: string;
  readonly sample: string;
};

export const resolveLocalAiEndpoint = (): string =>
  (
    process.env.LOCAL_MODEL_ENDPOINT ??
    process.env.PRODUCT_DEMO_LOCAL_ENDPOINT ??
    "http://127.0.0.1:11434/v1"
  ).replace(TRAILING_SLASH_PATTERN, "");

/**
 * Probes /v1/models + /v1/chat/completions with a nonce the model must echo.
 */
export const assertLiveInference = async (
  options: {
    readonly endpoint?: string;
    readonly modelId?: string;
    readonly timeoutMs?: number;
  } = {},
): Promise<LiveAiProbeResult> => {
  const endpoint = (options.endpoint ?? resolveLocalAiEndpoint()).replace(TRAILING_SLASH_PATTERN, "");
  const timeoutMs = options.timeoutMs ?? 120_000;
  const modelsUrl = `${endpoint}/models`;
  const modelsResponse = await fetch(modelsUrl, { signal: AbortSignal.timeout(10_000) });
  if (!modelsResponse.ok) {
    throw new Error(`Live AI probe failed: GET ${modelsUrl} → ${String(modelsResponse.status)}`);
  }
  const modelsJson = (await modelsResponse.json()) as {
    data?: Array<{ id?: string }>;
  };
  const modelId =
    options.modelId?.trim() ||
    process.env.LOCAL_MODEL_NAME?.trim() ||
    process.env.PRODUCT_DEMO_MODEL?.trim() ||
    modelsJson.data?.find((entry) => typeof entry.id === "string" && entry.id.length > 0)?.id;
  if (!modelId) {
    throw new Error(`Live AI probe failed: no model id at ${modelsUrl}`);
  }

  const nonce = `BAO_LIVE_${Date.now().toString(36)}`;
  const chatResponse = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: modelId,
      temperature: 0,
      max_tokens: 48,
      messages: [
        {
          role: "system",
          content: "You are a literal echo bot. Output only the user message with no extra words.",
        },
        {
          role: "user",
          content: nonce,
        },
      ],
    }),
  });
  if (!chatResponse.ok) {
    const body = await chatResponse.text();
    throw new Error(
      `Live AI probe failed: chat/completions → ${String(chatResponse.status)} ${body.slice(0, 240)}`,
    );
  }
  const chatJson = (await chatResponse.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const sample = chatJson.choices?.[0]?.message?.content?.trim() ?? "";
  if (sample.length < 3) {
    throw new Error("Live AI probe failed: empty completion (refusing mock/empty provider).");
  }
  if (BANNED_AI_MARKERS.some((pattern) => pattern.test(sample))) {
    throw new Error("Live AI probe failed: response looks like a mock/deterministic stub.");
  }
  if (!sample.includes(nonce)) {
    throw new Error(
      `Live AI probe failed: nonce missing from sample (got ${sample.slice(0, 120)}).`,
    );
  }
  await writeOutput(`live AI ok endpoint=${endpoint} model=${modelId} sample=${sample.slice(0, 120)}`);
  return { endpoint, modelId, nonce, sample };
};
