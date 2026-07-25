import { HTTP_STATUS_NO_CONTENT } from "@bao/shared/constants/http";
import { Elysia } from "elysia";
import { config } from "../config/env";

const getRequestOrigin = (request: Request): string | null =>
  request.headers.get("origin") ?? request.headers.get("Origin");

type HeaderBag = {
  headers: {
    [key: string]: string | number | string[] | undefined;
  };
};

/**
 * Applies Access-Control-Allow-Origin when the request Origin is allow-listed.
 */
const applyAllowedOriginHeader = (set: HeaderBag, request: Request): void => {
  const requestOrigin = getRequestOrigin(request);
  if (!(requestOrigin && config.corsOrigins.includes(requestOrigin))) {
    return;
  }

  set.headers["access-control-allow-origin"] = requestOrigin;
  set.headers["access-control-allow-credentials"] = "true";
  const varyHeader = typeof set.headers.vary === "string" ? set.headers.vary : "";
  if (varyHeader !== "Origin" && varyHeader !== "*") {
    set.headers.vary = varyHeader ? `${varyHeader}, Origin` : "Origin";
  }
};

/**
 * Elysia 2 CORS plugin (replaces @elysiajs/cors which is incompatible with v2).
 */
export const corsPlugin = new Elysia({ name: "cors" })
  .request(({ request, set }) => {
    applyAllowedOriginHeader(set, request);

    if (request.method === "OPTIONS") {
      set.headers["access-control-allow-methods"] = "GET,POST,PUT,PATCH,DELETE,OPTIONS";
      set.headers["access-control-allow-headers"] =
        request.headers.get("access-control-request-headers") ?? "authorization,content-type";
      set.headers["access-control-max-age"] = "86400";
      set.status = HTTP_STATUS_NO_CONTENT;
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": String(set.headers["access-control-allow-origin"] ?? ""),
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          "access-control-allow-headers": String(
            set.headers["access-control-allow-headers"] ?? "authorization,content-type",
          ),
          "access-control-max-age": "86400",
        },
      });
    }
  })
  .afterHandle(({ request, set }) => {
    applyAllowedOriginHeader(set, request);
  });
