import { beforeAll, describe, expect, test } from "bun:test";
import {
  API_ENDPOINT_PREFIX,
  API_ENDPOINTS,
  buildCoverLetterExportEndpoint,
} from "@bao/shared/constants/endpoints";
import { requestJson } from "../test-utils";
import {
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";

let app: { handle: (request: Request) => Response | Promise<Response> };
let createdId: string;
let generatedId: string;

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const seedModule = await import("../db/seed");
  const routesModule = await import("./cover-letter.routes");
  const { Elysia } = await import("elysia");

  initModule.initializeDatabase(dbModule.sqlite);
  seedModule.seedDatabase(dbModule.db);

  app = new Elysia({ prefix: API_ENDPOINT_PREFIX }).use(routesModule.coverLetterRoutes);
});

function registerCreateAndReadTests(): void {
  test("POST cover letters creates cover letter", async () => {
    const res = await requestJson<{ id: string; company: string; position: string }>(
      app,
      "POST",
      API_ENDPOINTS.coverLetters,
      { company: "Test Co", position: "Game Designer" },
    );
    expect(res.status).toBe(HTTP_STATUS_CREATED);
    expect(res.body.company).toBe("Test Co");
    expect(res.body.position).toBe("Game Designer");
    expect(res.body.id).toBeDefined();
    createdId = res.body.id;
  });

  test("GET cover letters returns list", async () => {
    const res = await requestJson<Array<{ id: string }>>(app, "GET", API_ENDPOINTS.coverLetters);
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("GET cover letter detail returns created", async () => {
    const res = await requestJson<{ id: string; company: string }>(
      app,
      "GET",
      `${API_ENDPOINTS.coverLetters}/${createdId}`,
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.id).toBe(createdId);
    expect(res.body.company).toBe("Test Co");
  });

  test("GET cover letter detail returns 404 for missing", async () => {
    const res = await requestJson<{ error: string }>(
      app,
      "GET",
      `${API_ENDPOINTS.coverLetters}/nonexistent-id`,
    );
    expect(res.status).toBe(HTTP_STATUS_NOT_FOUND);
    expect(res.body.error).toBe("Cover letter not found");
  });
}

function registerUpdateAndDeleteTests(): void {
  test("PUT cover letter detail updates", async () => {
    const res = await requestJson<{ position: string }>(
      app,
      "PUT",
      `${API_ENDPOINTS.coverLetters}/${createdId}`,
      { position: "Senior Game Designer" },
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.position).toBe("Senior Game Designer");
  });

  test("DELETE cover letter detail removes", async () => {
    const res = await requestJson<{ success: boolean }>(
      app,
      "DELETE",
      `${API_ENDPOINTS.coverLetters}/${createdId}`,
    );
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.success).toBe(true);
  });
}

function registerDynamicGenerationTests(): void {
  test("POST cover letters generate returns unsaved dynamic content", async () => {
    const res = await requestJson<{
      message: string;
      content: { introduction: string; body: string; conclusion: string };
    }>(app, "POST", API_ENDPOINTS.coverLettersGenerate, {
      company: "Studio Nova",
      position: "Narrative Designer",
      jobInfo: {
        location: "Remote",
        focus: "Co-op action RPG",
      },
      save: false,
    });
    expect(res.status).toBe(HTTP_STATUS_OK);
    expect(res.body.content.introduction.length).toBeGreaterThan(0);
    expect(res.body.content.body.length).toBeGreaterThan(0);
    expect(res.body.content.conclusion.length).toBeGreaterThan(0);
  });

  test("POST cover letters generate persists a saved cover letter", async () => {
    const res = await requestJson<{
      message: string;
      coverLetter: { id: string; company: string; content: Record<string, unknown> };
    }>(app, "POST", API_ENDPOINTS.coverLettersGenerate, {
      company: "Studio Nova",
      position: "Systems Designer",
      save: true,
    });
    expect(res.status).toBe(HTTP_STATUS_CREATED);
    expect(res.body.coverLetter.id).toBeDefined();
    expect(res.body.coverLetter.company).toBe("Studio Nova");
    generatedId = res.body.coverLetter.id;
  });
}

function registerCoverLetterExportTests(): void {
  test("POST cover letter export returns a PDF attachment", async () => {
    const response = await app.handle(
      new Request(`http://localhost${buildCoverLetterExportEndpoint(generatedId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "pdf" }),
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain(
      `cover-letter-${generatedId}.pdf`,
    );
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  test("POST cover letter export returns a DOCX attachment", async () => {
    const response = await app.handle(
      new Request(`http://localhost${buildCoverLetterExportEndpoint(generatedId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ format: "docx" }),
      }),
    );
    expect(response.status).toBe(HTTP_STATUS_OK);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(response.headers.get("content-disposition")).toContain(
      `cover-letter-${generatedId}.docx`,
    );
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });
}

describe("cover-letter routes create/read", () => {
  registerCreateAndReadTests();
});

describe("cover-letter routes update/delete", () => {
  registerUpdateAndDeleteTests();
});

describe("cover-letter routes generation/export", () => {
  registerDynamicGenerationTests();
  registerCoverLetterExportTests();
});
