import {
  API_ERROR_EMPTY_API_KEY,
  API_ERROR_INVALID_API_KEY,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import { isSetupPreBootstrapEndpoint } from "@bao/shared/constants/endpoints";
import { HTTP_STATUS_UNAUTHORIZED } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { isAuthDisabled } from "../config/env";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";
import { verifyApiKey } from "../utils/crypto";

type AuthFailure = { error: string; status: typeof HTTP_STATUS_UNAUTHORIZED };

/**
 * Query parameter accepted as an alternative credential channel for clients
 * that cannot set headers (browser WebSocket, <img> screenshot loads).
 */
export const AUTH_QUERY_TOKEN_PARAM = "token";

type CredentialRead =
  | { kind: "missing" }
  | { kind: "wrong-scheme" }
  | { kind: "empty" }
  | { kind: "ok"; token: string };

function readBearerHeader(request: Request): CredentialRead {
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

function readQueryToken(request: Request): CredentialRead {
  if (!URL.canParse(request.url)) {
    return { kind: "missing" };
  }
  const raw = new URL(request.url).searchParams.get(AUTH_QUERY_TOKEN_PARAM);
  if (raw === null) {
    return { kind: "missing" };
  }
  const token = raw.trim();
  return token.length > 0 ? { kind: "ok", token } : { kind: "empty" };
}

function readCredential(request: Request): CredentialRead {
  const bearer = readBearerHeader(request);
  if (bearer.kind !== "missing") {
    return bearer;
  }
  return readQueryToken(request);
}

/**
 * Reads the persisted auth row for the default profile.
 */
async function readAuthRow(): Promise<typeof auth.$inferSelect | undefined> {
  const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
  return rows[0];
}

/**
 * Reports whether the instance has been bootstrapped with an API key hash.
 *
 * Bootstrapped state is read from the database rather than trusted from the
 * request, so a caller cannot claim first-run status to skip authentication.
 */
async function hasProvisionedApiKey(): Promise<boolean> {
  const row = await readAuthRow();
  return Boolean(row?.apiKeyHash);
}

/**
 * Reports whether a request targets a first-run setup endpoint.
 *
 * @param request Incoming request.
 * @returns True when the method/path pair is on the pre-bootstrap allowlist.
 */
function isSetupPreBootstrapRequest(request: Request): boolean {
  if (!URL.canParse(request.url)) {
    return false;
  }
  return isSetupPreBootstrapEndpoint(request.method, new URL(request.url).pathname);
}

/**
 * Validates an API key credential against the persisted SHA-256 hash.
 *
 * The credential is read from the `Authorization: Bearer` header first; when
 * the header is absent, the `?token=` query parameter is used instead so
 * browser WebSocket handshakes and <img> screenshot loads can authenticate.
 *
 * The API key is hashed at creation and only the hash is stored in the
 * database. Verification re-hashes the provided bearer token and
 * compares it against the stored hash using `timingSafeEqual`.
 *
 * Keys are checked for revocation and expiry before hash comparison.
 *
 * One exception exists: while the instance holds no API key hash, the endpoints
 * in `SETUP_PREBOOTSTRAP_ENDPOINTS` answer without a credential so the first-run
 * setup wizard can test provider connectivity. Bootstrapped state is read from
 * the database, so the grace closes as soon as a key is provisioned.
 */
export async function authenticateApiKey(request: Request): Promise<AuthFailure | null> {
  if (isAuthDisabled()) {
    return null;
  }

  // First-run grace: the setup wizard runs before any API key exists, so its
  // allowlisted endpoints must answer while the instance is un-bootstrapped.
  // The grace is checked against the database and closes the moment a hash is
  // stored, so it never widens access on a configured instance.
  if (isSetupPreBootstrapRequest(request) && !(await hasProvisionedApiKey())) {
    return null;
  }

  const parsed = readCredential(request);
  switch (parsed.kind) {
    case "missing":
    case "wrong-scheme":
      return { error: API_ERROR_MISSING_AUTH_HEADER, status: HTTP_STATUS_UNAUTHORIZED };
    case "empty":
      return { error: API_ERROR_EMPTY_API_KEY, status: HTTP_STATUS_UNAUTHORIZED };
    case "ok":
      break;
    default: {
      const _exhaustive: never = parsed;
      return _exhaustive;
    }
  }

  const row = await readAuthRow();
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
