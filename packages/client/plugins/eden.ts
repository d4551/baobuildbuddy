import { treaty } from "@elysiajs/eden";
import type { App } from "@navi/server/app";

const AUTH_KEY = "bao_api_key";

export function getStoredApiKey(): string | null {
  if (import.meta.server) return null;
  try {
    return localStorage.getItem(AUTH_KEY);
  } catch {
    return null;
  }
}

export function setStoredApiKey(key: string | null): void {
  if (import.meta.server) return;
  try {
    if (key) localStorage.setItem(AUTH_KEY, key);
    else localStorage.removeItem(AUTH_KEY);
  } catch {
    // Ignore storage errors
  }
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const requestUrl = useRequestURL();
  const configuredBase = (config.public.apiBase || "/").toString();
  const apiBase = new URL(configuredBase, requestUrl).toString().replace(/\/$/, "");
  const api = treaty<App>(apiBase, {
    headers: () => {
      const key = getStoredApiKey();
      return key ? { Authorization: `Bearer ${key}` } : {};
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
