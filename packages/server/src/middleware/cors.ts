import { Elysia } from "elysia";
import { config } from "../config/env";

const getRequestOrigin = (request: Request): string | null =>
  request.headers.get("origin") ?? request.headers.get("Origin");

/**
 * Applies Access-Control-Allow-Origin when the request Origin is allow-listed.
 */
const applyAllowedOriginHeader = (
  headers: Record<string, string | number>,
  request: Request,
): void => {
  const requestOrigin = getRequestOrigin(request);
  if (!(requestOrigin && config.corsOrigins.includes(requestOrigin))) {
    return;
  }

  headers["access-control-allow-origin"] = requestOrigin;
  headers["access-control-allow-credentials"] = "true";
  const varyHeader = typeof headers.vary === "string" ? headers.vary : "";
  if (varyHeader !== "Origin" && varyHeader !== "*") {
    headers.vary = varyHeader ? `${varyHeader}, Origin` : "Origin";
  }
};

/**
 * Elysia 2 CORS plugin (replaces @elysiajs/cors which is incompatible with v2).
 */
export const corsPlugin = new Elysia({ name: "cors" })
  .request(({ request, set }) => {
    applyAllowedOriginHeader(set.headers, request);

    if (request.method === "OPTIONS") {
      set.headers["access-control-allow-methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
      set.headers["access-control-allow-headers"] =
        request.headers.get("access-control-request-headers") ??
        "authorization,content-type";
      set.headers["access-control-max-age"] = "86400";
      set.status = 204;
      return new Response(null, { status: 204, headers: set.headers as HeadersInit });
    }
  })
  .afterHandle(({ request, set }) => {
    applyAllowedOriginHeader(set.headers, request);
  });
