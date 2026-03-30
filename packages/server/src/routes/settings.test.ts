import { beforeAll, describe, expect, test } from "bun:test";
import { AI_ROUTING_PURPOSE_IDS } from "@bao/shared";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
const MASKED_KEY_PATTERN = /^\*\*\*[a-zA-Z0-9]{4}$/;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./settings.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.settingsRoutes);
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
    jobTaxonomy?: {
      keywords: Array<{ id: string; label: string; category: string }>;
      studioRules: Array<{ id: string; keyword: string; studioType: string }>;
    };
  }>(app, "GET", "/api/settings");

describe("settings read routes", () => {
  test("GET /api/settings returns settings", async () => {
    const res = await getSettings();
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    if (res.body.geminiApiKey) {
      expect(res.body.geminiApiKey).toMatch(MASKED_KEY_PATTERN);
    }
    expect(Array.isArray(res.body.jobTaxonomy?.keywords)).toBe(true);
    expect(Array.isArray(res.body.jobTaxonomy?.studioRules)).toBe(true);
  });

  test("GET /api/settings/export returns export payload", async () => {
    const res = await requestJson<{
      version: string;
      exportedAt: string;
      profile: unknown;
      settings: unknown;
      resumes: unknown[];
    }>(app, "GET", "/api/settings/export");
    expect(res.status).toBe(200);
    expect(res.body.version).toBe("1.0");
    expect(res.body.exportedAt).toBeDefined();
    expect(Array.isArray(res.body.resumes)).toBe(true);
  });
});

describe("settings write routes", () => {
  test("PUT /api/settings updates", async () => {
    const res = await requestJson<{ success: boolean }>(app, "PUT", "/api/settings", {
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
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updated = await getSettings();
    expect(updated.body.aiRouting?.chat).toEqual({
      provider: "openai",
      model: "gpt-4o-mini",
    });
    expect(updated.body.preferredProvider).toBe("openai");
    expect(updated.body.preferredModel).toBe("gpt-4o-mini");
  });

  test("PUT /api/settings/api-keys updates keys", async () => {
    const res = await requestJson<{ success: boolean }>(app, "PUT", "/api/settings/api-keys", {
      localModelEndpoint: "http://localhost:1234",
      emailTransportPassword: "super-secret-password",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("GET /api/settings exposes email delivery password presence without returning the secret", async () => {
    const res = await getSettings();
    expect(res.status).toBe(200);
    expect(res.body.hasEmailTransportPassword).toBe(true);
    expect(res.body.emailTransportPassword).toBeUndefined();
    expect(res.body.emailTransportSettings?.host).toBe("smtp.example.test");
  });

  test("PUT /api/settings/job-taxonomy persists taxonomy updates outside the settings row", async () => {
    const res = await requestJson<{
      success: boolean;
      jobTaxonomy: {
        keywords: Array<{ id: string; label: string; category: string }>;
        studioRules: Array<{ id: string; keyword: string; studioType: string }>;
      };
    }>(app, "PUT", "/api/settings/job-taxonomy", {
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

    expect(res.status).toBe(200);
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
