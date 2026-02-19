import {
  AI_PROVIDER_DEFAULT_ORDER,
  LOCAL_AI_DEFAULT_ENDPOINT,
  LOCAL_AI_DEFAULT_MODEL,
} from "@navi/shared";
import { eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { DATA_EXPORT_VERSION } from "../services/data-service";

const validProviders = ["gemini", "openai", "claude", "local", "huggingface"] as const;
const SETTINGS_RATE_LIMIT_DURATION_MS = 60_000;
const SETTINGS_RATE_LIMIT_MAX_REQUESTS = 10;
const KEY_MASK_VISIBLE_CHARS = 4;
const MODEL_MAX_LENGTH = 200;
const LANGUAGE_MAX_LENGTH = 10;
const API_KEY_MAX_LENGTH = 500;
const CLAUDE_TEST_MAX_TOKENS = 1;
const CLAUDE_RATE_LIMIT_STATUS = 429;
const ANTHROPIC_API_VERSION = "2023-06-01";
const CLAUDE_TEST_MODEL = "claude-sonnet-4-5-20250929";

export const settingsRoutes = new Elysia({ prefix: "/settings" })
  .use(
    rateLimit({
      scoping: "scoped",
      duration: SETTINGS_RATE_LIMIT_DURATION_MS,
      max: SETTINGS_RATE_LIMIT_MAX_REQUESTS,
    }),
  )
  .get("/", async () => {
    const rows = await db.select().from(settings).where(eq(settings.id, "default"));
    if (rows.length === 0) {
      const defaults = {
        id: "default",
        preferredProvider: AI_PROVIDER_DEFAULT_ORDER[0],
        preferredModel: LOCAL_AI_DEFAULT_MODEL,
        localModelEndpoint: LOCAL_AI_DEFAULT_ENDPOINT,
        localModelName: LOCAL_AI_DEFAULT_MODEL,
        theme: "bao-light",
        language: "en",
        notifications: {
          achievements: true,
          dailyChallenges: true,
          levelUp: true,
          jobAlerts: true,
        },
      };
      await db.insert(settings).values(defaults);
      return defaults;
    }
    // Mask API keys for the response (return only last 4 chars)
    const row = rows[0];
    return {
      ...row,
      geminiApiKey: row.geminiApiKey ? `***${row.geminiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
      openaiApiKey: row.openaiApiKey ? `***${row.openaiApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
      claudeApiKey: row.claudeApiKey ? `***${row.claudeApiKey.slice(-KEY_MASK_VISIBLE_CHARS)}` : null,
      huggingfaceToken: row.huggingfaceToken
        ? `***${row.huggingfaceToken.slice(-KEY_MASK_VISIBLE_CHARS)}`
        : null,
      hasGeminiKey: !!row.geminiApiKey,
      hasOpenaiKey: !!row.openaiApiKey,
      hasClaudeKey: !!row.claudeApiKey,
      hasHuggingfaceToken: !!row.huggingfaceToken,
      hasLocalKey: true,
    };
  })
  .put(
    "/",
    async ({ body }) => {
      const existing = await db.select().from(settings).where(eq(settings.id, "default"));
      if (existing.length === 0) {
        await db.insert(settings).values({ id: "default", ...body });
      } else {
        await db
          .update(settings)
          .set({ ...body, updatedAt: new Date().toISOString() })
          .where(eq(settings.id, "default"));
      }
      return { success: true };
    },
    {
      body: t.Object({
        preferredProvider: t.Optional(t.Union(validProviders.map((p) => t.Literal(p)))),
        preferredModel: t.Optional(t.String({ maxLength: MODEL_MAX_LENGTH })),
        theme: t.Optional(t.Union([t.Literal("bao-light"), t.Literal("bao-dark")])),
        language: t.Optional(t.String({ maxLength: LANGUAGE_MAX_LENGTH })),
        notifications: t.Optional(
          t.Object({
            achievements: t.Optional(t.Boolean()),
            dailyChallenges: t.Optional(t.Boolean()),
            levelUp: t.Optional(t.Boolean()),
            jobAlerts: t.Optional(t.Boolean()),
          }),
        ),
      }),
    },
  )
  .put(
    "/api-keys",
    async ({ body }) => {
      const update: Record<string, unknown> = {};
      if (body.geminiApiKey !== undefined) update.geminiApiKey = body.geminiApiKey;
      if (body.openaiApiKey !== undefined) update.openaiApiKey = body.openaiApiKey;
      if (body.claudeApiKey !== undefined) update.claudeApiKey = body.claudeApiKey;
      if (body.huggingfaceToken !== undefined) update.huggingfaceToken = body.huggingfaceToken;
      if (body.localModelEndpoint !== undefined)
        update.localModelEndpoint = body.localModelEndpoint;
      if (body.localModelName !== undefined) update.localModelName = body.localModelName;
      update.updatedAt = new Date().toISOString();

      const existing = await db.select().from(settings).where(eq(settings.id, "default"));
      if (existing.length === 0) {
        await db.insert(settings).values({ id: "default", ...update });
      } else {
        await db.update(settings).set(update).where(eq(settings.id, "default"));
      }
      return { success: true };
    },
    {
      body: t.Object({
        geminiApiKey: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        openaiApiKey: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        claudeApiKey: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        huggingfaceToken: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        localModelEndpoint: t.Optional(t.String({ maxLength: API_KEY_MAX_LENGTH })),
        localModelName: t.Optional(t.String({ maxLength: MODEL_MAX_LENGTH })),
      }),
    },
  )
  .post(
    "/test-api-key",
    async ({ body }) => {
      const { provider, key } = body;
      try {
        if (provider === "gemini") {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
          );
          return { valid: res.ok, provider };
        }
        if (provider === "openai") {
          const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${key}` },
          });
          return { valid: res.ok, provider };
        }
        if (provider === "claude") {
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": key,
              "anthropic-version": ANTHROPIC_API_VERSION,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: CLAUDE_TEST_MODEL,
              max_tokens: CLAUDE_TEST_MAX_TOKENS,
              messages: [{ role: "user", content: "hi" }],
            }),
          });
          return { valid: res.ok || res.status === CLAUDE_RATE_LIMIT_STATUS, provider };
        }
        if (provider === "local") {
          const endpoint = key || LOCAL_AI_DEFAULT_ENDPOINT;
          const res = await fetch(`${endpoint}/models`).catch(() => null);
          return { valid: !!res?.ok, provider };
        }
        if (provider === "huggingface") {
          const res = await fetch("https://huggingface.co/api/whoami-v2", {
            headers: { Authorization: `Bearer ${key}` },
          });
          return { valid: res.ok, provider };
        }
        return { valid: false, provider, error: "Unknown provider" };
      } catch {
        return { valid: false, provider, error: "Connection failed" };
      }
    },
    {
      body: t.Object({
        provider: t.Union(validProviders.map((p) => t.Literal(p))),
        key: t.String({ maxLength: API_KEY_MAX_LENGTH }),
      }),
    },
  )
  .get("/export", async () => {
    const { dataService } = await import("../services/data-service");
    return dataService.exportAll();
  })
  .post(
    "/import",
    async ({ body }) => {
      const { dataService } = await import("../services/data-service");
      const payload = {
        version: body.version,
        exportedAt: body.exportedAt,
        profile: body.profile,
        settings: body.settings,
        resumes: body.resumes,
        coverLetters: body.coverLetters,
        portfolio: body.portfolio,
        portfolioProjects: body.portfolioProjects,
        interviewSessions: body.interviewSessions,
        gamification: body.gamification,
        skillMappings: body.skillMappings,
        savedJobs: body.savedJobs,
        applications: body.applications,
        chatHistory: body.chatHistory,
      };
      return dataService.importAll(payload);
    },
    {
      body: t.Object({
        version: t.Literal(DATA_EXPORT_VERSION),
        exportedAt: t.String(),
        profile: t.Any(),
        settings: t.Any(),
        resumes: t.Array(t.Any()),
        coverLetters: t.Array(t.Any()),
        portfolio: t.Any(),
        portfolioProjects: t.Array(t.Any()),
        interviewSessions: t.Array(t.Any()),
        gamification: t.Any(),
        skillMappings: t.Array(t.Any()),
        savedJobs: t.Array(t.Any()),
        applications: t.Array(t.Any()),
        chatHistory: t.Array(t.Any()),
      }),
    },
  );
