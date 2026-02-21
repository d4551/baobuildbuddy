import type { App } from "@bao/server/app";
import { treaty } from "@elysiajs/eden";
import { resolveApiBase } from "~/utils/endpoints";

const AUTH_KEY = "bao_api_key";

type TreatyClient = ReturnType<typeof treaty<App>>;
export type EdenApiNamespace = TreatyClient["api"];

function hasBrowserStorage(): boolean {
  return import.meta.client && typeof window !== "undefined" && "localStorage" in window;
}

/**
 * Reads API key from browser storage.
 *
 * @returns Stored API key when available.
 */
export function getStoredApiKey(): string | null {
  if (!hasBrowserStorage()) return null;
  return window.localStorage.getItem(AUTH_KEY);
}

/**
 * Persists or clears API key in browser storage.
 *
 * @param key API key value.
 */
export function setStoredApiKey(key: string | null): void {
  if (!hasBrowserStorage()) return;
  if (key) window.localStorage.setItem(AUTH_KEY, key);
  else window.localStorage.removeItem(AUTH_KEY);
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const configuredBase = (config.public.apiBase || "/").toString();
  const apiBase = resolveApiBase(configuredBase, requestUrl);
  const api = treaty<App>(apiBase, {
    fetch: {
      credentials: "include",
    },
    headers: () => {
      const key = getStoredApiKey();
      return key ? { Authorization: `Bearer ${key}` } : {};
    },
    onResponse: async (response) => {
      if (response.status === 401) {
        setStoredApiKey(null);
      }
    },
  });

  return {
    provide: {
      api: api.api, // enters the /api prefix group
      getStoredApiKey,
      setStoredApiKey,
    },
  };
});
