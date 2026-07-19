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
import { verifyApiKey } from "../utils/crypto";

type AuthFailure = { error: string; status: typeof HTTP_STATUS_UNAUTHORIZED };

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
 * Validates a bearer API key against the persisted SHA-256 hash.
 *
 * The API key is hashed at creation and only the hash is stored in the
 * database. Verification re-hashes the provided bearer token and
 * compares it against the stored hash using constant-time comparison
 * via the hash equality check.
 *
 * Keys are checked for revocation and expiry before hash comparison.
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
  const row = rows[0];
  const storedHash = row?.apiKeyHash;
  if (!storedHash) {
    return { error: API_ERROR_INVALID_API_KEY, status: HTTP_STATUS_UNAUTHORIZED };
  }

  if (row.apiKeyRevokedAt !== null) {
    return { error: API_ERROR_INVALID_API_KEY, status: HTTP_STATUS_UNAUTHORIZED };
  }

  if (row.apiKeyExpiresAt !== null) {
    const expiresAt = Date.parse(row.apiKeyExpiresAt);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return { error: API_ERROR_INVALID_API_KEY, status: HTTP_STATUS_UNAUTHORIZED };
    }
  }

  if (!verifyApiKey(parsed.token, storedHash)) {
    return { error: API_ERROR_INVALID_API_KEY, status: HTTP_STATUS_UNAUTHORIZED };
  }

  return null;
}

export const authGuard = new Elysia({ name: "auth-guard" })
  .beforeHandle(async ({ request, status }) => {
    const failure = await authenticateApiKey(request);
    if (failure) {
      return status(failure.status, { error: failure.error });
    }
  })
  .as("global");
