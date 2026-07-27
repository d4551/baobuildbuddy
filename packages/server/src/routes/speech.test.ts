import { afterAll, afterEach, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";
import { Database } from "bun:sqlite";
import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNPROCESSABLE_ENTITY,
} from "@bao/shared/constants/http";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { requestJson } from "../test-utils";
import {
  applications,
  auditLog,
  auth,
  automationRuns,
  chatHistory,
  coverLetters,
  gamification,
  interviewSessions,
  jobTaxonomyKeywords,
  jobs,
  portfolioProjects,
  portfolios,
  resumes,
  savedJobs,
  settings,
  skillMappings,
  studioClassificationRules,
  studios,
  userProfile,
  userRole,
} from "../db/schema/schema-modules";

const schema = {
  applications,
  auditLog,
  auth,
  automationRuns,
  chatHistory,
  coverLetters,
  gamification,
  interviewSessions,
  jobTaxonomyKeywords,
  jobs,
  portfolioProjects,
  portfolios,
  resumes,
  savedJobs,
  settings,
  skillMappings,
  studioClassificationRules,
  studios,
  userProfile,
  userRole,
};

const sqlite = new Database(":memory:");
sqlite.exec("PRAGMA foreign_keys = ON;");
const db = drizzle({ client: sqlite, schema });

// Destructured before the mock is installed so the real bindings are copied
// rather than read back through the (by then replaced) namespace.
const {
  db: realDb,
  sqlite: realSqlite,
  HEALTHCHECK_PROBE_SQL: realHealthcheckProbeSql,
} = await import("../db/client");

await mock.module("../db/client", () => ({
  db,
  sqlite,
  HEALTHCHECK_PROBE_SQL: "SELECT 1",
}));

// `mock.module` swaps the module for the whole test process and `mock.restore()`
// does not undo it, so without this every later file that imports `db/client`
// would silently run against this file's in-memory database.
afterAll(async () => {
  await mock.module("../db/client", () => ({
    db: realDb,
    sqlite: realSqlite,
    HEALTHCHECK_PROBE_SQL: realHealthcheckProbeSql,
  }));
});

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed/index");
  const routesModule = await import("./speech.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(sqlite);
  seedModule.seedDatabase(db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.speechRoutes);
});

afterEach(() => {
  mock.restore();
});

/** A minimal RIFF/WAVE header is 44 bytes; the stub reply carries header only. */
const WAV_HEADER_BYTES = 44;

describe("speech transcribe request validation", () => {
  test("POST transcribe rejects missing audioBase64", async () => {
    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechTranscribe, {
      mimeType: "audio/webm",
    });
    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
  });

  test("POST transcribe rejects missing mimeType", async () => {
    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechTranscribe, {
      audioBase64: "AAAA",
    });
    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
  });

  test("POST transcribe rejects invalid base64 payload", async () => {
    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechTranscribe, {
      audioBase64: "!!!not-base64!!!",
      mimeType: "audio/webm",
    });
    expect(res.status).toBe(HTTP_STATUS_BAD_REQUEST);
    expect(res.body.error).toContain("empty or invalid");
  });
});

describe("speech transcribe provider behaviour", () => {
  test("POST transcribe returns 422 when provider is not configured", async () => {
    const sttModule = await import("../services/speech/speech-transcribe-service");
    spyOn(sttModule, "transcribeSpeechAudio").mockResolvedValue({
      ok: false,
      error: "Speech-to-text provider not configured",
      status: 422,
    });

    const validBase64 = Buffer.from("fake-audio-bytes").toString("base64");
    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechTranscribe, {
      audioBase64: validBase64,
      mimeType: "audio/webm",
    });
    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
    expect(res.body.error).toContain("not configured");
  });

  test("POST transcribe returns transcription on success", async () => {
    const sttModule = await import("../services/speech/speech-transcribe-service");
    spyOn(sttModule, "transcribeSpeechAudio").mockResolvedValue({
      ok: true,
      text: "hello world",
      provider: "local",
      model: "whisper-tiny",
    });

    const validBase64 = Buffer.from("fake-audio-bytes").toString("base64");
    const res = await requestJson<{
      text?: string;
      provider?: string;
      model?: string;
      message?: string;
    }>(app, "POST", API_ENDPOINTS.speechTranscribe, {
      audioBase64: validBase64,
      mimeType: "audio/webm",
    });
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.text).toBe("hello world");
    expect(res.body.provider).toBe("local");
    expect(res.body.model).toBe("whisper-tiny");
    expect(typeof res.body.message).toBe("string");
    expect((res.body.message ?? "").length).toBeGreaterThan(0);
  });

  test("POST transcribe returns 502 on upstream failure", async () => {
    const sttModule = await import("../services/speech/speech-transcribe-service");
    spyOn(sttModule, "transcribeSpeechAudio").mockResolvedValue({
      ok: false,
      error: "Upstream unreachable",
      status: 502,
    });

    const validBase64 = Buffer.from("fake-audio-bytes").toString("base64");
    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechTranscribe, {
      audioBase64: validBase64,
      mimeType: "audio/webm",
    });
    expect(res.status).toBe(HTTP_STATUS_BAD_GATEWAY);
    expect(res.body.error).toContain("Upstream unreachable");
  });
});

describe("speech synthesize request validation", () => {
  test("POST synthesize rejects missing text", async () => {
    const res = await requestJson<{ error?: string }>(
      app,
      "POST",
      API_ENDPOINTS.speechSynthesize,
      {},
    );
    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
  });

  test("POST synthesize rejects empty text", async () => {
    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechSynthesize, {
      text: "",
    });
    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
  });
});

describe("speech synthesize provider behaviour", () => {
  test("POST synthesize returns audio on success", async () => {
    const ttsModule = await import("../services/speech/speech-synthesize-service");
    spyOn(ttsModule, "synthesizeSpeechAudio").mockResolvedValue({
      ok: true,
      audioBase64: Buffer.from("RIFF-fake-wav").toString("base64"),
      mimeType: "audio/wav",
      provider: "local",
      model: "kokoro",
      voice: "af_heart",
      bytes: 44,
    });

    const res = await requestJson<{
      audioBase64?: string;
      mimeType?: string;
      provider?: string;
      model?: string;
      voice?: string;
      bytes?: number;
      message?: string;
    }>(app, "POST", API_ENDPOINTS.speechSynthesize, {
      text: "Hello from BaoBuildBuddy",
    });
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(typeof res.body.audioBase64).toBe("string");
    expect((res.body.audioBase64 ?? "").length).toBeGreaterThan(0);
    expect(res.body.mimeType).toBe("audio/wav");
    expect(res.body.provider).toBe("local");
    expect(res.body.model).toBe("kokoro");
    expect(res.body.voice).toBe("af_heart");
    expect(res.body.bytes).toBe(WAV_HEADER_BYTES);
    expect(typeof res.body.message).toBe("string");
    expect((res.body.message ?? "").length).toBeGreaterThan(0);
  });

  test("POST synthesize returns 422 when TTS not configured", async () => {
    const ttsModule = await import("../services/speech/speech-synthesize-service");
    spyOn(ttsModule, "synthesizeSpeechAudio").mockResolvedValue({
      ok: false,
      error: "TTS provider not configured",
      status: 422,
    });

    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechSynthesize, {
      text: "Hello",
    });
    expect(res.status).toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
    expect(res.body.error).toContain("not configured");
  });

  test("POST synthesize returns 502 on upstream failure", async () => {
    const ttsModule = await import("../services/speech/speech-synthesize-service");
    spyOn(ttsModule, "synthesizeSpeechAudio").mockResolvedValue({
      ok: false,
      error: "Synthesis failed",
      status: 502,
    });

    const res = await requestJson<{ error?: string }>(app, "POST", API_ENDPOINTS.speechSynthesize, {
      text: "Hello",
    });
    expect(res.status).toBe(HTTP_STATUS_BAD_GATEWAY);
    expect(res.body.error).toContain("Synthesis failed");
  });
});
