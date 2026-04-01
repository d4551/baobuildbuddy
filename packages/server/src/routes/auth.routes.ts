import {
  API_ERROR_AUTH_SETUP_TOKEN_INVALID,
  API_ERROR_AUTH_SETUP_TOKEN_REQUIRED,
  API_ERROR_AUTH_SETUP_TOKEN_UNAVAILABLE,
} from "@bao/shared/constants/api-errors";
import { API_ENDPOINTS, toApiChildPath, toApiScopedPath } from "@bao/shared/constants/endpoints";
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
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_FORBIDDEN } from "@bao/shared/constants/http";
import { DEFAULT_PROFILE_ID } from "@bao/shared/types/settings-defaults";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { config } from "../config/env";
import {
  RATE_LIMIT_AUTH_BOOTSTRAP_DURATION_MS,
  RATE_LIMIT_AUTH_BOOTSTRAP_MAX_REQUESTS,
} from "../config/rate-limit";
import { db } from "../db/client";
import { auth } from "../db/schema/auth";
import { resolveRateLimitClientKey } from "../utils/rate-limit";
import {
  authBootstrapBody,
  type AuthBootstrapBody,
  type RouteSetState,
} from "./auth-route-contracts";

const BASE64URL_PADDING_PATTERN = /=+$/u;

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

export const authRoutes = new Elysia({
  prefix: toApiScopedPath(API_ENDPOINTS.authBase),
  tags: ["Auth"],
})
  .get(toApiChildPath(API_ENDPOINTS.authBase, API_ENDPOINTS.authStatus), async () => {
    if (config.disableAuth) {
      return {
        configured: false,
        authRequired: false,
        bootstrapRequired: false,
        setupTokenConfigured: false,
      };
    }
    const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const hasKey = Boolean(rows[0]?.apiKey);
    return {
      authRequired: true,
      configured: hasKey,
      bootstrapRequired: !hasKey,
      setupTokenConfigured: config.authSetupToken !== null,
    };
  })
  .get(toApiChildPath(API_ENDPOINTS.authBase, API_ENDPOINTS.authConfigured), async () => {
    if (config.disableAuth) {
      return { configured: false };
    }
    const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
    const hasKey = Boolean(rows[0]?.apiKey);
    return { configured: hasKey };
  })
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
        async ({
          body,
          request,
          set,
        }: {
          body: AuthBootstrapBody;
          request: Request;
          set: RouteSetState;
        }) => {
          if (config.disableAuth) {
            return { configured: false, message: API_MESSAGE_AUTH_DISABLED };
          }

          const rows = await db.select().from(auth).where(eq(auth.id, DEFAULT_PROFILE_ID));
          const existingApiKey = rows[0]?.apiKey;

          if (existingApiKey) {
            return {
              configured: true,
              message: API_MESSAGE_API_KEY_ALREADY_CONFIGURED,
            };
          }

          const expectedSetupToken = config.authSetupToken;
          if (!expectedSetupToken) {
            set.status = HTTP_STATUS_FORBIDDEN;
            return {
              error: API_ERROR_AUTH_SETUP_TOKEN_UNAVAILABLE,
            };
          }

          const providedSetupToken = resolveSetupToken(request, body);
          if (!providedSetupToken) {
            set.status = HTTP_STATUS_BAD_REQUEST;
            return {
              error: API_ERROR_AUTH_SETUP_TOKEN_REQUIRED,
            };
          }
          if (providedSetupToken !== expectedSetupToken) {
            set.status = HTTP_STATUS_FORBIDDEN;
            return {
              error: API_ERROR_AUTH_SETUP_TOKEN_INVALID,
            };
          }

          const apiKey = generateApiKey();
          await db.insert(auth).values({ id: DEFAULT_PROFILE_ID, apiKey }).onConflictDoUpdate({
            target: auth.id,
            set: { apiKey },
          });

          return {
            configured: true,
            apiKey,
            message: API_MESSAGE_SAVE_API_KEY_ONCE,
          };
        },
        {
          body: authBootstrapBody,
        },
      ),
  );
