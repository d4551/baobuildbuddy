import type { App } from "@bao/server/app";
import { AUTH_KEY_STORAGE_KEY } from "@bao/shared/constants/auth";
import { treaty } from "@elysiajs/eden";
import { tryUseNuxtApp } from "nuxt/app";
import type { Ref } from "vue";
import { assertClientApi } from "~/types/client-api";
import { resolveTreatyBase } from "~/utils/treaty-base";

const AUTH_KEY = AUTH_KEY_STORAGE_KEY;

type StoredApiKey = string | null;
type AuthKeyCookieRef = Ref<StoredApiKey> | null;

function getAuthKeyCookieRef() {
  return useCookie<StoredApiKey>(AUTH_KEY, {
    default: () => null,
    path: "/",
    sameSite: "strict",
    httpOnly: true,
    secure: true,
  });
}

function resolveAuthKeyCookieRef(): AuthKeyCookieRef {
  return tryUseNuxtApp() ? getAuthKeyCookieRef() : null;
}

function readStoredApiKey(cookieRef: AuthKeyCookieRef): string | null {
  return cookieRef?.value ?? null;
}

function writeStoredApiKey(cookieRef: AuthKeyCookieRef, apiKey: string | null): void {
  if (cookieRef) {
    cookieRef.value = apiKey;
  }
}

/**
 * Reads API key from the httpOnly auth cookie.
 *
 * @returns Stored API key when available.
 */
export function getStoredApiKey(): string | null {
  return readStoredApiKey(resolveAuthKeyCookieRef());
}

/**
 * Persists or clears API key in the httpOnly auth cookie.
 *
 * @param key API key value.
 */
export function setStoredApiKey(key: string | null): void {
  writeStoredApiKey(resolveAuthKeyCookieRef(), key);
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const cookieRef = getAuthKeyCookieRef();

  const configuredBase = (config.public.apiBase || "/").toString();
  const treatyBase = resolveTreatyBase(configuredBase, requestUrl);

  const readApiKey = () => readStoredApiKey(cookieRef);
  const writeApiKey = (key: string | null) => writeStoredApiKey(cookieRef, key);

  const api = treaty<App>(treatyBase, {
    fetch: {
      credentials: "include",
    },
    headers: () => {
      const key = readApiKey();
      return key ? { Authorization: `Bearer ${key}` } : {};
    },
    onResponse: (response) => {
      if (response.status === 401) {
        writeApiKey(null);
      }
    },
  });

  assertClientApi(api.api);

  return {
    provide: {
      api: api.api, // enters the /api prefix group
      getStoredApiKey: readApiKey,
      setStoredApiKey: writeApiKey,
    },
  };
});
