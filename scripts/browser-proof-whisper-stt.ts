/**
 * Fail-closed local Whisper STT proof — real faster-whisper inference.
 * Posts WAV to /api/speech/transcribe with STT=local → Whisper :8090.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { settle } from "../packages/shared/src/utils/promise";
import {
  COUNT_EIGHT,
  COUNT_FIVE_HUNDRED,
  COUNT_FORTY,
  COUNT_FORTY_FOUR,
  COUNT_FOUR,
  COUNT_SIXTEEN,
  COUNT_THIRTY_FOUR,
  COUNT_THIRTY_SIX,
  COUNT_THIRTY_TWO,
  COUNT_TWELVE,
  COUNT_TWENTY,
  COUNT_TWENTY_EIGHT,
  COUNT_TWENTY_TWO,
  HTTP_NOT_FOUND,
  HTTP_UNPROCESSABLE,
  MS_TWO_HUNDRED,
} from "./constants/numeric-literals";
import { writeError, writeOutput } from "./utils/cli-output";
import { reportFindingsAndExit } from "./utils/proof-findings";
import {
  artifactDir,
  resolveProofEnv,
  resolveProofOutDir,
} from "./utils/proof-script-env";

const SERVER_BASE = (resolveProofEnv("PAGE_PROOF_SERVER_BASE") ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);
const WHISPER_BASE = (resolveProofEnv("WHISPER_BASE") ?? "http://127.0.0.1:8090").replace(/\/$/u, "");
const OUT = resolveProofOutDir(
  "WHISPER_PROOF_OUT",
  artifactDir("live-capabilities", "whisper-stt"),
);

/** Minimal silent WAV — Whisper may return empty; also probe health + configured path. */
const buildSilentWav = (): Uint8Array => {
  const sampleRate = 16_000;
  const samples = sampleRate; // 1s
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(COUNT_FORTY_FOUR + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  writeStr(0, "RIFF");
  view.setUint32(COUNT_FOUR, COUNT_THIRTY_SIX + dataSize, true);
  writeStr(COUNT_EIGHT, "WAVE");
  writeStr(COUNT_TWELVE, "fmt ");
  view.setUint32(COUNT_SIXTEEN, COUNT_SIXTEEN, true);
  view.setUint16(COUNT_TWENTY, 1, true);
  view.setUint16(COUNT_TWENTY_TWO, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(COUNT_TWENTY_EIGHT, sampleRate * 2, true);
  view.setUint16(COUNT_THIRTY_TWO, 2, true);
  view.setUint16(COUNT_THIRTY_FOUR, COUNT_SIXTEEN, true);
  writeStr(COUNT_THIRTY_SIX, "data");
  view.setUint32(COUNT_FORTY, dataSize, true);
  return new Uint8Array(buffer);
};

const probeWhisperHealth = async (findings: string[]): Promise<void> => {
  const health = await settle(fetch(`${WHISPER_BASE}/health`));
  if (health.status === "rejected" || !health.value.ok) {
    findings.push("Whisper server not healthy — run bun run speech:whisper:serve");
    return;
  }
  const h = (await health.value.json()) as { status?: string; model?: string };
  await writeFile(join(OUT, "whisper-health.json"), `${JSON.stringify(h, null, 2)}\n`);
};

const ensureLocalSttSettings = async (): Promise<void> => {
  const get = await settle(fetch(`${SERVER_BASE}/api/settings`));
  if (get.status !== "fulfilled" || !get.value.ok) {
    return;
  }
  const settings = (await get.value.json()) as {
    automationSettings?: Record<string, unknown> & {
      speech?: { stt?: Record<string, unknown>; tts?: Record<string, unknown>; locale?: string };
    };
  };
  const automation = settings.automationSettings ?? {};
  const speech = {
    locale: automation.speech?.locale ?? "en-US",
    tts: automation.speech?.tts,
    stt: {
      provider: "local",
      model: "whisper-tiny",
      endpoint: `${WHISPER_BASE}/v1`,
    },
  };
  await settle(
    fetch(`${SERVER_BASE}/api/settings`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ automationSettings: { ...automation, speech } }),
    }),
  );
};

const loadWavBytes = async (): Promise<Uint8Array> => {
  const spokenPath = artifactDir("live-capabilities", "kokoro-tts", "audio", "kokoro-api.wav");
  const spokenFile = Bun.file(spokenPath);
  if (await spokenFile.exists()) {
    return new Uint8Array(await spokenFile.arrayBuffer());
  }
  return buildSilentWav();
};

type TranscribeBody = {
  text?: string;
  provider?: string;
  model?: string;
  error?: string;
};

const classifyTranscribeStatus = (status: number, body: TranscribeBody): string | null => {
  if (status === HTTP_NOT_FOUND) {
    return "transcribe route missing";
  }
  if (status >= COUNT_FIVE_HUNDRED) {
    return `transcribe server error ${String(status)}: ${body.error ?? ""}`;
  }
  if (status === HTTP_UNPROCESSABLE) {
    return `STT not configured for local Whisper: ${body.error ?? ""}`;
  }
  if (status === MS_TWO_HUNDRED && body.provider && body.provider !== "local") {
    return `expected provider=local got ${body.provider}`;
  }
  if (status !== MS_TWO_HUNDRED) {
    return `unexpected status ${String(status)}`;
  }
  return null;
};

const runAppTranscribe = async (wavBytes: Uint8Array, findings: string[]): Promise<void> => {
  const audioBase64 = Buffer.from(wavBytes).toString("base64");
  const syn = await settle(
    fetch(`${SERVER_BASE}/api/speech/transcribe`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        audioBase64,
        mimeType: "audio/wav",
        filename: "speech.wav",
      }),
    }),
  );
  if (syn.status === "rejected") {
    findings.push(`transcribe fetch failed: ${syn.reason.message}`);
    return;
  }
  const status = syn.value.status;
  const body = (await syn.value.json()) as TranscribeBody;
  await writeFile(join(OUT, "transcribe.json"), `${JSON.stringify({ status, body }, null, 2)}\n`);
  const finding = classifyTranscribeStatus(status, body);
  if (finding) {
    findings.push(finding);
  }
};

const runDirectWhisper = async (wavBytes: Uint8Array, findings: string[]): Promise<void> => {
  const form = new FormData();
  form.append("file", new Blob([wavBytes], { type: "audio/wav" }), "speech.wav");
  form.append("model", "whisper-tiny");
  const direct = await settle(
    fetch(`${WHISPER_BASE}/v1/audio/transcriptions`, { method: "POST", body: form }),
  );
  if (direct.status === "rejected" || !direct.value.ok) {
    findings.push("direct Whisper /v1/audio/transcriptions failed");
    return;
  }
  const d = (await direct.value.json()) as { text?: string };
  await writeFile(join(OUT, "whisper-direct.json"), `${JSON.stringify(d, null, 2)}\n`);
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  const findings: string[] = [];

  await probeWhisperHealth(findings);
  await ensureLocalSttSettings();
  const wavBytes = await loadWavBytes();
  await runAppTranscribe(wavBytes, findings);
  await runDirectWhisper(wavBytes, findings);

  const report = { ok: findings.length === 0, findings };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(`whisper-stt: ok=${String(report.ok)} findings=${String(findings.length)}`);
  await reportFindingsAndExit(findings);
};

const run = await settle(main());
if (run.status === "rejected") {
  await writeError(run.reason.message);
  process.exit(1);
}
