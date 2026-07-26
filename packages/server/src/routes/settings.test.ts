import { beforeAll, describe, expect, test } from "bun:test";
import { API_ENDPOINT_PREFIX, API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK, HTTP_STATUS_UNPROCESSABLE_ENTITY } from "@bao/shared/constants/http";
import { AI_ROUTING_PURPOSE_IDS } from "@bao/shared/types/ai";
import {
  DEFAULT_AUTOMATION_SETTINGS,
  DEFAULT_SETTINGS_ID,
} from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { settings } from "../db/schema/settings";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
const MASKED_KEY_PATTERN = /^\*\*\*[a-zA-Z0-9]{4}$/;
const LEGACY_AUTOMATION_TIMEOUT_SECONDS = 30;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./settings.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.settingsRoutes);
});

const getSettings = () =>
  requestJson<{
    id: string;
    aiRouting?: Record<string, { provider: string; model?: string }>;
    preferredProvider?: string;
    preferredModel?: string | null;
    hasGeminiKey?: boolean;
    geminiApiKey?: string | null;
    hasEmailTransportPassword?: boolean;
    emailTransportPassword?: string | null;
    emailTransportSettings?: { host?: string };
    automationSettings?: { defaultTimeout: number };
    jobTaxonomy?: {
      keywords: Array<{ id: string; label: string; category: string }>;
      studioRules: Array<{ id: string; keyword: string; studioType: string }>;
    };
  }>(app, "GET", API_ENDPOINTS.settings);

const persistLegacyAutomationTimeout = () =>
  db
    .update(settings)
    .set({
      automationSettings: {
        ...DEFAULT_AUTOMATION_SETTINGS,
        defaultTimeout: LEGACY_AUTOMATION_TIMEOUT_SECONDS,
      },
    })
    .where(eq(settings.id, DEFAULT_SETTINGS_ID));

describe("settings read routes", () => {
  // Regression: the settings response schema is enforced at runtime, so a
  // shipped default that violates it (e.g. an empty hitmarkerDefaultLocation
  // against a minLength constraint) fails the route with 422 instead of 200.
  test("GET settings satisfies its declared response contract", async () => {
    const res = await getSettings();
    expect(res.status).not.toBe(HTTP_STATUS_UNPROCESSABLE_ENTITY);
    expect(res.status).toBe(HTTP_STATUS_OK);
  });

  test("GET settings returns settings", async () => {
    const res = await getSettings();
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.id).toBeDefined();
    if (res.body.geminiApiKey) {
      expect(res.body.geminiApiKey).toMatch(MASKED_KEY_PATTERN);
    }
    expect(Array.isArray(res.body.jobTaxonomy?.keywords)).toBe(true);
    expect(Array.isArray(res.body.jobTaxonomy?.studioRules)).toBe(true);
  });

  test("GET settings persists normalized legacy automation timeout", async () => {
    await persistLegacyAutomationTimeout();

    const res = await getSettings();
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.automationSettings?.defaultTimeout).toBe(
      DEFAULT_AUTOMATION_SETTINGS.defaultTimeout,
    );

    const rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
    expect(rows[0]?.automationSettings?.defaultTimeout).toBe(
      DEFAULT_AUTOMATION_SETTINGS.defaultTimeout,
    );
  });

  test("automation settings loader persists normalized legacy timeout", async () => {
    await persistLegacyAutomationTimeout();

    const { loadAutomationSettings } = await import(
      "../services/automation/automation-settings-support"
    );
    const automationSettings = await loadAutomationSettings();
    expect(automationSettings.defaultTimeout).toBe(DEFAULT_AUTOMATION_SETTINGS.defaultTimeout);

    const rows = await db.select().from(settings).where(eq(settings.id, DEFAULT_SETTINGS_ID));
    expect(rows[0]?.automationSettings?.defaultTimeout).toBe(
      DEFAULT_AUTOMATION_SETTINGS.defaultTimeout,
    );
  });

  test("GET settings export returns export payload", async () => {
    const res = await requestJson<{
      version: string;
      exportedAt: string;
      profile: unknown;
      settings: unknown;
      resumes: unknown[];
    }>(app, "GET", API_ENDPOINTS.settingsExport);
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.version).toBe("1.0");
    expect(res.body.exportedAt).toBeDefined();
    expect(Array.isArray(res.body.resumes)).toBe(true);
  });
});

describe("settings write routes - preferences", () => {
  test("PUT settings updates", async () => {
    const res = await requestJson<{ success: boolean }>(app, "PUT", API_ENDPOINTS.settings, {
      theme: "bao-dark",
      aiRouting: Object.fromEntries(
        AI_ROUTING_PURPOSE_IDS.map((purpose) => [
          purpose,
          {
            provider: purpose === "chat" ? "openai" : "local",
            ...(purpose === "chat" ? { model: "gpt-4o-mini" } : {}),
          },
        ]),
      ),
      emailTransportSettings: {
        host: "smtp.example.test",
        port: 587,
        security: "starttls",
        username: "mailer@example.test",
        fromEmail: "mailer@example.test",
        fromName: "Bao Mailer",
        authMethod: "plain",
        connectionTimeoutSeconds: 20,
      },
    });
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.success).toBe(true);

    const updated = await getSettings();
    expect(updated.body.aiRouting?.chat).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
    });
    expect(updated.body.preferredProvider).toBe("openai");
    expect(updated.body.preferredModel).toBe("gpt-4o-mini");
  });
});

describe("settings write routes - api keys", () => {
  test("PUT settings api keys updates keys", async () => {
    const res = await requestJson<{ success: boolean }>(app, "PUT", API_ENDPOINTS.settingsApiKeys, {
      localModelEndpoint: "http://localhost:1234",
      emailTransportPassword: "super-secret-password",
    });
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.success).toBe(true);
  });

  test("GET settings exposes email delivery password presence without returning the secret", async () => {
    const res = await getSettings();
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.hasEmailTransportPassword).toBe(true);
    expect(res.body.emailTransportPassword).toBeUndefined();
    expect(res.body.emailTransportSettings?.host).toBe("smtp.example.test");
  });
});

describe("settings write routes - taxonomy", () => {
  test("PUT settings job taxonomy persists taxonomy updates outside the settings row", async () => {
    const res = await requestJson<{
      success: boolean;
      jobTaxonomy: {
        keywords: Array<{ id: string; label: string; category: string }>;
        studioRules: Array<{ id: string; keyword: string; studioType: string }>;
      };
    }>(app, "PUT", API_ENDPOINTS.settingsJobTaxonomy, {
      keywords: [
        {
          id: "role:technical-sound-designer",
          category: "role",
          label: "Technical Sound Designer",
          synonyms: ["Audio Tools Designer"],
          sortOrder: 0,
          enabled: true,
        },
      ],
      studioRules: [
        {
          id: "Platform:super-platform",
          studioType: "Platform",
          keyword: "super platform",
          sortOrder: 0,
          enabled: true,
        },
      ],
    });

    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.success).toBe(true);
    expect(res.body.jobTaxonomy.keywords[0]?.label).toBe("Technical Sound Designer");

    const updated = await getSettings();
    expect(updated.body.jobTaxonomy?.keywords).toMatchObject([
      {
        id: "role:technical-sound-designer",
        category: "role",
        label: "Technical Sound Designer",
      },
    ]);
    expect(updated.body.jobTaxonomy?.studioRules).toMatchObject([
      {
        id: "Platform:super-platform",
        keyword: "super platform",
        studioType: "Platform",
      },
    ]);
  });
});
