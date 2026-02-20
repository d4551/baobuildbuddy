import type { App } from "@bao/server/app";
import { treaty } from "@elysiajs/eden";

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

/**
 * Resolves runtime API base from public config and current request URL.
 *
 * @param configuredBase Runtime-configured API base.
 * @param requestUrl Current request URL.
 * @returns Absolute, normalized base URL without trailing slash.
 */
function resolveApiBase(configuredBase: string, requestUrl: URL): string {
  const isAbsolute = /^https?:\/\//i.test(configuredBase);
  const baseUrl = isAbsolute ? configuredBase : new URL(configuredBase, requestUrl).toString();
  return baseUrl.replace(/\/$/, "");
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
