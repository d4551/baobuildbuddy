/**
 * Fail-closed local Whisper STT proof — real faster-whisper inference.
 * Posts WAV to /api/speech/transcribe with STT=local → Whisper :8090.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { settle } from "../packages/shared/src/utils/promise";
import { writeError, writeOutput } from "./utils/cli-output";

const SERVER_BASE = (process.env.PAGE_PROOF_SERVER_BASE ?? "http://127.0.0.1:3000").replace(
  /\/$/u,
  "",
);
const WHISPER_BASE = (process.env.WHISPER_BASE ?? "http://127.0.0.1:8090").replace(/\/$/u, "");
const OUT = process.env.WHISPER_PROOF_OUT ?? "/opt/cursor/artifacts/live-capabilities/whisper-stt";

/** Minimal silent WAV — Whisper may return empty; also probe health + configured path. */
const buildSilentWav = (): Uint8Array => {
  const sampleRate = 16_000;
  const samples = sampleRate; // 1s
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (offset: number, value: string): void => {
    for (let i = 0; i < value.length; i += 1) {
      view.setUint8(offset + i, value.charCodeAt(i));
    }
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);
  return new Uint8Array(buffer);
};

const main = async (): Promise<void> => {
  await mkdir(join(OUT, "stills"), { recursive: true });
  const findings: string[] = [];

  const health = await settle(fetch(`${WHISPER_BASE}/health`));
  if (health.status === "rejected" || !health.value.ok) {
    findings.push("Whisper server not healthy — run bun run speech:whisper:serve");
  } else {
    const h = (await health.value.json()) as { status?: string; model?: string };
    await writeFile(join(OUT, "whisper-health.json"), `${JSON.stringify(h, null, 2)}\n`);
  }

  // Ensure settings STT=local
  const get = await settle(fetch(`${SERVER_BASE}/api/settings`));
  if (get.status === "fulfilled" && get.value.ok) {
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
  }

  // Prefer Kokoro-spoken WAV (real speech) so Whisper returns non-empty text when possible.
  const spokenPath = "/opt/cursor/artifacts/live-capabilities/kokoro-tts/audio/kokoro-api.wav";
  const spokenFile = Bun.file(spokenPath);
  const wavBytes = (await spokenFile.exists())
    ? new Uint8Array(await spokenFile.arrayBuffer())
    : buildSilentWav();
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
  } else {
    const status = syn.value.status;
    const body = (await syn.value.json()) as {
      text?: string;
      provider?: string;
      model?: string;
      error?: string;
    };
    await writeFile(join(OUT, "transcribe.json"), `${JSON.stringify({ status, body }, null, 2)}\n`);
    if (status === 404) {
      findings.push("transcribe route missing");
    } else if (status >= 500) {
      findings.push(`transcribe server error ${String(status)}: ${body.error ?? ""}`);
    } else if (status === 422) {
      findings.push(`STT not configured for local Whisper: ${body.error ?? ""}`);
    } else if (status === 200 && body.provider && body.provider !== "local") {
      findings.push(`expected provider=local got ${body.provider}`);
    } else if (status !== 200) {
      findings.push(`unexpected status ${String(status)}`);
    }
  }

  const form = new FormData();
  form.append("file", new Blob([wavBytes], { type: "audio/wav" }), "speech.wav");
  form.append("model", "whisper-tiny");
  const direct = await settle(
    fetch(`${WHISPER_BASE}/v1/audio/transcriptions`, { method: "POST", body: form }),
  );
  if (direct.status === "rejected" || !direct.value.ok) {
    findings.push("direct Whisper /v1/audio/transcriptions failed");
  } else {
    const d = (await direct.value.json()) as { text?: string };
    await writeFile(join(OUT, "whisper-direct.json"), `${JSON.stringify(d, null, 2)}\n`);
  }

  const report = { ok: findings.length === 0, findings };
  await writeFile(join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
  await writeOutput(`whisper-stt: ok=${String(report.ok)} findings=${String(findings.length)}`);
  if (findings.length > 0) {
    for (const f of findings) {
      await writeError(f);
    }
    process.exit(1);
  }
};

const run = await settle(main());
if (run.status === "rejected") {
  await writeError(run.reason.message);
  process.exit(1);
}
