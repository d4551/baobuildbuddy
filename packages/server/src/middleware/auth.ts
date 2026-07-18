import { timingSafeEqual } from "node:crypto";
import {
  API_ERROR_EMPTY_API_KEY,
  API_ERROR_INVALID_API_KEY,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { isAuthDisabled } from "../config/env";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";

function safeTimingEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const aBuf = Buffer.from(a, "utf8");
  const bBuf = Buffer.from(b, "utf8");
  return timingSafeEqual(aBuf, bBuf);
}

type AuthFailure = { error: string; status: typeof HTTP_STATUS_UNAUTHORIZED };

/**
 * Reads the `Authorization` header from a Request and reports the bearer
 * parse status without raising exceptions. Distinguishes "no header"
 * from "wrong scheme" from "empty bearer token" so the failure envelope
 * can carry the right error code.
 */
function readBearerHeader(
  request: Request,
):
  | { kind: "missing" }
  | { kind: "wrong-scheme" }
  | { kind: "empty" }
  | { kind: "ok"; token: string } {
  const raw = request.headers.get("authorization");
  if (raw === null) {
    return { kind: "missing" };
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith("Bearer")) {
    return { kind: "wrong-scheme" };
  }
  if (trimmed === "Bearer") {
    return { kind: "empty" };
  }
  if (!trimmed.startsWith("Bearer ")) {
    return { kind: "wrong-scheme" };
  }
  const token = trimmed.slice("Bearer ".length).trim();
  return token.length > 0 ? { kind: "ok", token } : { kind: "empty" };
}

/**
 * Validates Bearer API key against the persisted profile key.
 *
 * Default deny: missing/empty/mismatched key and missing configured
 * profile key all return unauthorized. Returns `null` only when the
 * request is authenticated or auth is explicitly disabled.
 *
 * @param request Incoming Elysia request (HTTP or WebSocket upgrade).
 * @returns Unauthorized envelope or null on success.
 */
export async function authenticateApiKey(request: Request): Promise<AuthFailure | null> {
  if (isAuthDisabled()) {
    return null;
  }

  const parsed = readBearerHeader(request);
  switch (parsed.kind) {
    case "missing":
    case "wrong-scheme":
      return { error: API_ERROR_MISSING_AUTH_HEADER, status: HTTP_STATUS_UNAUTHORIZED };
    case "empty":
      return { error: API_ERROR_EMPTY_API_KEY, status: HTTP_STATUS_UNAUTHORIZED };
    case "ok":
      break;
  }

  const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
  const storedKey = rows[0]?.apiKey;
  if (!(storedKey && safeTimingEqual(storedKey, parsed.token))) {
    return { error: API_ERROR_INVALID_API_KEY, status: HTTP_STATUS_UNAUTHORIZED };
  }

  return null;
}

/**
 * Elysia plugin that validates Bearer API key for protected HTTP routes.
 * `.as("global")` lifts the hook so sibling route plugins registered after
 * this guard inherit default-deny auth. Routes mounted before the guard
 * (auth bootstrap) remain public. Skipped only when auth is explicitly
 * disabled via config.
 */
export const authGuard = new Elysia({ name: "auth-guard" })
  .beforeHandle(async ({ request, status }) => {
    const failure = await authenticateApiKey(request);
    if (failure) {
      return status(failure.status, { error: failure.error });
    }
  })
  .as("global");
