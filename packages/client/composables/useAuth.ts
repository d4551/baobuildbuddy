import { useNuxtRuntimeApp } from "./nuxtRuntime";
import { useApi } from "./useApi";

interface AuthStatus {
  authRequired: boolean;
  configured: boolean;
}

interface UseAuthState {
  checkAuthStatus: () => Promise<AuthStatus>;
  initAuth: () => Promise<Record<string, unknown>>;
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
  const authNotConfigured: AuthStatus = { authRequired: false, configured: false };

  async function checkAuthStatus(): Promise<AuthStatus> {
    const { data, error } = await api.auth.status.get();
    if (error) return authNotConfigured;
    return {
      authRequired: data?.authRequired ?? true,
      configured: data?.configured ?? false,
    };
  }

  async function initAuth() {
    const { data, error } = await api.auth.init.post();
    if (error) throw new Error(AUTH_INIT_FAILED_ERROR_KEY);
    return data ?? {};
  }

  return {
    checkAuthStatus,
    initAuth,
    getStoredApiKey: () => nuxtApp.$getStoredApiKey?.() ?? null,
    setStoredApiKey: (key: string | null) => nuxtApp.$setStoredApiKey?.(key),
  };
}
