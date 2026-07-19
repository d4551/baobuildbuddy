import { timingSafeEqual } from "node:crypto";
import {
  API_ERROR_AUTH_SETUP_TOKEN_INVALID,
  API_ERROR_AUTH_SETUP_TOKEN_REQUIRED,
  API_ERROR_AUTH_SETUP_TOKEN_UNAVAILABLE,
  API_ERROR_MISSING_AUTH_HEADER,
} from "@bao/shared/constants/api-errors";
import {
  API_MESSAGE_API_KEY_ALREADY_CONFIGURED,
  API_MESSAGE_AUTH_DISABLED,
  API_MESSAGE_SAVE_API_KEY_ONCE,
} from "@bao/shared/constants/api-messages";
import {
  AUTH_KEY_PREFIX,
  AUTH_KEY_RANDOM_BYTES,
  AUTH_SETUP_TOKEN_HEADER,
} from "@bao/shared/constants/auth";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
import {
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_FORBIDDEN,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_OK,
} from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { config } from "../config/env";
import {
  RATE_LIMIT_AUTH_BOOTSTRAP_DURATION_MS,
  RATE_LIMIT_AUTH_BOOTSTRAP_MAX_REQUESTS,
} from "../config/rate-limit";
import { db } from "../db/client";
import { auditLog } from "../db/schema/audit-log";
import { auth } from "../db/schema/auth";
import { hashApiKey, verifyApiKey } from "../utils/crypto";
import { rateLimit } from "../utils/rate-limit";
import { resolveRateLimitClientKey } from "../utils/request";
import {
  authBootstrapBody,
  authConfiguredResponses,
  authInitResponses,
  authStatusResponses,
} from "./auth-route-contracts";

const BASE64URL_PADDING_PATTERN = /[=]+$/u;

const encodeBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/gu, "-")
    .replace(/\//gu, "_")
    .replace(BASE64URL_PADDING_PATTERN, "");

const resolveSetupToken = (
  request: Request,
  body: { readonly setupToken?: string },
): string | null => {
  const bodyToken = body.setupToken?.trim();
  if (bodyToken && bodyToken.length > 0) {
    return bodyToken;
  }

  const headerToken = request.headers.get(AUTH_SETUP_TOKEN_HEADER)?.trim();
  return headerToken && headerToken.length > 0 ? headerToken : null;
};

function generateApiKey(): string {
  const bytes = new Uint8Array(AUTH_KEY_RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  return `${AUTH_KEY_PREFIX}${encodeBase64Url(bytes)}`;
}

async function insertAuditLog(
  event: string,
  actor: string,
  detail: string,
  ip?: string,
): Promise<void> {
  await db.insert(auditLog).values({
    event,
    actor,
    detail,
    ip: ip ?? null,
  });
}

export const authRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.authBase),
})
  .get(
    toApiChildPath(API_ENDPOINTS.authBase, API_ENDPOINTS.authStatus),
    {
      // no inline detail for rotate,revoke routes
      response: authStatusResponses,
    },
    async ({ status }) => {
      if (config.disableAuth) {
        return status(HTTP_STATUS_OK, {
          configured: false,
          authRequired: false,
          bootstrapRequired: false,
          setupTokenConfigured: false,
        });
      }
      const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
      const hasKey = Boolean(rows[0]?.apiKeyHash);
      return status(HTTP_STATUS_OK, {
        authRequired: true,
        configured: hasKey,
        bootstrapRequired: !hasKey,
        setupTokenConfigured: config.authSetupToken !== null,
      });
    },
  )
  .get(
    toApiChildPath(API_ENDPOINTS.authBase, API_ENDPOINTS.authConfigured),
    {
      // no inline detail for rotate,revoke routes
      response: authConfiguredResponses,
    },
    async ({ status }) => {
      if (config.disableAuth) {
        return status(HTTP_STATUS_OK, { configured: false });
      }
      const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
      const hasKey = Boolean(rows[0]?.apiKeyHash);
      return status(HTTP_STATUS_OK, { configured: hasKey });
    },
  )
  .use(
    new Elysia()
      .use(
        rateLimit({
          scoping: "scoped",
          duration: RATE_LIMIT_AUTH_BOOTSTRAP_DURATION_MS,
          max: RATE_LIMIT_AUTH_BOOTSTRAP_MAX_REQUESTS,
          generator: (request) => resolveRateLimitClientKey(request),
        }),
      )
      .post(
        toApiChildPath(API_ENDPOINTS.authBase, API_ENDPOINTS.authInit),
        {
          // no inline detail for rotate,revoke routes
          body: authBootstrapBody,
          response: authInitResponses,
        },
        async ({ body, request, status }) => {
          if (config.disableAuth) {
            return status(HTTP_STATUS_OK, {
              configured: false,
              message: API_MESSAGE_AUTH_DISABLED,
            });
          }

          const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
          const existingHash = rows[0]?.apiKeyHash;

          if (existingHash) {
            return status(HTTP_STATUS_OK, {
              configured: true,
              message: API_MESSAGE_API_KEY_ALREADY_CONFIGURED,
            });
          }

          const expectedSetupToken = config.authSetupToken;
          if (!expectedSetupToken) {
            return status(HTTP_STATUS_FORBIDDEN, {
              error: API_ERROR_AUTH_SETUP_TOKEN_UNAVAILABLE,
            });
          }

          const providedSetupToken = resolveSetupToken(request, body);
          if (!providedSetupToken) {
            return status(HTTP_STATUS_BAD_REQUEST, {
              error: API_ERROR_AUTH_SETUP_TOKEN_REQUIRED,
            });
          }

          const providedSetupTokenBytes = Buffer.from(providedSetupToken, "utf8");
          const expectedSetupTokenBytes = Buffer.from(expectedSetupToken, "utf8");
          if (
            providedSetupTokenBytes.length !== expectedSetupTokenBytes.length ||
            !timingSafeEqual(providedSetupTokenBytes, expectedSetupTokenBytes)
          ) {
            return status(HTTP_STATUS_FORBIDDEN, {
              error: API_ERROR_AUTH_SETUP_TOKEN_INVALID,
            });
          }

          const rawApiKey = generateApiKey();
          const keyHash = hashApiKey(rawApiKey);
          const now = new Date().toISOString();

          await db
            .insert(auth)
            .values({
              id: DEFAULT_PROFILE_ID,
              apiKeyHash: keyHash,
              apiKeyCreatedAt: now,
              apiKeyExpiresAt: null,
              apiKeyRevokedAt: null,
            })
            .onConflictDoUpdate({
              target: auth.id,
              set: {
                apiKeyHash: keyHash,
                apiKeyCreatedAt: now,
                apiKeyExpiresAt: null,
                apiKeyRevokedAt: null,
              },
            });

          await insertAuditLog("api_key_created", "system", "first_run_bootstrap");

          return status(HTTP_STATUS_OK, {
            configured: true,
            apiKey: rawApiKey,
            message: API_MESSAGE_SAVE_API_KEY_ONCE,
          });
        },
      )
      .post(
        "/rotate",
        {
          // no inline detail for rotate,revoke routes
        },
        async ({ request, status }) => {
          const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
          const row = rows[0];
          if (!row?.apiKeyHash) {
            return status(HTTP_STATUS_NOT_FOUND, {
              error: "No API key configured to rotate",
            });
          }

          const parsed = (() => {
            const raw = request.headers.get("authorization");
            if (!raw?.startsWith("Bearer ")) return "";
            return raw.slice("Bearer ".length).trim();
          })();

          if (!parsed || !verifyApiKey(parsed, row.apiKeyHash)) {
            return status(HTTP_STATUS_FORBIDDEN, {
              error: API_ERROR_MISSING_AUTH_HEADER,
            });
          }

          const newRawKey = generateApiKey();
          const newHash = hashApiKey(newRawKey);
          const now = new Date().toISOString();

          await db
            .update(auth)
            .set({
              apiKeyHash: newHash,
              apiKeyCreatedAt: now,
              apiKeyExpiresAt: null,
              apiKeyRevokedAt: null,
            })
            .where(eq(auth.id, DEFAULT_PROFILE_ID));

          await insertAuditLog("api_key_rotated", "admin", "manual_rotation");

          return status(HTTP_STATUS_OK, {
            configured: true,
            apiKey: newRawKey,
            message: "API key rotated. Save this new key — it will not be shown again.",
          });
        },
      )
      .post(
        "/revoke",
        {
          // no inline detail for rotate,revoke routes
        },
        async ({ request, status }) => {
          const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
          const row = rows[0];
          if (!row?.apiKeyHash) {
            return status(HTTP_STATUS_NOT_FOUND, {
              error: "No API key configured to revoke",
            });
          }

          const parsed = (() => {
            const raw = request.headers.get("authorization");
            if (!raw?.startsWith("Bearer ")) return "";
            return raw.slice("Bearer ".length).trim();
          })();

          if (!parsed || !verifyApiKey(parsed, row.apiKeyHash)) {
            return status(HTTP_STATUS_FORBIDDEN, {
              error: API_ERROR_MISSING_AUTH_HEADER,
            });
          }

          const now = new Date().toISOString();
          await db
            .update(auth)
            .set({ apiKeyRevokedAt: now })
            .where(eq(auth.id, DEFAULT_PROFILE_ID));

          await insertAuditLog("api_key_revoked", "admin", "manual_revocation");

          return status(HTTP_STATUS_OK, {
            revoked: true,
            message: "API key has been revoked.",
          });
        },
      ),
  );
