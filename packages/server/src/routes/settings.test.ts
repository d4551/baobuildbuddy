import { beforeAll, describe, expect, test } from "bun:test";
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
    hasGeminiKey?: boolean;
    geminiApiKey?: string | null;
    hasEmailTransportPassword?: boolean;
    emailTransportPassword?: string | null;
    emailTransportSettings?: { host?: string };
  }>(app, "GET", "/api/settings");

describe("settings read routes", () => {
  test("GET /api/settings returns settings", async () => {
    const res = await getSettings();
    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();
    if (res.body.geminiApiKey) {
      expect(res.body.geminiApiKey).toMatch(MASKED_KEY_PATTERN);
    }
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
});
