import { beforeAll, describe, expect, test } from "bun:test";
import { API_ENDPOINTS } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_OK } from "@bao/shared/constants/http";
import { TRACE_ID_HEADER } from "@bao/shared/constants/runtime";
import { healthResponseSchema } from "@bao/shared/schemas/health.schema";
import { classifyBackendProbe } from "@bao/shared/utils/backend-identity-probe";

/**
 * Drift guard for the two facts the dev-stack identity probe relies on.
 *
 * `scripts/dev-stack-backend-probe.ts` decides whether the process answering the
 * advertised API base really is this server by checking the `x-trace-id`
 * response header and the health payload contract. If either changes, the probe
 * starts rejecting our own backend and `bun run dev` refuses to start — so both
 * are asserted against the live app, beside the code that owns them, instead of
 * being trusted to stay in sync.
 *
 * No database fixture is needed: the health handler's only query is a read-only
 * `SELECT 1` probe, and the assertions here cover response shape and headers.
 */

let app: { handle: (request: Request) => Response | Promise<Response> };

beforeAll(async () => {
  const dbModule = await import("../db/client");
  const initModule = await import("../db/init");
  const appModule = await import("../app");

  initModule.initializeDatabase(dbModule.sqlite);
  app = appModule.app;
});

const requestHealth = async (): Promise<Response> =>
  app.handle(new Request(`http://localhost${API_ENDPOINTS.health}`));

describe("health endpoint contract", () => {
  test("serves a payload matching the shared health schema", async () => {
    const response = await requestHealth();
    expect(response.status).toBe(HTTP_STATUS_OK);

    const parsed = healthResponseSchema.safeParse(await response.json());
    expect(parsed.success).toBe(true);
  });

  test("stamps the trace-id response header the probe keys on", async () => {
    const response = await requestHealth();
    const traceId = response.headers.get(TRACE_ID_HEADER);
    expect(typeof traceId).toBe("string");
    expect((traceId ?? "").length).toBeGreaterThan(0);
  });

  test("is recognised as our own backend by the dev-stack identity probe", async () => {
    const response = await requestHealth();
    const verdict = classifyBackendProbe({
      status: response.status,
      traceIdHeader: response.headers.get(TRACE_ID_HEADER),
      bodyText: await response.text(),
    });
    expect(verdict).toEqual({ kind: "ours" });
  });
});
