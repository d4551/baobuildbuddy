import { AUTH_KEY_STORAGE_KEY } from "@bao/shared";
import type { App } from "@bao/server/app";
import { treaty } from "@elysiajs/eden";
import { resolveApiBase } from "~/utils/endpoints";

const AUTH_KEY = AUTH_KEY_STORAGE_KEY;

type TreatyClient = ReturnType<typeof treaty<App>>;
export type EdenApiNamespace = TreatyClient["api"];

type StoredApiKey = string | null;

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

/**
 * Reads API key from local storage or server-synced auth cookie.
 *
 * @returns Stored API key when available.
 */
export function getStoredApiKey(): string | null {
  const cookieRef = getAuthKeyCookieRef();
  const localStorageApiKey = getLocalStorageApiKey();
  if (localStorageApiKey) {
    if (!cookieRef.value) {
      cookieRef.value = localStorageApiKey;
    }
    return localStorageApiKey;
  }
  return cookieRef.value;
}

/**
 * Persists or clears API key in local storage and auth cookie.
 *
 * @param key API key value.
 */
export function setStoredApiKey(key: string | null): void {
  const cookieRef = getAuthKeyCookieRef();
  setLocalStorageApiKey(key);
  cookieRef.value = key;
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();

  const configuredBase = (config.public.apiBase || "/").toString();
  const apiBase = resolveApiBase(configuredBase, requestUrl);

  const readApiKey = getStoredApiKey;
  const writeApiKey = setStoredApiKey;

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
