export function useAuth() {
  const api = useApi();

  async function checkAuthStatus() {
    const { data, error } = await api.auth.status.get();
    if (error) return { authRequired: false, configured: false };
    return data ?? { authRequired: false, configured: false };
  }

  async function initAuth() {
    const { data, error } = await api.auth.init.post();
    if (error) throw new Error(error.value?.message ?? "Failed to init auth");
    return data ?? {};
  }

  const nuxtApp = useNuxtApp();
  return {
    checkAuthStatus,
    initAuth,
    getStoredApiKey: () => nuxtApp.$getStoredApiKey?.() ?? null,
    setStoredApiKey: (key: string | null) => nuxtApp.$setStoredApiKey?.(key),
  };
}
