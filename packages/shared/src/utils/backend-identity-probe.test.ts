import { describe, expect, test } from "bun:test";
import { TRACE_ID_HEADER } from "../constants/runtime";
import {
  BACKEND_PROBE_NO_RESPONSE_STATUS,
  BACKEND_PROBE_PATH,
  classifyBackendProbe,
  describeForeignBackend,
  toBackendProbeUrl,
} from "./backend-identity-probe";

const TRACE_ID = "f9f6d620c2c71e4db355ddde943b45a4";

const OUR_HEALTH_BODY = JSON.stringify({
  status: "healthy",
  timestamp: "2026-07-27T02:10:59.953Z",
  database: "ok",
  uptime: 396.311752084,
});

/** Body the foreign server on the clashing port actually returned. */
const FOREIGN_BODY = JSON.stringify({ success: false, error: "NOT_FOUND" });

describe("toBackendProbeUrl", () => {
  test("appends the health path to a bare API base", () => {
    expect(toBackendProbeUrl("http://127.0.0.1:3400")).toBe(
      `http://127.0.0.1:3400${BACKEND_PROBE_PATH}`,
    );
  });

  test("does not double the separator when the base has a trailing slash", () => {
    expect(toBackendProbeUrl("http://127.0.0.1:3400/")).toBe(
      `http://127.0.0.1:3400${BACKEND_PROBE_PATH}`,
    );
  });
});

describe("classifyBackendProbe ownership", () => {
  test("accepts our own health response", () => {
    expect(
      classifyBackendProbe({ status: 200, traceIdHeader: TRACE_ID, bodyText: OUR_HEALTH_BODY }),
    ).toEqual({ kind: "ours" });
  });

  test("accepts a degraded-but-ours health response", () => {
    expect(
      classifyBackendProbe({
        status: 200,
        traceIdHeader: TRACE_ID,
        bodyText: JSON.stringify({
          status: "degraded",
          timestamp: "2026-07-27T02:10:59.953Z",
          database: "error",
          uptime: 1,
        }),
      }),
    ).toEqual({ kind: "ours" });
  });
});

describe("classifyBackendProbe rejection", () => {
  test("classifies a missing response as unreachable so the caller retries", () => {
    const verdict = classifyBackendProbe({
      status: BACKEND_PROBE_NO_RESPONSE_STATUS,
      traceIdHeader: null,
      bodyText: "",
    });
    expect(verdict.kind).toBe("unreachable");
  });

  test("rejects the foreign server that held the clashing port", () => {
    const verdict = classifyBackendProbe({
      status: 500,
      traceIdHeader: null,
      bodyText: FOREIGN_BODY,
    });
    expect(verdict.kind).toBe("foreign");
    expect(verdict.kind === "foreign" ? verdict.reason : "").toContain(TRACE_ID_HEADER);
    expect(verdict.kind === "foreign" ? verdict.reason : "").toContain("NOT_FOUND");
  });

  test("rejects a responder that stamps the trace header but not the health contract", () => {
    const verdict = classifyBackendProbe({
      status: 200,
      traceIdHeader: TRACE_ID,
      bodyText: JSON.stringify({ status: "healthy" }),
    });
    expect(verdict.kind).toBe("foreign");
    expect(verdict.kind === "foreign" ? verdict.reason : "").toContain("health contract");
  });

  test("rejects a health payload whose uptime is not numeric", () => {
    const verdict = classifyBackendProbe({
      status: 200,
      traceIdHeader: TRACE_ID,
      bodyText: JSON.stringify({
        status: "healthy",
        timestamp: "2026-07-27T02:10:59.953Z",
        database: "ok",
        uptime: "396",
      }),
    });
    expect(verdict.kind).toBe("foreign");
  });

  test("rejects an empty trace header as absent", () => {
    const verdict = classifyBackendProbe({
      status: 200,
      traceIdHeader: "",
      bodyText: OUR_HEALTH_BODY,
    });
    expect(verdict.kind).toBe("foreign");
  });

  test("rejects a non-JSON body without throwing", () => {
    const verdict = classifyBackendProbe({
      status: 200,
      traceIdHeader: TRACE_ID,
      bodyText: "<!doctype html><title>somebody else</title>",
    });
    expect(verdict.kind).toBe("foreign");
    expect(verdict.kind === "foreign" ? verdict.reason : "").toContain("somebody else");
  });

  test("rejects a truncated JSON body without throwing", () => {
    const verdict = classifyBackendProbe({
      status: 200,
      traceIdHeader: TRACE_ID,
      bodyText: '{"status":"healthy",',
    });
    expect(verdict.kind).toBe("foreign");
  });
});

describe("describeForeignBackend", () => {
  test("names the clashing base, the reason, and the port-override escape hatch", () => {
    const message = describeForeignBackend("http://127.0.0.1:3000", "missing header");
    expect(message).toContain("http://127.0.0.1:3000");
    expect(message).toContain("missing header");
    expect(message).toContain("--server-port");
    expect(message).toContain("--client-port");
  });
});
