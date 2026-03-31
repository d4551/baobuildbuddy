import { toErrorMessage } from "@bao/shared/utils/error-helpers";
import { useNuxtRuntimeApp } from "./nuxtRuntime";
import { useApi } from "./useApi";

interface AuthStatus {
  authRequired: boolean;
  configured: boolean;
  bootstrapRequired: boolean;
  setupTokenConfigured: boolean;
}

interface AuthInitResult {
  configured: boolean;
  apiKey?: string;
  message?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface UseAuthState {
  checkAuthStatus: () => Promise<AuthStatus>;
  initAuth: (setupToken?: string) => Promise<AuthInitResult>;
  getStoredApiKey: () => string | null;
  setStoredApiKey: (key: string | null) => void;
}

const AUTH_INIT_FAILED_ERROR_KEY = "apiErrors.auth.initFailed";

/**
 * Authentication composable.
 *
 * @returns Auth helpers used by navigation guards and setup flows.
 */
export function useAuth(): UseAuthState {
  const api = useApi();
  const nuxtApp = useNuxtRuntimeApp();
  const authNotConfigured: AuthStatus = {
    authRequired: false,
    configured: false,
    bootstrapRequired: false,
    setupTokenConfigured: false,
  };

  async function checkAuthStatus(): Promise<AuthStatus> {
    const { data, error } = await api.auth.status.get();
    if (error) return authNotConfigured;
    return {
      authRequired: data?.authRequired ?? true,
      configured: data?.configured ?? false,
      bootstrapRequired: data?.bootstrapRequired ?? false,
      setupTokenConfigured: data?.setupTokenConfigured ?? false,
    };
  }

  async function initAuth(setupToken?: string) {
    const requestBody =
      typeof setupToken === "string" && setupToken.trim().length > 0
        ? { setupToken: setupToken.trim() }
        : undefined;
    const { data, error } = await api.auth.init.post(requestBody);
    if (error) {
      throw new Error(toErrorMessage(error, AUTH_INIT_FAILED_ERROR_KEY));
    }
    const payload = data ?? {};
    if (!isRecord(payload)) {
      return { configured: false };
    }

    const configured = payload.configured === true;
    const apiKey = typeof payload.apiKey === "string" ? payload.apiKey : undefined;
    const message = typeof payload.message === "string" ? payload.message : undefined;

    return { configured, apiKey, message };
  }

  return {
    checkAuthStatus,
    initAuth,
    getStoredApiKey: () => nuxtApp.$getStoredApiKey?.() ?? null,
    setStoredApiKey: (key: string | null) => nuxtApp.$setStoredApiKey?.(key),
  };
}
