import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { requestJson } from "../test-utils";

let app: { handle: (request: Request) => Response | Promise<Response> };
let mappingId: string;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./skill-mapping.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  await seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: "/api" }).use(routesModule.skillMappingRoutes);
});

afterAll(() => {});

describe("skill-mapping routes", () => {
  test("GET /api/skills/mappings returns list", async () => {
    const res = await requestJson<unknown[]>(app, "GET", "/api/skills/mappings");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("POST /api/skills/mappings creates mapping", async () => {
    const res = await requestJson<{
      id: string;
      gameExpression: string;
      transferableSkill: string;
    }>(app, "POST", "/api/skills/mappings", {
      gameExpression: "Optimized rendering pipeline",
      transferableSkill: "Performance optimization",
      category: "technical",
    });
    expect(res.status).toBe(201);
    expect(res.body.gameExpression).toBe("Optimized rendering pipeline");
    expect(res.body.transferableSkill).toBe("Performance optimization");
    expect(res.body.id).toBeDefined();
    mappingId = res.body.id;
  });

  test("GET /api/skills/mappings?category=technical filters", async () => {
    const res = await requestJson<unknown[]>(app, "GET", "/api/skills/mappings?category=technical");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("PUT /api/skills/mappings/:id updates", async () => {
    const res = await requestJson<{ transferableSkill: string }>(
      app,
      "PUT",
      `/api/skills/mappings/${mappingId}`,
      { transferableSkill: "System performance tuning" },
    );
    expect(res.status).toBe(200);
    expect(res.body.transferableSkill).toBe("System performance tuning");
  });

  test("DELETE /api/skills/mappings/:id removes", async () => {
    const res = await requestJson<{ message: string; id: string }>(
      app,
      "DELETE",
      `/api/skills/mappings/${mappingId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Skill mapping deleted");
    expect(res.body.id).toBe(mappingId);
  });
});
