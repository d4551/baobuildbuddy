import type { Ref } from "vue";
import { AUTH_KEY_STORAGE_KEY } from "@bao/shared";
import type { App } from "@bao/server/app";
import { treaty } from "@elysiajs/eden";
import { tryUseNuxtApp } from "nuxt/app";
import { resolveApiBase } from "~/utils/endpoints";

const AUTH_KEY = AUTH_KEY_STORAGE_KEY;

type TreatyClient = ReturnType<typeof treaty<App>>;
export type EdenApiNamespace = TreatyClient["api"];

type StoredApiKey = string | null;
type AuthKeyCookieRef = Ref<StoredApiKey> | null;

function hasBrowserStorage(): boolean {
  return import.meta.client && typeof window !== "undefined" && "localStorage" in window;
}

function getAuthKeyCookieRef() {
  return useCookie<StoredApiKey>(AUTH_KEY, {
    default: () => null,
    path: "/",
    sameSite: "lax",
  });
}

function getLocalStorageApiKey(): string | null {
  if (!hasBrowserStorage()) return null;
  return window.localStorage.getItem(AUTH_KEY);
}

function setLocalStorageApiKey(apiKey: string | null): void {
  if (!hasBrowserStorage()) return;
  if (apiKey) {
    window.localStorage.setItem(AUTH_KEY, apiKey);
    return;
  }
  window.localStorage.removeItem(AUTH_KEY);
}

function resolveAuthKeyCookieRef(): AuthKeyCookieRef {
  return tryUseNuxtApp() ? getAuthKeyCookieRef() : null;
}

function readStoredApiKey(cookieRef: AuthKeyCookieRef): string | null {
  const localStorageApiKey = getLocalStorageApiKey();
  if (localStorageApiKey) {
    if (cookieRef && !cookieRef.value) {
      cookieRef.value = localStorageApiKey;
    }
    return localStorageApiKey;
  }

  return cookieRef?.value ?? null;
}

function writeStoredApiKey(cookieRef: AuthKeyCookieRef, apiKey: string | null): void {
  setLocalStorageApiKey(apiKey);
  if (cookieRef) {
    cookieRef.value = apiKey;
  }
}

/**
 * Reads API key from local storage or server-synced auth cookie.
 *
 * @returns Stored API key when available.
 */
export function getStoredApiKey(): string | null {
  return readStoredApiKey(resolveAuthKeyCookieRef());
}

/**
 * Persists or clears API key in local storage and auth cookie.
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
  const apiBase = resolveApiBase(configuredBase, requestUrl);

  const readApiKey = () => readStoredApiKey(cookieRef);
  const writeApiKey = (key: string | null) => writeStoredApiKey(cookieRef, key);

  const api = treaty<App>(apiBase, {
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

  return {
    provide: {
      api: api.api, // enters the /api prefix group
      getStoredApiKey: readApiKey,
      setStoredApiKey: writeApiKey,
    },
  };
});
